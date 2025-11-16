import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get real user ID
    const { data: realUser, error: userError } = await supabase
      .from('real_users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !realUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get favorites
    const { data: favorites, error: favError } = await supabase
      .from('user_favorites')
      .select('fictional_user_id')
      .eq('real_user_id', realUser.id);

    if (favError) {
      console.error('Error fetching favorites:', favError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    const favoriteIds = favorites?.map(f => f.fictional_user_id) || [];

    return NextResponse.json({ favoriteIds });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Add or remove favorite
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fictional_user_id, action } = body;

    if (!fictional_user_id || !action) {
      return NextResponse.json(
        { error: 'fictional_user_id and action are required' },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "add" or "remove"' },
        { status: 400 }
      );
    }

    // Get real user ID
    const { data: realUser, error: userError } = await supabase
      .from('real_users')
      .select('id, favorite_count')
      .eq('auth_id', user.id)
      .single();

    if (userError || !realUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'add') {
      // Add favorite
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          real_user_id: realUser.id,
          fictional_user_id: fictional_user_id,
        });

      if (insertError) {
        // Check if already favorited
        if (insertError.code === '23505') {
          return NextResponse.json({
            message: 'Already favorited',
            isFavorited: true,
          });
        }

        console.error('Error adding favorite:', insertError);
        return NextResponse.json(
          { error: 'Failed to add favorite' },
          { status: 500 }
        );
      }

      // Update favorite count
      await supabase
        .from('real_users')
        .update({ favorite_count: (realUser.favorite_count || 0) + 1 })
        .eq('id', realUser.id);

      return NextResponse.json({
        message: 'Favorite added',
        isFavorited: true,
      });
    } else {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('real_user_id', realUser.id)
        .eq('fictional_user_id', fictional_user_id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove favorite' },
          { status: 500 }
        );
      }

      // Update favorite count
      await supabase
        .from('real_users')
        .update({ 
          favorite_count: Math.max(0, (realUser.favorite_count || 0) - 1) 
        })
        .eq('id', realUser.id);

      return NextResponse.json({
        message: 'Favorite removed',
        isFavorited: false,
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
