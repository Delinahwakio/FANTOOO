import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, is_active')
      .eq('auth_id', session.user.id)
      .single();

    if (adminError || !admin || !admin.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch dashboard statistics
    const [
      usersResult,
      chatsResult,
      revenueResult,
      operatorsResult,
    ] = await Promise.all([
      // Total and active users
      supabase.rpc('get_user_stats'),
      
      // Total and active chats
      supabase.rpc('get_chat_stats'),
      
      // Total revenue and messages
      supabase.rpc('get_revenue_stats'),
      
      // Total and available operators
      supabase.rpc('get_operator_stats'),
    ]);

    // If RPC functions don't exist, fall back to direct queries
    let stats = {
      total_users: 0,
      active_users: 0,
      total_chats: 0,
      active_chats: 0,
      total_revenue: 0,
      total_messages: 0,
      total_operators: 0,
      available_operators: 0,
    };

    // Get user stats
    if (usersResult.data) {
      stats.total_users = usersResult.data.total_users || 0;
      stats.active_users = usersResult.data.active_users || 0;
    } else {
      const { count: totalUsers } = await supabase
        .from('real_users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      const { count: activeUsers } = await supabase
        .from('real_users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('is_active', true)
        .gte('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      stats.total_users = totalUsers || 0;
      stats.active_users = activeUsers || 0;
    }

    // Get chat stats
    if (chatsResult.data) {
      stats.total_chats = chatsResult.data.total_chats || 0;
      stats.active_chats = chatsResult.data.active_chats || 0;
    } else {
      const { count: totalChats } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeChats } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      stats.total_chats = totalChats || 0;
      stats.active_chats = activeChats || 0;
    }

    // Get revenue stats
    if (revenueResult.data) {
      stats.total_revenue = revenueResult.data.total_revenue || 0;
      stats.total_messages = revenueResult.data.total_messages || 0;
    } else {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'success')
        .eq('type', 'purchase');
      
      stats.total_revenue = transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0) || 0;
      
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      stats.total_messages = totalMessages || 0;
    }

    // Get operator stats
    if (operatorsResult.data) {
      stats.total_operators = operatorsResult.data.total_operators || 0;
      stats.available_operators = operatorsResult.data.available_operators || 0;
    } else {
      const { count: totalOperators } = await supabase
        .from('operators')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      const { count: availableOperators } = await supabase
        .from('operators')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('is_available', true)
        .eq('is_active', true);
      
      stats.total_operators = totalOperators || 0;
      stats.available_operators = availableOperators || 0;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
