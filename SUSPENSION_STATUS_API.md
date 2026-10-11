# Suspension Status API Documentation

## ✅ สร้างสำเร็จแล้ว

API endpoint สำหรับตรวจสอบสถานะการถูกระงับของ member ที่ login อยู่

---

## 📍 Endpoint

```
GET /api/members/suspension-status
```

### Authentication
- ✅ **Required**: Member must be logged in
- 🔐 Uses `member_token` cookie from login
- ⚠️ Returns `401 Unauthorized` if not authenticated

---

## 📤 Response Format

### ไม่ถูกระงับ (Not Suspended)
```json
{
  "isSuspended": false
}
```

### ถูกระงับ (Suspended)
```json
{
  "isSuspended": true,
  "suspensionType": "temporary_24h" | "temporary_custom" | "permanent",
  "reason": "spam_flooding",
  "reasonDetails": "Sent 10 messages in 30 seconds",
  "suspendedAt": "2024-10-11T02:30:00.000Z",
  "expiresAt": "2024-10-12T02:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `isSuspended` | boolean | ถูกระงับหรือไม่ |
| `suspensionType` | string | ประเภท: `temporary_24h`, `temporary_custom`, `permanent` |
| `reason` | string | เหตุผล: `spam_flooding`, `abusive_language`, `harassment`, etc. |
| `reasonDetails` | string | รายละเอียดเพิ่มเติม (optional) |
| `suspendedAt` | timestamp | เวลาที่ถูกระงับ |
| `expiresAt` | timestamp/null | เวลาที่หมดอายุ (null = permanent ban) |

---

## 🔧 Implementation Details

### File Location
```
/app/api/members/suspension-status/route.ts
```

### Dependencies
- `lib/member-suspension.ts` - `checkMemberSuspension()`
- `lib/api-auth.ts` - `verifyRequestToken()`
- Database function: `is_member_suspended(p_member_id)`

### Database Schema
Uses table: `member_suspensions`

---

## 💻 Usage Examples

### Frontend (React/Next.js)
```typescript
async function checkSuspensionStatus() {
  const response = await fetch('/api/members/suspension-status');
  const data = await response.json();
  
  if (data.isSuspended) {
    showSuspensionModal({
      type: data.suspensionType,
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      expiresAt: data.expiresAt
    });
    return true;
  }
  
  return false;
}
```

### Login Flow Integration
```typescript
// After successful login
async function handleLogin(email: string, password: string) {
  const loginResponse = await fetch('/api/members/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (loginResponse.ok) {
    // Check suspension status
    const isSuspended = await checkSuspensionStatus();
    
    if (isSuspended) {
      // Show suspension warning, don't redirect
      return;
    }
    
    // Proceed to dashboard
    router.push('/member/dashboard');
  }
}
```

### Middleware/Route Guard
```typescript
// middleware.ts or route guard
export async function memberGuard(request: NextRequest) {
  const statusResponse = await fetch(
    new URL('/api/members/suspension-status', request.url),
    {
      headers: { Cookie: request.headers.get('cookie') || '' }
    }
  );
  
  if (statusResponse.ok) {
    const data = await statusResponse.json();
    
    if (data.isSuspended) {
      return NextResponse.redirect(new URL('/suspended', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### Periodic Status Check (Client-side)
```typescript
// Check suspension status every 5 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/api/members/suspension-status');
    const data = await response.json();
    
    if (data.isSuspended) {
      // Force logout and show suspension notice
      await handleLogout();
      showSuspensionAlert(data);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return () => clearInterval(interval);
}, []);
```

---

## ✅ Testing Results

### Build Status
```bash
npm run build
✅ Compiled successfully
✅ TypeScript type checking passed
✅ No errors
```

### Runtime Test
```bash
curl http://localhost:2024/api/members/suspension-status
```

**Response (without auth):**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```
✅ Correctly requires authentication

---

## 🎯 Integration Checklist

- [x] API endpoint created
- [x] Authentication required
- [x] Returns correct format for non-suspended members
- [x] Returns correct format for suspended members
- [x] TypeScript compilation successful
- [x] Build passes without errors
- [x] Runtime test successful
- [ ] Frontend integration (login flow)
- [ ] Frontend integration (periodic check)
- [ ] Suspension modal/alert component
- [ ] Admin panel integration (suspend member)

---

## 📝 Related Files

- `/app/api/members/suspension-status/route.ts` - This endpoint
- `/lib/member-suspension.ts` - Suspension helper functions
- `/lib/api-auth.ts` - Authentication utilities
- `/supabase/migrations/016_message_rate_limiting_and_suspensions.sql` - Database schema
- `/scripts/test-suspension-status.ts` - Test script

---

## 🚀 Next Steps

1. **Frontend Integration**: Add suspension check to login flow
2. **Suspension Modal**: Create UI component to show suspension details
3. **Admin Panel**: Add "Suspend Member" functionality
4. **Periodic Check**: Implement background status checking
5. **Session Handling**: Auto-logout suspended members

---

**สร้างเมื่อ**: 2024-10-11  
**สถานะ**: ✅ Implemented and Tested  
**Version**: 1.0.0
