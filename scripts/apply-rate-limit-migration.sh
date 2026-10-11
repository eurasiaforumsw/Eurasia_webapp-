#!/bin/bash

# Apply Message Rate Limiting and Suspensions Migration
# This script applies migration 016 to add rate limiting and suspension tables

echo "🚀 Applying Migration 016: Message Rate Limiting and Suspensions"
echo "================================================================"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL not found in .env"
    echo "Please add the database connection string to .env file"
    exit 1
fi

# Apply the migration
echo "📝 Applying migration..."
psql "$SUPABASE_DB_URL" -f supabase/migrations/016_message_rate_limiting_and_suspensions.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Created tables:"
    echo "   - message_rate_limits"
    echo "   - member_suspensions"
    echo ""
    echo "🔧 Created functions:"
    echo "   - is_member_suspended()"
    echo "   - suspend_member()"
    echo "   - lift_suspension()"
    echo "   - expire_suspensions()"
    echo "   - delete_expired_messages()"
    echo ""
    echo "⚡ Added features:"
    echo "   - Rate limiting with exponential backoff"
    echo "   - Member suspension system (24h/custom/permanent)"
    echo "   - Message expiry (180 days auto-deletion)"
else
    echo "❌ Migration failed!"
    exit 1
fi
