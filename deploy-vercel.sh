#!/bin/bash
# Vercel Deployment Script for Security + Academic Page Updates
# Run this after updating environment variables in Vercel Dashboard

echo "🚀 Vercel Deployment Script"
echo "================================"
echo ""

# Step 1: Check Vercel CLI
echo "📦 Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi
echo "✅ Vercel CLI found"
echo ""

# Step 2: Show current environment variables
echo "📋 Current Environment Variables:"
echo "--------------------------------"
vercel env ls
echo ""

# Step 3: Instructions for adding new variables
echo "🔧 Required Environment Variables:"
echo "--------------------------------"
echo ""
echo "1. JWT_SECRET"
echo "   Generate a fresh value locally and add it to Vercel (never commit it)."
echo '   openssl rand -base64 48 | vercel env add JWT_SECRET production'
echo ""
echo "2. ADMIN_PASSWORD_HASH"
echo "   Generate a bcrypt hash for a new password and add it to Vercel (never commit it)."
echo '   node -e "require(\"bcrypt\").hash(process.env.NEW_ADMIN_PASSWORD, 12).then(console.log)" | vercel env add ADMIN_PASSWORD_HASH production'
echo ""
echo "3. Remove old variable (NEXT_PUBLIC_ADMIN_PASSWORD)"
echo "   Command:"
echo "   vercel env rm NEXT_PUBLIC_ADMIN_PASSWORD production"
echo "   vercel env rm NEXT_PUBLIC_ADMIN_PASSWORD preview"
echo "   vercel env rm NEXT_PUBLIC_ADMIN_PASSWORD development"
echo ""

# Step 4: Ask user to add variables
read -p "Have you added JWT_SECRET and ADMIN_PASSWORD_HASH to Vercel? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please add environment variables first, then run this script again."
    exit 1
fi

# Step 5: Trigger redeploy
echo ""
echo "🔄 Triggering Vercel redeploy..."
vercel --prod --yes

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "📊 Monitor deployment at: https://vercel.com"
echo ""
