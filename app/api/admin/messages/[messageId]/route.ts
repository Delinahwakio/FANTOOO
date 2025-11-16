import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const supabase = createClient();
    
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

    const { messageId } = params;
    const body = await request.json();
    const { content, edit_reason } = body;

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Get original message
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !originalMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Store original content if this is the first edit
    const originalContent = originalMessage.is_edited 
      ? originalMessage.original_content 
      : originalMessage.content;

    // Update message
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        content,
        original_content: originalContent,
        is_edited: true,
        edited_by: admin.id,
        edited_at: new Date().toISOString(),
        edit_count: (originalMessage.edit_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    // Create edit history entry
    const { error: historyError } = await supabase
      .from('message_edit_history')
      .insert({
        message_id: messageId,
        original_content: originalMessage.content,
        new_content: content,
        edited_by: admin.id,
        editor_type: 'admin',
        edit_reason: edit_reason || null,
      });

    if (historyError) {
      console.error('Error creating edit history:', historyError);
      // Don't fail the request if history creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/messages/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
