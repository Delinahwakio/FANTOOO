#!/usr/bin/env node

/**
 * Simple script to test Supabase connection
 * Run with: node scripts/test-supabase.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found');
    console.error('   Please create .env.local and add your Supabase credentials');
    console.error('   See SUPABASE_SETUP.md for instructions\n');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

const env = loadEnvFile();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection...\n');

// Check if environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  console.error('   See SUPABASE_SETUP.md for instructions\n');
  process.exit(1);
}

console.log('✓ Environment variables found');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log('');

// Test connection to Supabase
const url = new URL('/rest/v1/', SUPABASE_URL);
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port,
  path: url.pathname,
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
};

const req = protocol.request(options, (res) => {
  console.log(`✓ Connection successful (Status: ${res.statusCode})`);
  
  if (res.statusCode === 200) {
    console.log('✓ Supabase API is responding correctly');
    console.log('\n✅ All tests passed!');
    console.log('   Your Supabase connection is working.');
    console.log('   Next step: Run migrations to create database tables (Task 3)\n');
  } else if (res.statusCode === 401) {
    console.error('\n❌ Authentication failed');
    console.error('   Check that your SUPABASE_ANON_KEY is correct\n');
    process.exit(1);
  } else {
    console.warn(`\n⚠️  Unexpected status code: ${res.statusCode}`);
    console.warn('   Connection works but there might be an issue\n');
  }
});

req.on('error', (error) => {
  console.error('\n❌ Connection failed');
  console.error(`   Error: ${error.message}`);
  console.error('\n   Troubleshooting:');
  console.error('   1. Check that NEXT_PUBLIC_SUPABASE_URL is correct');
  console.error('   2. Verify your internet connection');
  console.error('   3. If using local Supabase, ensure "supabase start" is running');
  console.error('   4. See SUPABASE_SETUP.md for more help\n');
  process.exit(1);
});

req.end();
