import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const notificationId = params.id;

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, is_active')
      .eq('auth_id', session.user.id)
      .single();

    if (adminError || !admin || !admin.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark notification as read
    const { data, error } = await supabase
      .from('admin_notifications')
      .update({
        is_read: true,
        read_by: admin.id,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
