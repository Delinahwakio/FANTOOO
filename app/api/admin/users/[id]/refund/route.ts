import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/users/[id]/refund
 * 
 * Process credit refund for a user
 * Creates audit trail and adds credits back to user account
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

    // Check manage_payments permission
    const permissions = admin.permissions as any;
    if (!permissions?.manage_payments && admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get refund details from request body
    const body = await request.json();
    const { amount, reason, notes, messageId, chatId } = body;

    // Validate inputs
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Refund reason is required' }, { status: 400 });
    }

    // Validate reason is from allowed list
    const validReasons = [
      'accidental_send',
      'inappropriate_content',
      'system_error',
      'admin_discretion',
      'account_deletion',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid refund reason' }, { status: 400 });
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from('real_users')
      .select('id, username, credits')
      .eq('id', params.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add credits to user account
    const { error: updateError } = await supabase
      .from('real_users')
      .update({
        credits: userData.credits + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    // Create refund audit record
    const { error: refundError } = await supabase
      .from('credit_refunds')
      .insert({
        user_id: params.id,
        amount,
        reason,
        message_id: messageId || null,
        chat_id: chatId || null,
        processed_by: admin.id,
        notes: notes || null,
        status: 'completed',
      });

    if (refundError) {
      console.error('Error creating refund record:', refundError);
      // Don't fail the request if audit fails, credits were already added
    }

    // Create admin notification
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'high_refund_rate',
        message: `Credit refund processed: ${amount} credits to user ${userData.username}`,
        metadata: {
          userId: params.id,
          amount,
          reason,
          processedBy: admin.id,
        },
        priority: 'normal',
      });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      newBalance: userData.credits + amount,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/users/[id]/refund
 * 
 * Get refund history for a user
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
      .select('id')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch refund history
    const { data: refunds, error: refundsError } = await supabase
      .from('credit_refunds')
      .select(`
        *,
        processed_by_admin:admins!credit_refunds_processed_by_fkey(name, email)
      `)
      .eq('user_id', params.id)
      .order('created_at', { ascending: false });

    if (refundsError) {
      console.error('Error fetching refunds:', refundsError);
      return NextResponse.json({ error: 'Failed to fetch refund history' }, { status: 500 });
    }

    return NextResponse.json({ refunds: refunds || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]/refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
