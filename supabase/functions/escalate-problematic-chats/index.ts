import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Escalate problematic chats
 * Scheduled to run every 15 minutes
 * Escalates chats that have reached max reassignments (3)
 * Escalates chats with operator idle time > 10 minutes
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const escalatedChats: string[] = [];
    const notifications: Array<{
      type: string;
      message: string;
      metadata: any;
      priority: string;
    }> = [];

    // 1. Find chats with max reassignments (3 or more)
    console.log('Checking for chats with max reassignments...');
    const { data: maxReassignmentChats, error: reassignError } = await supabase
      .from('chats')
      .select('id, real_user_id, fictional_user_id, assignment_count, assigned_operator_id')
      .eq('status', 'active')
      .gte('assignment_count', 3)
      .not('flags', 'cs', '["max_reassignments_reached"]'); // Not already flagged

    if (reassignError) {
      console.error('Error fetching max reassignment chats:', reassignError);
      throw reassignError;
    }

    if (maxReassignmentChats && maxReassignmentChats.length > 0) {
      console.log(`Found ${maxReassignmentChats.length} chats with max reassignments`);

      for (const chat of maxReassignmentChats) {
        // Update chat status to escalated
        const { error: updateError } = await supabase
          .from('chats')
          .update({
            status: 'escalated',
            flags: supabase.rpc('array_append', {
              arr: chat.flags || [],
              elem: 'max_reassignments_reached',
            }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', chat.id);

        if (updateError) {
          console.error(`Error escalating chat ${chat.id}:`, updateError);
          continue;
        }

        escalatedChats.push(chat.id);

        // Create admin notification
        notifications.push({
          type: 'chat_escalation',
          message: `Chat ${chat.id} escalated: Max reassignments reached (${chat.assignment_count})`,
          metadata: {
            chat_id: chat.id,
            real_user_id: chat.real_user_id,
            fictional_user_id: chat.fictional_user_id,
            assignment_count: chat.assignment_count,
            reason: 'max_reassignments',
          },
          priority: 'high',
        });

        // Log activity
        await supabase.from('user_activity_log').insert({
          user_id: chat.real_user_id,
          activity_type: 'chat_escalated',
          entity_type: 'chat',
          entity_id: chat.id,
          metadata: {
            reason: 'max_reassignments',
            assignment_count: chat.assignment_count,
          },
        });
      }
    }

    // 2. Find chats with operator idle time > 10 minutes
    console.log('Checking for chats with idle operators...');
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const { data: idleChats, error: idleError } = await supabase
      .from('chats')
      .select('id, real_user_id, fictional_user_id, assigned_operator_id, last_operator_activity, last_user_message_at')
      .eq('status', 'active')
      .not('assigned_operator_id', 'is', null)
      .lt('last_operator_activity', tenMinutesAgo.toISOString())
      .gt('last_user_message_at', tenMinutesAgo.toISOString()) // User sent message recently
      .not('flags', 'cs', '["operator_idle"]'); // Not already flagged

    if (idleError) {
      console.error('Error fetching idle chats:', idleError);
      throw idleError;
    }

    if (idleChats && idleChats.length > 0) {
      console.log(`Found ${idleChats.length} chats with idle operators`);

      for (const chat of idleChats) {
        // Update chat with idle flag
        const { error: updateError } = await supabase
          .from('chats')
          .update({
            status: 'escalated',
            flags: supabase.rpc('array_append', {
              arr: chat.flags || [],
              elem: 'operator_idle',
            }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', chat.id);

        if (updateError) {
          console.error(`Error escalating idle chat ${chat.id}:`, updateError);
          continue;
        }

        escalatedChats.push(chat.id);

        // Increment operator idle incidents
        if (chat.assigned_operator_id) {
          await supabase
            .from('operators')
            .update({
              idle_incidents: supabase.rpc('increment', { column: 'idle_incidents' }),
            })
            .eq('id', chat.assigned_operator_id);
        }

        // Create admin notification
        notifications.push({
          type: 'chat_escalation',
          message: `Chat ${chat.id} escalated: Operator idle for >10 minutes`,
          metadata: {
            chat_id: chat.id,
            real_user_id: chat.real_user_id,
            fictional_user_id: chat.fictional_user_id,
            operator_id: chat.assigned_operator_id,
            last_operator_activity: chat.last_operator_activity,
            reason: 'operator_idle',
          },
          priority: 'high',
        });

        // Log activity
        await supabase.from('user_activity_log').insert({
          user_id: chat.real_user_id,
          activity_type: 'chat_escalated',
          entity_type: 'chat',
          entity_id: chat.id,
          metadata: {
            reason: 'operator_idle',
            operator_id: chat.assigned_operator_id,
            idle_duration_minutes: 10,
          },
        });
      }
    }

    // 3. Find chats in queue for too long (>30 minutes)
    console.log('Checking for chats stuck in queue...');
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const { data: stuckChats, error: queueError } = await supabase
      .from('chat_queue')
      .select('id, chat_id, entered_queue_at, priority, attempts')
      .lt('entered_queue_at', thirtyMinutesAgo.toISOString())
      .gte('attempts', 3);

    if (queueError) {
      console.error('Error fetching stuck queue chats:', queueError);
      throw queueError;
    }

    if (stuckChats && stuckChats.length > 0) {
      console.log(`Found ${stuckChats.length} chats stuck in queue`);

      for (const queueItem of stuckChats) {
        // Get chat details
        const { data: chat } = await supabase
          .from('chats')
          .select('id, real_user_id, fictional_user_id')
          .eq('id', queueItem.chat_id)
          .single();

        if (!chat) continue;

        // Update chat status to escalated
        const { error: updateError } = await supabase
          .from('chats')
          .update({
            status: 'escalated',
            flags: supabase.rpc('array_append', {
              arr: [],
              elem: 'queue_timeout',
            }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', chat.id);

        if (updateError) {
          console.error(`Error escalating queued chat ${chat.id}:`, updateError);
          continue;
        }

        // Remove from queue
        await supabase.from('chat_queue').delete().eq('id', queueItem.id);

        escalatedChats.push(chat.id);

        // Create admin notification
        notifications.push({
          type: 'chat_escalation',
          message: `Chat ${chat.id} escalated: Stuck in queue for >30 minutes`,
          metadata: {
            chat_id: chat.id,
            real_user_id: chat.real_user_id,
            fictional_user_id: chat.fictional_user_id,
            queue_time_minutes: 30,
            attempts: queueItem.attempts,
            reason: 'queue_timeout',
          },
          priority: 'critical',
        });
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating admin notifications:', notifError);
      }
    }

    const totalEscalated = escalatedChats.length;
    console.log(`Successfully escalated ${totalEscalated} chats`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Escalated ${totalEscalated} problematic chats`,
        escalatedCount: totalEscalated,
        chatIds: escalatedChats,
        breakdown: {
          maxReassignments: maxReassignmentChats?.length || 0,
          operatorIdle: idleChats?.length || 0,
          queueTimeout: stuckChats?.length || 0,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Escalation error:', error);
    
    // Create admin notification for error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase.from('admin_notifications').insert({
        type: 'system_error',
        message: 'Failed to escalate problematic chats',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        priority: 'critical',
      });
    } catch (notifError) {
      console.error('Failed to create admin notification:', notifError);
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to escalate problematic chats',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
