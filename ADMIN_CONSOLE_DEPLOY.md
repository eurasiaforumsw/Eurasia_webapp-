# Admin Console deployment

Apply database migrations before publishing the application. These APIs require
the new tables and transactional member review functions. Migration files are
in `supabase/migrations` and assume the existing members, content, layout,
settings, messaging and campaign tables are present.

Run these files in the Supabase SQL editor in this order:

1. `023_academic_document_metadata.sql`
2. `024_admin_console_persistence.sql`
3. `025_academic_engagement.sql`
4. `026_admin_member_review.sql`
5. `027_normalize_admin_suspensions.sql`

Stop on any SQL error; do not use `scripts/deploy-migrations.js`, which does not
reliably detect Supabase errors or preserve SQL function bodies.
Run `scripts/admin-console-check.sql` afterward. Every `ready` result must be true.
The check is read only and does not create accounts or send messages.

Local verification:

```sh
node_modules/.bin/tsc --noEmit --incremental false
node --test scripts/*.test.cjs
CI=1 npm run build
```

After the database checks pass, commit the console changes and push the linked
branch to GitHub to trigger Vercel. Check the deployment against that commit.
Use existing configured Supabase, R2 and JWT environment variables. Broadcast
delivery also requires `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`.

Production checks still required:

- Sign in with an administrator and with restricted console roles.
- Use an approved test member to approve, suspend, restore and delete; verify
  the result from a second browser. Confirm a temporary ban expires.
- Create and edit a draft, upload a portrait/attachment, publish it, open its
  public detail, and verify removal from another browser.
- Save Layout, Settings and categories; reload the public site in another browser.
- Create an announcement for the test member; confirm audience isolation and
  that the read receipt appears in the console.
- Check Analytics ranges and Academic Stats against known test activity.
- Send an email only to an explicitly approved test address and inspect provider
  delivery status. Automated tests use a mocked provider.

Email scheduling is unavailable until a scheduler is implemented. Campaigns with
partial failures cannot be resent automatically; successful recipients must not
receive an accidental duplicate. Provider acceptance followed by a database
failure needs reconciliation before any retry.

The Event FormBuilder and RegistrationSettings components remain outside the
console navigation and have not been integrated in this change.

If an application rollback is needed, keep the new database columns and tables;
they are additive. Do not delete persisted data as part of an application rollback.
