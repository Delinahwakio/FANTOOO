import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/fictional-profiles/bulk-import - Bulk import fictional profiles
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
    const { profiles } = body;

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: 'profiles must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each profile
    const errors: Array<{ index: number; errors: string[] }> = [];
    const validProfiles: Array<Record<string, unknown>> = [];

    profiles.forEach((profile, index) => {
      const profileErrors: string[] = [];

      // Required fields
      if (!profile.name) profileErrors.push('name is required');
      if (!profile.age) profileErrors.push('age is required');
      if (!profile.gender) profileErrors.push('gender is required');
      if (!profile.location) profileErrors.push('location is required');
      if (!profile.bio) profileErrors.push('bio is required');

      // Validate profile pictures
      if (!profile.profile_pictures || !Array.isArray(profile.profile_pictures)) {
        profileErrors.push('profile_pictures must be an array');
      } else if (profile.profile_pictures.length < 3 || profile.profile_pictures.length > 10) {
        profileErrors.push('profile_pictures must have between 3 and 10 items');
      }

      // Validate age
      if (profile.age && (profile.age < 18 || profile.age > 100)) {
        profileErrors.push('age must be between 18 and 100');
      }

      if (profileErrors.length > 0) {
        errors.push({ index, errors: profileErrors });
      } else {
        validProfiles.push({
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          location: profile.location,
          bio: profile.bio,
          personality_traits: profile.personality_traits || [],
          interests: profile.interests || [],
          occupation: profile.occupation || null,
          education: profile.education || null,
          relationship_status: profile.relationship_status || null,
          profile_pictures: profile.profile_pictures,
          cover_photo: profile.cover_photo || null,
          response_style: profile.response_style || null,
          response_templates: profile.response_templates || null,
          personality_guidelines: profile.personality_guidelines || null,
          is_active: profile.is_active !== undefined ? profile.is_active : true,
          is_featured: profile.is_featured || false,
          featured_until: profile.featured_until || null,
          max_concurrent_chats: profile.max_concurrent_chats || 10,
          tags: profile.tags || [],
          category: profile.category || null,
          created_by: admin.id
        });
      }
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed for some profiles',
          validation_errors: errors,
          valid_count: validProfiles.length,
          invalid_count: errors.length
        },
        { status: 400 }
      );
    }

    // Insert all valid profiles
    const { data: insertedProfiles, error: insertError } = await supabase
      .from('fictional_users')
      .insert(validProfiles)
      .select();

    if (insertError) {
      console.error('Error bulk importing profiles:', insertError);
      return NextResponse.json(
        { error: 'Failed to import profiles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      imported_count: insertedProfiles?.length || 0,
      profiles: insertedProfiles
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
