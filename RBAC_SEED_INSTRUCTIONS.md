# RBAC Seed Instructions

## Overview
This document explains how to seed the three RBAC accounts for the Eurasia Forum admin system.

## Accounts to Create

| Email | Role | Password | Access Level |
|-------|------|----------|-------------|
| `admin@efsw.local` | `admin` | `EFSW-demo` | Full access to all admin sections |
| `admin2@efsw.local` | `admin` | `EFSW-demo` | Full access to all admin sections |
| `news@efsw.local` | `pr` | `EFSW-demo` | Access to News, Events, Academic only |

## How to Seed

### Option 1: Via Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/seed/seed-rbac-accounts.sql`
5. Click **Run**

### Option 2: Via Node.js Script

**Prerequisites:** Configure your `.env.local` file with Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Run the script:**

```bash
npx tsx scripts/seed-rbac-accounts.ts
```

### Option 3: Manual SQL Insert

If you need to generate a fresh bcrypt hash for a different password:

```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('YOUR_PASSWORD', 12).then(hash => console.log(hash));
```

Then insert directly into the `members` table using the hash.

## Verification

After seeding, verify the accounts exist:

```sql
SELECT id, email, role, full_name, status FROM members WHERE role IN ('admin', 'pr');
```

Expected result: 3 rows (2 admin, 1 pr)

## Login Testing

1. Navigate to `/member/login` or `/admin/login`
2. Use any of the credentials above
3. Verify access permissions:
   - **admin** roles: Can access all admin console sections
   - **pr** role: Can only access News, Events, Academic sections (Members and Settings hidden)

## Security Notes

- **Change the default password in production!**
- The password `EFSW-demo` is for development only
- Store the production password securely (use environment variables or secrets manager)
- Consider implementing password rotation policies
