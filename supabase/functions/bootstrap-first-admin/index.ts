import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BootstrapRequest {
  name: string
  email: string
  password: string
  setupToken: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { name, email, password, setupToken }: BootstrapRequest = await req.json()

    // Validate required fields
    if (!name || !email || !password || !setupToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate setup token against environment variable
    const expectedToken = Deno.env.get('ADMIN_SETUP_TOKEN')
    if (!expectedToken) {
      return new Response(
        JSON.stringify({ error: 'Setup token not configured on server' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (setupToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid setup token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if any admins already exist
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing admins:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing admins' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If admins already exist, reject the request
    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Admin account already exists. Setup is disabled.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create auth user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create admin record with super_admin role
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .insert({
        auth_id: authData.user.id,
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
        is_active: true,
      })
      .select()
      .single()

    if (adminError) {
      console.error('Error creating admin record:', adminError)
      
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create admin record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Super admin account created successfully',
        admin: {
          id: adminData.id,
          name: adminData.name,
          email: adminData.email,
          role: adminData.role,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
