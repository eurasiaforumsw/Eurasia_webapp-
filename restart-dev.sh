#!/bin/bash
# Restart Development Server Script

echo "🔄 Restarting development server..."
echo ""

# Kill existing Next.js dev server
echo "Stopping existing server..."
pkill -f "next dev" || echo "No existing server found"
sleep 2

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Start dev server
echo ""
echo "Starting development server..."
npm run dev
