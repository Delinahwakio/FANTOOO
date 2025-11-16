import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/me/chats
 * Get current user's chat history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from real_users table
    const { data: realUser, error: userError } = await supabase
      .from('real_users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (userError || !realUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // active, closed, etc.

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('chats')
      .select(
        `
        *,
        fictional_user:fictional_users!fictional_user_id (
          id,
          name,
          age,
          gender,
          location,
          profile_pictures,
          is_featured
        )
      `,
        { count: 'exact' }
      )
      .eq('real_user_id', realUser.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: chats, error: chatsError, count } = await query;

    if (chatsError) {
      console.error('Error fetching chats:', chatsError);
      return NextResponse.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      );
    }

    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      chats: chats || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/me/chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
