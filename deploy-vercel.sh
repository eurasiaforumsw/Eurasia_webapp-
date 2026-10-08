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
echo "   Value: Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw="
echo "   Command:"
echo '   echo "Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=" | vercel env add JWT_SECRET production'
echo '   echo "Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=" | vercel env add JWT_SECRET preview'
echo '   echo "Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=" | vercel env add JWT_SECRET development'
echo ""
echo "2. ADMIN_PASSWORD_HASH"
echo '   Value: $2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq'
echo "   Command:"
echo '   echo "$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq" | vercel env add ADMIN_PASSWORD_HASH production'
echo '   echo "$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq" | vercel env add ADMIN_PASSWORD_HASH preview'
echo '   echo "$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq" | vercel env add ADMIN_PASSWORD_HASH development'
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
echo "🔑 New Admin Credentials:"
echo "   Email: admin@efsw.local"
echo "   Password: EFSW-secure-admin-2024"
echo ""
echo "📊 Monitor deployment at: https://vercel.com"
echo ""
