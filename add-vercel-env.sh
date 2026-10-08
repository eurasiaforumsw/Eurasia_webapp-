#!/bin/bash
# Quick script to add environment variables to Vercel

echo "🔐 Adding JWT_SECRET to Vercel..."
echo "Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=" | vercel env add JWT_SECRET production
echo "Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=" | vercel env add JWT_SECRET preview
echo "Vei6k0vFaMfZmI67q9BH8Iubv6ePDXCc8OZBQbjx9Xw=" | vercel env add JWT_SECRET development

echo ""
echo "🔐 Adding ADMIN_PASSWORD_HASH to Vercel..."
echo '$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq' | vercel env add ADMIN_PASSWORD_HASH production
echo '$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq' | vercel env add ADMIN_PASSWORD_HASH preview
echo '$2b$12$QI870B2LMENPYRNKh9s.POFRpqLMmXJ7SqpnrqAM9HK7xiNU4aEHq' | vercel env add ADMIN_PASSWORD_HASH development

echo ""
echo "✅ Environment variables added!"
echo ""
echo "🔄 Now run: vercel --prod"
