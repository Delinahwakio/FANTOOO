import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * 
 * Fetch all real users with search and filtering
 * 
 * Query params:
 * - search: Search by username, email, or display name
 * - status: Filter by status (all, active, banned, suspended)
 * - tier: Filter by user tier
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const tier = searchParams.get('tier') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('real_users')
      .select(`
        id,
        username,
        display_name,
        email,
        age,
        gender,
        looking_for,
        location,
        credits,
        total_spent,
        user_tier,
        total_messages_sent,
        total_chats,
        is_active,
        is_verified,
        is_banned,
        ban_reason,
        banned_until,
        last_active_at,
        created_at
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true).eq('is_banned', false);
    } else if (status === 'banned') {
      query = query.eq('is_banned', true);
    } else if (status === 'suspended') {
      query = query.eq('is_active', false).eq('is_banned', false);
    }

    // Apply tier filter
    if (tier !== 'all') {
      query = query.eq('user_tier', tier);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Check for ban circumvention attempts for each user
    const usersWithAlerts = await Promise.all(
      (users || []).map(async (user) => {
        const { data: circumventionData } = await supabase
          .from('banned_users_tracking')
          .select('circumvention_attempts, last_attempt_at')
          .eq('user_id', user.id)
          .single();

        return {
          ...user,
          circumvention_attempts: circumventionData?.circumvention_attempts || 0,
          last_circumvention_attempt: circumventionData?.last_attempt_at || null,
        };
      })
    );

    return NextResponse.json({
      users: usersWithAlerts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
