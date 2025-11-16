import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/users/[id]/suspend
 * 
 * Suspend a user account (different from ban - temporary restriction)
 */
export async function POST(
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

    // Get suspension details from request body
    const body = await request.json();
    const { reason, duration } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 });
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('real_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error suspending user:', updateError);
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
    }

    // Close active chats
    const { error: closeChatsError } = await supabase
      .from('chats')
      .update({
        status: 'closed',
        close_reason: 'user_suspended',
        closed_at: new Date().toISOString(),
      })
      .eq('real_user_id', params.id)
      .eq('status', 'active');

    if (closeChatsError) {
      console.error('Error closing chats:', closeChatsError);
    }

    return NextResponse.json({
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/suspend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]/suspend
 * 
 * Reactivate a suspended user account
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

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('real_users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error reactivating user:', updateError);
      return NextResponse.json({ error: 'Failed to reactivate user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User reactivated successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]/suspend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
