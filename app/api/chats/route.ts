import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { fictional_user_id } = body;

    if (!fictional_user_id) {
      return NextResponse.json(
        { error: 'fictional_user_id is required' },
        { status: 400 }
      );
    }

    // Get real user ID from auth user
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

    // Check if fictional user exists and is active
    const { data: fictionalUser, error: fictionalError } = await supabase
      .from('fictional_users')
      .select('id, is_active')
      .eq('id', fictional_user_id)
      .is('deleted_at', null)
      .single();

    if (fictionalError || !fictionalUser) {
      return NextResponse.json(
        { error: 'Fictional profile not found' },
        { status: 404 }
      );
    }

    if (!fictionalUser.is_active) {
      return NextResponse.json(
        { error: 'This profile is not available for chat' },
        { status: 400 }
      );
    }

    // Check for existing chat (duplicate prevention)
    const { data: existingChat, error: existingError } = await supabase
      .from('chats')
      .select('id, status')
      .eq('real_user_id', realUser.id)
      .eq('fictional_user_id', fictional_user_id)
      .single();

    // If chat exists, return it
    if (existingChat) {
      return NextResponse.json({
        chat: existingChat,
        isExisting: true,
        message: 'Returning existing chat',
      });
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        real_user_id: realUser.id,
        fictional_user_id: fictional_user_id,
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating chat:', createError);
      
      // Check if it's a unique constraint violation (race condition)
      if (createError.code === '23505') {
        // Try to fetch the chat that was just created by another request
        const { data: raceChat } = await supabase
          .from('chats')
          .select('id, status')
          .eq('real_user_id', realUser.id)
          .eq('fictional_user_id', fictional_user_id)
          .single();

        if (raceChat) {
          return NextResponse.json({
            chat: raceChat,
            isExisting: true,
            message: 'Returning existing chat',
          });
        }
      }

      return NextResponse.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      chat: newChat,
      isExisting: false,
      message: 'Chat created successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
