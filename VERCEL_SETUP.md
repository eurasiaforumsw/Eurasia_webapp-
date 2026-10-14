# Vercel deployment setup

The runtime uses Neon PostgreSQL and Cloudflare R2. Configure these variables in
Vercel for each environment you deploy:

- `DATABASE_URL` — Neon pooled URL with SSL enabled
- `JWT_SECRET` — fresh random value of at least 32 bytes
- `ADMIN_PASSWORD_HASH` — bcrypt hash for a newly chosen admin password
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` — public/custom-domain URL for final objects
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — only after the sender domain is verified
- `NEXT_PUBLIC_APP_URL` — the canonical production origin

Generate `JWT_SECRET` and the bcrypt hash locally. `add-vercel-env.sh` accepts
those values from environment variables and never stores them in the repository.
Delete any legacy `NEXT_PUBLIC_ADMIN_PASSWORD` and Supabase variables from Vercel,
then redeploy. Configure R2 CORS and the pending-upload lifecycle rule using
[`docs/r2-direct-uploads.md`](docs/r2-direct-uploads.md).

Use `admin@efsw.local` only if that is the email configured for the administrator;
the password is the value used to create `ADMIN_PASSWORD_HASH`.
