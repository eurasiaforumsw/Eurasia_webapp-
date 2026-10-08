#!/bin/bash
# Quick Build Test Script

echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Ready to deploy to Vercel"
    echo ""
    echo "Run: vercel --prod"
else
    echo ""
    echo "❌ Build failed - check errors above"
    exit 1
fi
