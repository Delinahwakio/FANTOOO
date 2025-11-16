import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { available: false, error: 'Username must be between 3 and 20 characters' },
        { status: 200 }
      );
    }

    // Check if username contains only alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, and underscores' },
        { status: 200 }
      );
    }

    const supabase = await createClient();

    // Check if username exists
    const { data, error } = await supabase
      .from('real_users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !data,
      username,
    });
  } catch (error) {
    console.error('Error in check-username route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
