import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { chatId } = params;
    const body = await request.json();
    const { operator_id, reason } = body;

    if (!operator_id || !reason) {
      return NextResponse.json(
        { error: 'operator_id and reason are required' },
        { status: 400 }
      );
    }

    // Get current chat details
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*, operator:operators!chats_assigned_operator_id_fkey(current_chat_count)')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify new operator exists and is available
    const { data: newOperator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('id', operator_id)
      .eq('is_active', true)
      .eq('is_suspended', false)
      .single();

    if (operatorError || !newOperator) {
      return NextResponse.json(
        { error: 'Operator not found or not available' },
        { status: 400 }
      );
    }

    // Check if operator has capacity
    if (newOperator.current_chat_count >= newOperator.max_concurrent_chats) {
      return NextResponse.json(
        { error: 'Operator has reached maximum concurrent chats' },
        { status: 400 }
      );
    }

    const oldOperatorId = chat.assigned_operator_id;

    // Update chat assignment
    const { error: updateError } = await supabase
      .from('chats')
      .update({
        assigned_operator_id: operator_id,
        assignment_time: new Date().toISOString(),
        assignment_count: chat.assignment_count + 1,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Error updating chat:', updateError);
      return NextResponse.json({ error: 'Failed to reassign chat' }, { status: 500 });
    }

    // Update operator chat counts
    if (oldOperatorId) {
      await supabase.rpc('decrement_operator_chat_count', { operator_id: oldOperatorId });
    }
    await supabase.rpc('increment_operator_chat_count', { operator_id });

    // Log reassignment (create a reassignment history table entry if it exists)
    // For now, we'll add it to admin_notifications
    await supabase.from('admin_notifications').insert({
      type: 'chat_reassignment',
      message: `Chat ${chatId} reassigned from ${oldOperatorId || 'unassigned'} to ${operator_id}`,
      priority: 'normal',
      metadata: {
        chat_id: chatId,
        from_operator_id: oldOperatorId,
        to_operator_id: operator_id,
        reason,
        reassigned_by: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat reassigned successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/chats/[chatId]/reassign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
