import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const idsParam = searchParams.get('ids') || '';
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const minAge = searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!) : null;
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!) : null;
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // If IDs are provided, fetch specific profiles (for favorites page)
    if (idsParam) {
      const ids = idsParam.split(',').filter(id => id.trim());
      
      if (ids.length === 0) {
        return NextResponse.json({
          profiles: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        });
      }

      const { data, error } = await supabase
        .from('fictional_users')
        .select('*')
        .in('id', ids)
        .is('deleted_at', null)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching profiles by IDs:', error);
        return NextResponse.json(
          { error: 'Failed to fetch profiles' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        profiles: data || [],
        pagination: {
          page: 1,
          limit: ids.length,
          total: data?.length || 0,
          totalPages: 1,
          hasMore: false,
        },
      });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('fictional_users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .eq('is_active', true);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    if (minAge !== null) {
      query = query.gte('age', minAge);
    }

    if (maxAge !== null) {
      query = query.lte('age', maxAge);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    // Order by featured first, then popularity
    query = query
      .order('is_featured', { ascending: false })
      .order('popularity_score', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching fictional profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profiles: data || [],
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
