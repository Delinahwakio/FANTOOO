import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10');

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

    // Fetch recent activity from user_activity_log
    const { data: activities, error } = await supabase
      .from('user_activity_log')
      .select('id, activity_type, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity:', error);
      // Return empty array if table doesn't exist yet
      return NextResponse.json([]);
    }

    // Transform activities into readable descriptions
    const formattedActivities = (activities || []).map((activity: any) => {
      let description = '';
      
      switch (activity.activity_type) {
        case 'user_registered':
          description = 'New user registered';
          break;
        case 'chat_created':
          description = 'New chat started';
          break;
        case 'payment_completed':
          description = 'Payment completed';
          break;
        case 'operator_assigned':
          description = 'Operator assigned to chat';
          break;
        case 'chat_closed':
          description = 'Chat closed';
          break;
        case 'user_banned':
          description = 'User banned';
          break;
        case 'refund_processed':
          description = 'Refund processed';
          break;
        default:
          description = activity.activity_type.replace(/_/g, ' ');
      }

      return {
        id: activity.id,
        activity_type: activity.activity_type,
        description,
        created_at: activity.created_at,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
      };
    });

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
