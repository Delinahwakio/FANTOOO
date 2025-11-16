import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SignupRequest {
  username: string;
  displayName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  lookingFor: 'male' | 'female' | 'both';
  location: string;
  latitude?: number;
  longitude?: number;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { username, displayName, age, gender, lookingFor, location, latitude, longitude, password } = body;

    // Validate required fields
    if (!username || !displayName || !age || !gender || !lookingFor || !location || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate age (18+)
    if (age < 18 || age > 100) {
      return NextResponse.json(
        { error: 'You must be 18 or older to register' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Validate password complexity
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate email in format username@fantooo.com
    const email = `${username}@fantooo.com`;

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('real_users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile in real_users table
    const { error: profileError } = await supabase
      .from('real_users')
      .insert({
        auth_id: authData.user.id,
        username,
        display_name: displayName,
        email,
        age,
        gender,
        looking_for: lookingFor,
        location,
        latitude,
        longitude,
        credits: 0,
        user_tier: 'free',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Log age verification for compliance
    const { error: ageLogError } = await supabase
      .from('age_verification_log')
      .insert({
        user_id: authData.user.id,
        stated_age: age,
        verification_method: 'self_declared',
        verified_at: new Date().toISOString(),
      });
    
    if (ageLogError) {
      // Log error but don't fail the request
      console.error('Failed to log age verification:', ageLogError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        username,
        email,
      },
    });
  } catch (error) {
    console.error('Error in signup route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
