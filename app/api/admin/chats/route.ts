import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('chats')
      .select(`
        *,
        real_user:real_users!chats_real_user_id_fkey(
          id, username, display_name, credits, user_tier, location
        ),
        fictional_user:fictional_users!chats_fictional_user_id_fkey(
          id, name, age, gender, response_style, is_featured
        ),
        operator:operators!chats_assigned_operator_id_fkey(
          id, name, quality_score, current_chat_count
        )
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      // Note: This is a simplified search. For production, consider full-text search
      query = query.or(`real_user.username.ilike.%${search}%,fictional_user.name.ilike.%${search}%`);
    }

    const { data: chats, error } = await query;

    if (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error in GET /api/admin/chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
