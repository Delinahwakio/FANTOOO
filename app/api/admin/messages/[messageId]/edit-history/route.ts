import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // Fetch edit history for the message
    const { data: history, error } = await supabase
      .from('message_edit_history')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching edit history:', error);
      return NextResponse.json({ error: 'Failed to fetch edit history' }, { status: 500 });
    }

    return NextResponse.json(history || []);
  } catch (error) {
    console.error('Error in GET /api/admin/messages/[messageId]/edit-history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
