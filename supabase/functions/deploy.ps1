# Supabase Edge Functions Deployment Script (PowerShell)
# This script deploys all Edge Functions to Supabase

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if project is linked
if (-not (Test-Path ".supabase/config.toml")) {
    Write-Host "❌ Supabase project not linked. Please run:" -ForegroundColor Red
    Write-Host "   supabase link --project-ref your-project-ref" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Deploying Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Deploy bootstrap-first-admin
Write-Host "1️⃣  Deploying bootstrap-first-admin..." -ForegroundColor Yellow
supabase functions deploy bootstrap-first-admin --no-verify-jwt
Write-Host "✅ bootstrap-first-admin deployed" -ForegroundColor Green
Write-Host ""

# Deploy delete-user-account
Write-Host "2️⃣  Deploying delete-user-account..." -ForegroundColor Yellow
supabase functions deploy delete-user-account --no-verify-jwt
Write-Host "✅ delete-user-account deployed" -ForegroundColor Green
Write-Host ""

# Deploy delete-operator-account
Write-Host "3️⃣  Deploying delete-operator-account..." -ForegroundColor Yellow
supabase functions deploy delete-operator-account --no-verify-jwt
Write-Host "✅ delete-operator-account deployed" -ForegroundColor Green
Write-Host ""

# Deploy process-payment
Write-Host "4️⃣  Deploying process-payment..." -ForegroundColor Yellow
supabase functions deploy process-payment --no-verify-jwt
Write-Host "✅ process-payment deployed" -ForegroundColor Green
Write-Host ""

# Deploy reconcile-payments
Write-Host "5️⃣  Deploying reconcile-payments..." -ForegroundColor Yellow
supabase functions deploy reconcile-payments --no-verify-jwt
Write-Host "✅ reconcile-payments deployed" -ForegroundColor Green
Write-Host ""

# Deploy auto-close-inactive-chats
Write-Host "6️⃣  Deploying auto-close-inactive-chats..." -ForegroundColor Yellow
supabase functions deploy auto-close-inactive-chats --no-verify-jwt
Write-Host "✅ auto-close-inactive-chats deployed" -ForegroundColor Green
Write-Host ""

# Deploy escalate-problematic-chats
Write-Host "7️⃣  Deploying escalate-problematic-chats..." -ForegroundColor Yellow
supabase functions deploy escalate-problematic-chats --no-verify-jwt
Write-Host "✅ escalate-problematic-chats deployed" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 All Edge Functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Don't forget to set environment variables:" -ForegroundColor Yellow
Write-Host "   supabase secrets set ADMIN_SETUP_TOKEN=your-secret-token" -ForegroundColor Cyan
Write-Host "   supabase secrets set PAYSTACK_SECRET_KEY=your-paystack-secret" -ForegroundColor Cyan
Write-Host "   supabase secrets set CRON_SECRET=your-cron-secret" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Configure Paystack webhook URL:" -ForegroundColor Yellow
Write-Host "   https://<project-ref>.supabase.co/functions/v1/process-payment" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 View function logs:" -ForegroundColor Yellow
Write-Host "   supabase functions logs <function-name>" -ForegroundColor Cyan
Write-Host ""
