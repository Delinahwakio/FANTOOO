import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
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

    const { chatId } = params;

    // Fetch reassignment history from admin_notifications
    // In a production system, you'd have a dedicated reassignment_history table
    const { data: history, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('type', 'chat_reassignment')
      .contains('metadata', { chat_id: chatId })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reassignment history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Transform the data to match expected format
    const formattedHistory = history.map(item => ({
      id: item.id,
      chat_id: chatId,
      from_operator_id: item.metadata?.from_operator_id,
      to_operator_id: item.metadata?.to_operator_id,
      reason: item.metadata?.reason || 'No reason provided',
      reassigned_by: item.metadata?.reassigned_by,
      created_at: item.created_at,
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Error in GET /api/admin/chats/[chatId]/reassignment-history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
