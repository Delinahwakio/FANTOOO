import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/users/[id]/ban
 * 
 * Ban a user with reason and optional duration
 * Tracks IP addresses and device fingerprints for circumvention detection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ban details from request body
    const body = await request.json();
    const { reason, duration, isPermanent = false } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Ban reason is required' }, { status: 400 });
    }

    // Calculate ban expiry
    let bannedUntil = null;
    if (!isPermanent && duration) {
      bannedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
    }

    // Get user's recent activity to collect IP addresses and device fingerprints
    const { data: activityLogs } = await supabase
      .from('user_activity_log')
      .select('ip_address, device_fingerprint')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const ipAddresses = Array.from(new Set(activityLogs?.map(log => log.ip_address).filter(Boolean)));
    const deviceFingerprints = Array.from(new Set(activityLogs?.map(log => log.device_fingerprint).filter(Boolean)));

    // Update user ban status
    const { error: updateError } = await supabase
      .from('real_users')
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_until: bannedUntil,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error banning user:', updateError);
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
    }

    // Create ban tracking record
    const { error: trackingError } = await supabase
      .from('banned_users_tracking')
      .insert({
        user_id: params.id,
        ban_reason: reason,
        banned_by: admin.id,
        banned_until: bannedUntil,
        is_permanent: isPermanent,
        ip_addresses: ipAddresses,
        device_fingerprints: deviceFingerprints,
      });

    if (trackingError) {
      console.error('Error creating ban tracking:', trackingError);
    }

    // Close all active chats
    const { error: closeChatsError } = await supabase
      .from('chats')
      .update({
        status: 'closed',
        close_reason: 'user_banned',
        closed_at: new Date().toISOString(),
      })
      .eq('real_user_id', params.id)
      .eq('status', 'active');

    if (closeChatsError) {
      console.error('Error closing chats:', closeChatsError);
    }

    return NextResponse.json({
      success: true,
      message: 'User banned successfully',
      bannedUntil,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/ban:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]/ban
 * 
 * Unban a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update user ban status
    const { error: updateError } = await supabase
      .from('real_users')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error unbanning user:', updateError);
      return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]/ban:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
