import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/fictional-profiles - List all fictional profiles with admin details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (!admin || !(admin.permissions as Record<string, boolean>)?.manage_fictional_profiles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query - admins can see all profiles including deleted
    let query = supabase
      .from('fictional_users')
      .select('*, created_by_admin:admins!fictional_users_created_by_fkey(name)', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    if (isFeatured !== null && isFeatured !== '') {
      query = query.eq('is_featured', isFeatured === 'true');
    }

    // Order by created_at descending
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching fictional profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Get active chat counts for each profile
    const profileIds = data?.map(p => p.id) || [];
    const { data: chatCounts } = await supabase
      .from('chats')
      .select('fictional_user_id')
      .in('fictional_user_id', profileIds)
      .eq('status', 'active');

    // Count active chats per profile
    const activeChatMap = (chatCounts || []).reduce((acc, chat) => {
      acc[chat.fictional_user_id] = (acc[chat.fictional_user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Add active chat count to each profile
    const profilesWithChatCount = data?.map(profile => ({
      ...profile,
      active_chat_count: activeChatMap[profile.id] || 0
    }));

    return NextResponse.json({
      profiles: profilesWithChatCount || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/admin/fictional-profiles - Create new fictional profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (!admin || !(admin.permissions as Record<string, boolean>)?.manage_fictional_profiles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.age || !body.gender || !body.location || !body.bio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate profile pictures (min 3, max 10)
    if (!body.profile_pictures || !Array.isArray(body.profile_pictures)) {
      return NextResponse.json(
        { error: 'profile_pictures must be an array' },
        { status: 400 }
      );
    }

    if (body.profile_pictures.length < 3 || body.profile_pictures.length > 10) {
      return NextResponse.json(
        { error: 'Profile must have between 3 and 10 pictures' },
        { status: 400 }
      );
    }

    // Validate age
    if (body.age < 18 || body.age > 100) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 100' },
        { status: 400 }
      );
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from('fictional_users')
      .insert({
        name: body.name,
        age: body.age,
        gender: body.gender,
        location: body.location,
        bio: body.bio,
        personality_traits: body.personality_traits || [],
        interests: body.interests || [],
        occupation: body.occupation || null,
        education: body.education || null,
        relationship_status: body.relationship_status || null,
        profile_pictures: body.profile_pictures,
        cover_photo: body.cover_photo || null,
        response_style: body.response_style || null,
        response_templates: body.response_templates || null,
        personality_guidelines: body.personality_guidelines || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        is_featured: body.is_featured || false,
        featured_until: body.featured_until || null,
        max_concurrent_chats: body.max_concurrent_chats || 10,
        tags: body.tags || [],
        category: body.category || null,
        created_by: admin.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating fictional profile:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
