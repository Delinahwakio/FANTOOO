import { NextResponse } from 'next/server'
import { testServerConnection } from '@/lib/supabase/test-connection'

/**
 * API route to test Supabase connection
 * Access at: http://localhost:3000/api/test-connection
 */
export async function GET() {
  try {
    const result = await testServerConnection()
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
