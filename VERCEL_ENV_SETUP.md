# Vercel environment setup (Neon + Cloudflare R2)

The application no longer uses Supabase. Do not add old `NEXT_PUBLIC_SUPABASE_*`
or `SUPABASE_*` variables to Vercel.

Set these server variables in Production, Preview and Development as appropriate:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string (`sslmode=require`) |
| `JWT_SECRET` | Fresh random secret, at least 32 bytes |
| `ADMIN_PASSWORD_HASH` | bcrypt hash generated for the new admin password |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public/custom-domain URL for final objects |
| `RESEND_API_KEY` | Resend key for verified email sending |
| `RESEND_FROM_EMAIL` | Sender on a verified Resend domain |
| `NEXT_PUBLIC_APP_URL` | Canonical site origin used for CSRF and links |

Generate credentials locally and pass them to `add-vercel-env.sh`; never paste
real values into a tracked file. Remove any old `NEXT_PUBLIC_ADMIN_PASSWORD`
variable, then redeploy after changing environment variables.

Before production, configure the R2 CORS and lifecycle rules described in
[`docs/r2-direct-uploads.md`](docs/r2-direct-uploads.md), and apply all SQL files
in `supabase/migrations/` to Neon with `node scripts/push-schema.js`.
