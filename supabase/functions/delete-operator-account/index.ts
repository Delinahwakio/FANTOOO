import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DeleteOperatorRequest {
  operatorId: string;
  adminId: string;
  reason?: string;
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

    const { operatorId, adminId, reason }: DeleteOperatorRequest = await req.json();

    // Validate required fields
    if (!operatorId || !adminId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: operatorId, adminId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Verify admin exists and has permission
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('id', adminId)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ error: 'Admin not found or not authorized' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if admin has permission to manage operators
    const permissions = admin.permissions as Record<string, boolean>;
    if (!permissions.manage_operators && admin.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Admin does not have permission to delete operators' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Get operator details
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('id', operatorId)
      .single();

    if (operatorError || !operator) {
      return new Response(
        JSON.stringify({ error: 'Operator not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if operator is already deleted
    if (operator.deleted_at) {
      return new Response(
        JSON.stringify({ error: 'Operator already deleted' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    console.log(`Checking active chats for operator ${operatorId}: ${operator.name}`);

    // Check for active chats
    const { data: activeChats, error: chatsError } = await supabase
      .from('chats')
      .select('id, real_user_id, fictional_user_id')
      .eq('assigned_operator_id', operatorId)
      .eq('status', 'active');

    if (chatsError) {
      console.error('Error checking active chats:', chatsError);
      throw chatsError;
    }

    if (activeChats && activeChats.length > 0) {
      console.log(`Operator has ${activeChats.length} active chats - cannot delete`);
      return new Response(
        JSON.stringify({
          error: `Cannot delete operator with ${activeChats.length} active chat${
            activeChats.length > 1 ? 's' : ''
          }. Please reassign or close them first.`,
          activeChatsCount: activeChats.length,
          activeChats: activeChats.map((chat) => ({
            id: chat.id,
            realUserId: chat.real_user_id,
            fictionalUserId: chat.fictional_user_id,
          })),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    console.log(`No active chats found. Proceeding with deletion.`);

    // Get total chats handled for logging
    const { data: totalChats } = await supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_operator_id', operatorId);

    // Soft delete operator (preserve performance data)
    const { error: deleteError } = await supabase
      .from('operators')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        is_available: false,
      })
      .eq('id', operatorId);

    if (deleteError) {
      console.error('Error soft deleting operator:', deleteError);
      throw deleteError;
    }

    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(operator.auth_id);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // Continue even if auth deletion fails - operator is already soft deleted
    }

    // Log the deletion in user activity log
    const { error: logError } = await supabase.from('user_activity_log').insert({
      user_id: adminId,
      activity_type: 'operator_deleted',
      entity_type: 'operator',
      entity_id: operatorId,
      metadata: {
        operator_name: operator.name,
        operator_email: operator.email,
        reason: reason || 'admin_action',
        total_chats_handled: operator.total_chats_handled,
        quality_score: operator.quality_score,
      },
    });

    if (logError) {
      console.error('Error logging deletion:', logError);
      // Don't throw - logging is not critical
    }

    console.log(`Operator ${operatorId} deleted successfully by admin ${adminId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Operator deleted successfully',
        details: {
          operatorId: operator.id,
          operatorName: operator.name,
          totalChatsHandled: operator.total_chats_handled,
          qualityScore: operator.quality_score,
          performanceDataPreserved: true,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Delete operator error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete operator account',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
