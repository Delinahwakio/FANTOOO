import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Auto-close inactive chats
 * Scheduled to run hourly
 * Closes chats with no activity for 24 hours
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log(`Checking for inactive chats since ${twentyFourHoursAgo.toISOString()}`);

    // Find active chats with no activity for 24 hours
    const { data: inactiveChats, error: fetchError } = await supabase
      .from('chats')
      .select('id, real_user_id, fictional_user_id, last_message_at, message_count')
      .eq('status', 'active')
      .lt('last_message_at', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching inactive chats:', fetchError);
      throw fetchError;
    }

    if (!inactiveChats || inactiveChats.length === 0) {
      console.log('No inactive chats found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No inactive chats to close',
          closedCount: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    console.log(`Found ${inactiveChats.length} inactive chats to close`);

    // Close each inactive chat
    const chatIds = inactiveChats.map(chat => chat.id);
    const { data: closedChats, error: closeError } = await supabase
      .from('chats')
      .update({
        status: 'closed',
        close_reason: 'inactivity_timeout',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', chatIds)
      .select('id');

    if (closeError) {
      console.error('Error closing chats:', closeError);
      throw closeError;
    }

    const closedCount = closedChats?.length || 0;
    console.log(`Successfully closed ${closedCount} inactive chats`);

    // Log the closure for each chat
    for (const chat of inactiveChats) {
      await supabase.from('user_activity_log').insert({
        user_id: chat.real_user_id,
        activity_type: 'chat_auto_closed',
        entity_type: 'chat',
        entity_id: chat.id,
        metadata: {
          reason: 'inactivity_timeout',
          last_message_at: chat.last_message_at,
          message_count: chat.message_count,
        },
      });
    }

    // Create admin notification if many chats were closed
    if (closedCount > 10) {
      await supabase.from('admin_notifications').insert({
        type: 'system_error',
        message: `Auto-closed ${closedCount} inactive chats`,
        metadata: {
          closedCount,
          threshold: 24,
          timestamp: new Date().toISOString(),
        },
        priority: 'normal',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully closed ${closedCount} inactive chats`,
        closedCount,
        chatIds: closedChats?.map(c => c.id) || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Auto-close error:', error);
    
    // Create admin notification for error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase.from('admin_notifications').insert({
        type: 'system_error',
        message: 'Failed to auto-close inactive chats',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
      });
    } catch (notifError) {
      console.error('Failed to create admin notification:', notifError);
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to auto-close inactive chats',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
