/**
 * Utility to test Supabase database connection
 * Run this to verify your Supabase setup is working correctly
 */

import { createClient } from './client'

export async function testConnection() {
  try {
    const supabase = createClient()
    
    // Test 1: Check if client is initialized
    if (!supabase) {
      throw new Error('Supabase client failed to initialize')
    }
    
    console.log('✓ Supabase client initialized')
    
    // Test 2: Test database connection with a simple query
    const { data, error } = await supabase
      .from('real_users')
      .select('count')
      .limit(1)
    
    if (error) {
      // If table doesn't exist yet, that's okay - connection works
      if (error.code === '42P01') {
        console.log('✓ Database connection successful (tables not yet created)')
        return {
          success: true,
          message: 'Connection successful. Run migrations to create tables.',
          connectionStatus: 'connected',
          tablesExist: false
        }
      }
      throw error
    }
    
    console.log('✓ Database connection successful')
    console.log('✓ Tables exist and are accessible')
    
    return {
      success: true,
      message: 'All connection tests passed',
      connectionStatus: 'connected',
      tablesExist: true
    }
    
  } catch (error) {
    console.error('✗ Connection test failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      connectionStatus: 'failed',
      error
    }
  }
}

/**
 * Test server-side connection
 * This should be called from a server component or API route
 */
export async function testServerConnection() {
  try {
    // Dynamic import to avoid issues in client components
    const { createClient: createServerClient } = await import('./server')
    const supabase = await createServerClient()
    
    if (!supabase) {
      throw new Error('Server Supabase client failed to initialize')
    }
    
    console.log('✓ Server Supabase client initialized')
    
    // Test database connection
    const { data, error } = await supabase
      .from('real_users')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === '42P01') {
        console.log('✓ Server database connection successful (tables not yet created)')
        return {
          success: true,
          message: 'Server connection successful. Run migrations to create tables.',
          connectionStatus: 'connected',
          tablesExist: false
        }
      }
      throw error
    }
    
    console.log('✓ Server database connection successful')
    
    return {
      success: true,
      message: 'Server connection tests passed',
      connectionStatus: 'connected',
      tablesExist: true
    }
    
  } catch (error) {
    console.error('✗ Server connection test failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      connectionStatus: 'failed',
      error
    }
  }
}
