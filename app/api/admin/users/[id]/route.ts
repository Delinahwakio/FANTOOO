import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users/[id]
 * 
 * Get detailed information about a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user details
    const { data: userData, error: userError } = await supabase
      .from('real_users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch ban circumvention data
    const { data: circumventionData } = await supabase
      .from('banned_users_tracking')
      .select('*')
      .eq('user_id', params.id)
      .single();

    // Fetch recent activity
    const { data: recentActivity } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch chat statistics
    const { data: chatStats } = await supabase
      .from('chats')
      .select('status, total_credits_spent')
      .eq('real_user_id', params.id);

    const activeChatCount = chatStats?.filter(c => c.status === 'active').length || 0;
    const totalCreditsSpent = chatStats?.reduce((sum, c) => sum + (c.total_credits_spent || 0), 0) || 0;

    return NextResponse.json({
      user: userData,
      circumvention: circumventionData,
      recentActivity: recentActivity || [],
      stats: {
        activeChats: activeChatCount,
        totalCreditsSpent,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * 
 * Delete user account with GDPR compliance
 * - Anonymizes messages
 * - Archives user data
 * - Calculates refund for unused credits
 * - Closes active chats
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role and permissions
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check delete_data permission
    const permissions = admin.permissions as any;
    if (!permissions?.delete_data && admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get deletion reason from request body
    const body = await request.json();
    const deletionReason = body.reason || 'Admin initiated deletion';

    // Call the Edge Function to handle GDPR-compliant deletion
    const { data, error } = await supabase.functions.invoke('delete-user-account', {
      body: {
        userId: params.id,
        deletionReason,
        adminId: admin.id,
      },
    });

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully',
      refundAmount: data.refundAmount,
      messagesAnonymized: data.messagesAnonymized,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
