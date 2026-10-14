#!/usr/bin/env bash
set -euo pipefail

# Values must come from the caller's environment. Never commit or reuse
# credentials from an earlier deployment.
: "${JWT_SECRET:?Set a fresh JWT_SECRET (at least 32 bytes) before running}"
: "${ADMIN_PASSWORD_HASH:?Set ADMIN_PASSWORD_HASH generated for the new admin password}"

for environment in production preview development; do
  printf '%s\n' "$JWT_SECRET" | vercel env add JWT_SECRET "$environment"
  printf '%s\n' "$ADMIN_PASSWORD_HASH" | vercel env add ADMIN_PASSWORD_HASH "$environment"
done

echo "Environment variables added. Trigger a deployment after reviewing Vercel's environment list."
