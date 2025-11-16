import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DeleteUserRequest {
  userId: string;
  reason?: string;
  requestedBy?: string; // admin ID or 'self' for user-initiated deletion
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, reason, requestedBy }: DeleteUserRequest = await req.json();

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Get user details before deletion
    const { data: user, error: userError } = await supabase
      .from('real_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if user is already deleted
    if (user.deleted_at) {
      return new Response(
        JSON.stringify({ error: 'User already deleted' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Calculate refund for unused credits (10 KES per credit)
    const refundAmount = user.credits * 10;

    // Calculate account age in days
    const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    console.log(`Deleting user ${userId}: ${user.username} (${user.email})`);
    console.log(`Unused credits: ${user.credits}, Refund amount: ${refundAmount} KES`);

    // Archive user data in deleted_users table
    const { error: archiveError } = await supabase.from('deleted_users').insert({
      id: crypto.randomUUID(),
      original_user_id: user.id,
      username: user.username,
      email: user.email,
      deletion_reason: reason || 'user_requested',
      deletion_requested_at: new Date().toISOString(),
      deletion_completed_at: new Date().toISOString(),
      total_spent: user.total_spent,
      total_messages_sent: user.total_messages_sent,
      account_age_days: accountAgeDays,
      data_anonymized: true,
      messages_anonymized: true,
      unused_credits: user.credits,
      refund_amount: refundAmount,
      refund_processed: false,
    });

    if (archiveError) {
      console.error('Error archiving user data:', archiveError);
      throw archiveError;
    }

    // Get all chats for this user to anonymize messages
    const { data: userChats, error: chatsError } = await supabase
      .from('chats')
      .select('id')
      .eq('real_user_id', userId);

    if (chatsError) {
      console.error('Error fetching user chats:', chatsError);
      throw chatsError;
    }

    const chatIds = userChats?.map((chat) => chat.id) || [];

    // Anonymize messages from this user (keep for operators but remove user identification)
    if (chatIds.length > 0) {
      const { error: messagesError } = await supabase
        .from('messages')
        .update({
          content: '[Message from deleted user]',
          original_content: '[Deleted]',
        })
        .in('chat_id', chatIds)
        .eq('sender_type', 'real');

      if (messagesError) {
        console.error('Error anonymizing messages:', messagesError);
        throw messagesError;
      }

      console.log(`Anonymized messages in ${chatIds.length} chats`);
    }

    // Close all active chats
    const { error: closeChatsError } = await supabase
      .from('chats')
      .update({
        status: 'closed',
        close_reason: 'user_deleted',
        closed_at: new Date().toISOString(),
      })
      .eq('real_user_id', userId)
      .eq('status', 'active');

    if (closeChatsError) {
      console.error('Error closing chats:', closeChatsError);
      throw closeChatsError;
    }

    // Soft delete user (anonymize email and username to prevent conflicts)
    const { error: deleteError } = await supabase
      .from('real_users')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        email: `deleted_${userId}@fantooo.com`,
        username: `deleted_${userId}`,
      })
      .eq('id', userId);

    if (deleteError) {
      console.error('Error soft deleting user:', deleteError);
      throw deleteError;
    }

    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.auth_id);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // Continue even if auth deletion fails - user is already soft deleted
    }

    // Process refund if applicable
    if (refundAmount > 0) {
      const { error: refundError } = await supabase.from('credit_refunds').insert({
        user_id: userId,
        amount: user.credits,
        reason: 'account_deletion',
        notes: `Refund for ${user.credits} unused credits (${refundAmount} KES)`,
        status: 'pending',
        processed_by: requestedBy || null,
      });

      if (refundError) {
        console.error('Error creating refund record:', refundError);
        // Don't throw - refund can be processed manually
      }
    }

    console.log(`User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        refundAmount,
        refundCredits: user.credits,
        message: 'Account deleted successfully',
        details: {
          messagesAnonymized: chatIds.length > 0,
          chatsCount: chatIds.length,
          refundPending: refundAmount > 0,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete user account',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
