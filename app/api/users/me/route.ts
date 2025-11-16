import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/me
 * Get current user profile
 */
export async function GET() {
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

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('real_users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in GET /api/users/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { display_name, bio, location, latitude, longitude, profile_picture } = body;

    // Build update object with only provided fields
    const updates: Record<string, string | number | undefined> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (profile_picture !== undefined) updates.profile_picture = profile_picture;

    // Update user profile
    const { data: user, error: updateError } = await supabase
      .from('real_users')
      .update(updates)
      .eq('auth_id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in PATCH /api/users/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me
 * Delete current user account (GDPR compliance)
 */
export async function DELETE() {
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

    // Call the delete-user-account Edge Function
    const { data, error: functionError } = await supabase.functions.invoke(
      'delete-user-account',
      {
        body: { user_id: authUser.id },
      }
    );

    if (functionError) {
      console.error('Error calling delete-user-account function:', functionError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Account deleted successfully',
      refund_amount: data?.refund_amount || 0,
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
