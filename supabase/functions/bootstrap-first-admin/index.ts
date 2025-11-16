import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface BootstrapRequest {
  name: string;
  email: string;
  password: string;
  setupToken: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { name, email, password, setupToken }: BootstrapRequest = await req.json();

    // Validate required fields
    if (!name || !email || !password || !setupToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, password, setupToken' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Verify setup token from environment
    const SETUP_TOKEN = Deno.env.get('ADMIN_SETUP_TOKEN');
    if (!SETUP_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Setup token not configured on server' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    if (setupToken !== SETUP_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Invalid setup token' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      throw checkError;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Admin already exists. Setup can only be run once.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    if (!authUser.user) {
      throw new Error('Failed to create auth user');
    }

    // Create super admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert({
        auth_id: authUser.user.id,
        name,
        email,
        role: 'super_admin',
        permissions: {
          manage_users: true,
          manage_fictional_profiles: true,
          manage_operators: true,
          manage_chats: true,
          view_analytics: true,
          manage_payments: true,
          manage_admins: true,
          system_settings: true,
          delete_data: true,
        },
      })
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin record:', adminError);
      // Cleanup: delete auth user if admin creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw adminError;
    }

    console.log('Super admin created successfully:', admin.id);

    return new Response(
      JSON.stringify({
        success: true,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        message: 'Super admin account created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Bootstrap error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create admin account',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
