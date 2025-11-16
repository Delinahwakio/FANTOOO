import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/operators
 * 
 * Get all operators with performance metrics
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check permissions
    if (!admin.permissions?.manage_operators) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get all operators
    const { data: operators, error: operatorsError } = await supabase
      .from('operators')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (operatorsError) {
      console.error('Error fetching operators:', operatorsError)
      return NextResponse.json(
        { error: 'Failed to fetch operators' },
        { status: 500 }
      )
    }

    return NextResponse.json({ operators })
  } catch (error) {
    console.error('Error in GET /api/admin/operators:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/operators
 * 
 * Create a new operator account
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, role, permissions')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check permissions
    if (!admin.permissions?.manage_operators) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, password, specializations, skill_level, languages } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createAuthError) {
      console.error('Error creating auth user:', createAuthError)
      return NextResponse.json(
        { error: createAuthError.message || 'Failed to create operator account' },
        { status: 400 }
      )
    }

    // Create operator record
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .insert({
        auth_id: authData.user.id,
        name,
        email,
        specializations: specializations || [],
        skill_level: skill_level || 'junior',
        languages: languages || ['en'],
        created_by: admin.id,
      })
      .select()
      .single()

    if (operatorError) {
      console.error('Error creating operator:', operatorError)
      
      // Cleanup: delete auth user if operator creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: 'Failed to create operator record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ operator }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/operators:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
