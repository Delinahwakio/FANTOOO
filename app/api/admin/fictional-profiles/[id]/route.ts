import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/fictional-profiles/[id] - Get single profile with admin details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Fetch profile with admin details
    const { data: profile, error } = await supabase
      .from('fictional_users')
      .select('*, created_by_admin:admins!fictional_users_created_by_fkey(name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get active chat count
    const { count: activeChatCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('fictional_user_id', id)
      .eq('status', 'active');

    return NextResponse.json({ 
      profile: {
        ...profile,
        active_chat_count: activeChatCount || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/fictional-profiles/[id] - Update fictional profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Validate profile pictures if provided (min 3, max 10)
    if (body.profile_pictures) {
      if (!Array.isArray(body.profile_pictures)) {
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
    }

    // Validate age if provided
    if (body.age !== undefined && (body.age < 18 || body.age > 100)) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 100' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'age', 'gender', 'location', 'bio',
      'personality_traits', 'interests', 'occupation', 'education',
      'relationship_status', 'profile_pictures', 'cover_photo',
      'response_style', 'response_templates', 'personality_guidelines',
      'is_active', 'is_featured', 'featured_until',
      'max_concurrent_chats', 'tags', 'category'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('fictional_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/fictional-profiles/[id] - Delete fictional profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check for active chats
    const { count: activeChatCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('fictional_user_id', id)
      .eq('status', 'active');

    if (activeChatCount && activeChatCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete profile with active chats',
          active_chat_count: activeChatCount
        },
        { status: 400 }
      );
    }

    // Soft delete the profile
    const { error } = await supabase
      .from('fictional_users')
      .update({ 
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile:', error);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    // Close any idle chats (not active)
    await supabase
      .from('chats')
      .update({ 
        status: 'closed',
        close_reason: 'fictional_profile_deleted',
        closed_at: new Date().toISOString()
      })
      .eq('fictional_user_id', id)
      .neq('status', 'active');

    return NextResponse.json({ 
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
