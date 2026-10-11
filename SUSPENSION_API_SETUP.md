# Member Suspension System - Manual Migration Required

## 🔴 Migration Status

The suspension API endpoint has been created at `/app/api/admin/members/[id]/suspend/route.ts`, but the database migration **016_message_rate_limiting_and_suspensions.sql** needs to be applied to Supabase.

## 📝 Steps to Complete

### 1. Apply Database Migration

Go to your Supabase project dashboard:
- Navigate to **SQL Editor**
- Copy the contents of `/supabase/migrations/016_message_rate_limiting_and_suspensions.sql`
- Paste and run the SQL

This will create:
- `member_suspensions` table
- `message_rate_limits` table  
- `suspend_member()` function
- `lift_suspension()` function
- `expire_suspensions()` function
- `check_member_suspension()` function

### 2. Run Tests

After applying the migration, run:

```bash
npm run dev  # Start dev server if not running
bash scripts/run-suspension-test.sh
```

## 🎯 API Endpoints Created

### POST `/api/admin/members/[id]/suspend`
Suspend a member (admin only)

**Request Body:**
```json
{
  "suspension_type": "temporary_24h" | "temporary_custom" | "permanent",
  "suspension_reason": "spam_flooding" | "abusive_language" | "harassment" | "inappropriate_content" | "tos_violation" | "other",
  "additional_notes": "Optional details",
  "days_count": 7  // Required only for temporary_custom
}
```

**Response:**
```json
{
  "success": true,
  "suspension_id": "uuid",
  "member_id": "string",
  "expires_at": "2024-10-18T12:00:00Z"  // null for permanent
}
```

### DELETE `/api/admin/members/[id]/suspend?suspension_id=uuid`
Lift a suspension (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Suspension lifted successfully"
}
```

## 🧪 Current Test Results

✅ Authentication checks working
✅ Role-based access control working
✅ Request validation working
❌ Database operations pending (waiting for migration)

## 📁 Files Created

- `/app/api/admin/members/[id]/suspend/route.ts` - Main API endpoint
- `/lib/member-suspension.ts` - Suspension utility functions
- `/app/api/admin/test-setup/route.ts` - Test data setup endpoint
- `/scripts/test-suspension-api.ts` - Comprehensive test suite
- `/scripts/run-suspension-test.sh` - Test runner script
- `/scripts/create-test-member.ts` - Test member creation utility

## 🔐 Security Features

- JWT-based admin authentication
- Role verification (admin only)
- Audit logging (suspended_by, lifted_by fields)
- Request validation
- Rate limit integration ready

## 📊 Database Schema (from migration)

```sql
CREATE TABLE member_suspensions (
  id uuid PRIMARY KEY,
  member_id text REFERENCES members(id),
  suspended_by text NOT NULL,
  suspension_type text CHECK (IN ('temporary_24h', 'temporary_custom', 'permanent')),
  reason_category text NOT NULL,
  reason_details text,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  lifted_at timestamptz,
  lifted_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

**Next Step:** Apply the migration file in Supabase SQL Editor, then run the test suite.
