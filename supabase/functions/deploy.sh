#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all Edge Functions to Supabase

set -e

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Supabase project not linked. Please run:"
    echo "   supabase link --project-ref your-project-ref"
    exit 1
fi

echo "📦 Deploying Edge Functions..."
echo ""

# Deploy bootstrap-first-admin
echo "1️⃣  Deploying bootstrap-first-admin..."
supabase functions deploy bootstrap-first-admin --no-verify-jwt
echo "✅ bootstrap-first-admin deployed"
echo ""

# Deploy delete-user-account
echo "2️⃣  Deploying delete-user-account..."
supabase functions deploy delete-user-account --no-verify-jwt
echo "✅ delete-user-account deployed"
echo ""

# Deploy delete-operator-account
echo "3️⃣  Deploying delete-operator-account..."
supabase functions deploy delete-operator-account --no-verify-jwt
echo "✅ delete-operator-account deployed"
echo ""

# Deploy process-payment
echo "4️⃣  Deploying process-payment..."
supabase functions deploy process-payment --no-verify-jwt
echo "✅ process-payment deployed"
echo ""

# Deploy reconcile-payments
echo "5️⃣  Deploying reconcile-payments..."
supabase functions deploy reconcile-payments --no-verify-jwt
echo "✅ reconcile-payments deployed"
echo ""

# Deploy auto-close-inactive-chats
echo "6️⃣  Deploying auto-close-inactive-chats..."
supabase functions deploy auto-close-inactive-chats --no-verify-jwt
echo "✅ auto-close-inactive-chats deployed"
echo ""

# Deploy escalate-problematic-chats
echo "7️⃣  Deploying escalate-problematic-chats..."
supabase functions deploy escalate-problematic-chats --no-verify-jwt
echo "✅ escalate-problematic-chats deployed"
echo ""

echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "⚠️  Don't forget to set environment variables:"
echo "   supabase secrets set ADMIN_SETUP_TOKEN=your-secret-token"
echo "   supabase secrets set PAYSTACK_SECRET_KEY=your-paystack-secret"
echo "   supabase secrets set CRON_SECRET=your-cron-secret"
echo ""
echo "📝 Configure Paystack webhook URL:"
echo "   https://<project-ref>.supabase.co/functions/v1/process-payment"
echo ""
echo "📝 View function logs:"
echo "   supabase functions logs <function-name>"
echo ""
