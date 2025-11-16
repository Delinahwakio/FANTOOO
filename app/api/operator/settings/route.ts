import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/operator/settings
 * 
 * Update operator settings (specializations, preferences)
 * 
 * Body:
 * - specializations: string[] (optional)
 * 
 * Returns updated operator data
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current operator
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get operator record
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { specializations } = body

    // Validate specializations if provided
    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return NextResponse.json(
          { error: 'Specializations must be an array' },
          { status: 400 }
        )
      }

      // Validate each specialization
      for (const spec of specializations) {
        if (typeof spec !== 'string' || spec.trim().length === 0) {
          return NextResponse.json(
            { error: 'Each specialization must be a non-empty string' },
            { status: 400 }
          )
        }
      }
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (specializations !== undefined) {
      updates.specializations = specializations
    }

    // Update operator
    const { data: updatedOperator, error: updateError } = await supabase
      .from('operators')
      .update(updates)
      .eq('id', operator.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating operator:', updateError)
      return NextResponse.json(
        { error: 'Failed to update operator settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      operator: updatedOperator,
    })
  } catch (error) {
    console.error('Error in PATCH /api/operator/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/operator/settings
 * 
 * Get operator settings
 * 
 * Returns operator data with settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current operator
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get operator record
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      operator: {
        id: operator.id,
        name: operator.name,
        email: operator.email,
        specializations: operator.specializations || [],
        languages: operator.languages || ['en'],
        skill_level: operator.skill_level,
        is_active: operator.is_active,
        is_available: operator.is_available,
        is_suspended: operator.is_suspended,
        suspension_reason: operator.suspension_reason,
        suspended_until: operator.suspended_until,
        max_concurrent_chats: operator.max_concurrent_chats,
        quality_threshold: operator.quality_threshold,
        quality_score: operator.quality_score,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/operator/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
