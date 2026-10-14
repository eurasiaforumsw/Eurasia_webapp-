#!/usr/bin/env bash
set -euo pipefail

# Apply the pending Neon schema migrations. Migration 016 is included in the
# ordered migration set and must not be run in isolation on a fresh database.

echo "🚀 Applying Migration 016: Message Rate Limiting and Suspensions"
echo "================================================================"

# Load environment variables without breaking values containing spaces or '#'.
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
fi

# Check for required environment variables
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ Error: DATABASE_URL not found in .env or the environment"
    echo "Please add the Neon connection string to .env file"
    exit 1
fi

echo "📝 Applying pending migrations through scripts/push-schema.js..."
node scripts/push-schema.js
echo "✅ Neon schema migrations applied successfully!"
