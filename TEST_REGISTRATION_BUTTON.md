# ✅ RegistrationButton Component - Testing Guide

## Quick Test Commands

### 1. Test Auth Status Endpoint
```bash
curl http://localhost:3000/api/auth/status
```
Expected response (not logged in):
```json
{"authenticated":false}
```

### 2. Test Registration Settings Endpoint
```bash
curl http://localhost:3000/api/events/event-summit-2026/registration-settings
```
Expected response:
```json
{
  "registrationEnabled": false,
  "registrationStartsAt": null,
  "registrationEndsAt": null,
  "maxAttendees": null,
  "currentRegistrations": 0
}
```

### 3. Test Registration Status Endpoint (requires auth)
```bash
curl http://localhost:3000/api/events/event-summit-2026/registration-status \
  -H "Cookie: member_token=YOUR_TOKEN_HERE"
```

## Browser Testing

### Step 1: Open Demo Page
```bash
open /Users/rischen/Documents/GitHub/Eurasia_webapp/REGISTRATION_BUTTON_DEMO.html
```
This shows all 8 button states visually.

### Step 2: Test in Real App
Add to `/app/events/[slug]/page.tsx`:

```tsx
import RegistrationButton from '@/components/events/RegistrationButton';

// Inside the component:
<RegistrationButton
  eventId={event.id}
  onOpenModal={() => alert('Registration modal will open here')}
  className="mt-6"
/>
```

### Step 3: Console Testing
Open browser console on event page:

```javascript
// Test auth status
fetch('/api/auth/status')
  .then(r => r.json())
  .then(d => console.log('Auth:', d));

// Test registration settings
fetch('/api/events/event-summit-2026/registration-settings')
  .then(r => r.json())
  .then(d => console.log('Settings:', d));

// Test registration status (only if logged in)
fetch('/api/events/event-summit-2026/registration-status')
  .then(r => r.json())
  .then(d => console.log('Status:', d));
```

## Database Setup Required

Before full testing, create these tables:

```sql
-- 1. Registration Settings
CREATE TABLE event_registration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES content(id) ON DELETE CASCADE,
  registration_enabled BOOLEAN DEFAULT false,
  registration_starts_at TIMESTAMPTZ,
  registration_ends_at TIMESTAMPTZ,
  max_attendees INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id)
);

-- 2. Event Registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES content(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, member_id)
);
```

## Testing Each State

### 1. Loading State
- Automatically shows for ~1 second on page load
- Check: Button shows "Loading..." with Clock icon

### 2. Login to Register
- **Setup**: Logout or use incognito mode
- **Expected**: Button shows "Login to Register" with Lock icon
- **Action**: Click button
- **Expected**: Redirects to `/login?returnTo=/events/{eventId}`

### 3. Registration Closed
- **Setup**: No registration settings in database OR `registration_enabled = false`
- **Expected**: Button shows "Registration Closed" with X icon
- **Clickable**: No (disabled)

### 4. Registration Opens Soon
- **Setup**: Login + Set `registration_starts_at` to future date
```sql
INSERT INTO event_registration_settings (event_id, registration_enabled, registration_starts_at)
VALUES ('event-id', true, '2024-12-01 09:00:00+00');
```
- **Expected**: Button shows "Registration Opens Soon"
- **Hover**: Tooltip shows opening date

### 5. Registration Ended
- **Setup**: Login + Set `registration_ends_at` to past date
```sql
UPDATE event_registration_settings
SET registration_ends_at = '2024-09-01 17:00:00+00'
WHERE event_id = 'event-id';
```
- **Expected**: Button shows "Registration Ended"

### 6. Event Full
- **Setup**: Login + Set max_attendees and fill capacity
```sql
UPDATE event_registration_settings
SET max_attendees = 2
WHERE event_id = 'event-id';

-- Create 2 registrations
INSERT INTO event_registrations (event_id, member_id, status)
VALUES ('event-id', 'member-1', 'confirmed'),
       ('event-id', 'member-2', 'confirmed');
```
- **Expected**: Button shows "Event Full"
- **Hover**: Tooltip shows "2/2 registered"

### 7. Already Registered
- **Setup**: Login + Register current user
```sql
INSERT INTO event_registrations (event_id, member_id, status)
VALUES ('event-id', 'YOUR_MEMBER_ID', 'confirmed');
```
- **Expected**: Green button with checkmark "You are Registered"
- **Clickable**: No (disabled)

### 8. Register Now
- **Setup**: Login + Enable registration + Not registered yet
```sql
UPDATE event_registration_settings
SET registration_enabled = true,
    registration_starts_at = now() - interval '1 day',
    registration_ends_at = now() + interval '30 days',
    max_attendees = 100
WHERE event_id = 'event-id';
```
- **Expected**: Blue button "Register Now" with UserPlus icon
- **Action**: Click button
- **Expected**: Calls `onOpenModal()` callback

## Visual Test Checklist

- [ ] All 8 states render correctly
- [ ] Icons appear and are properly sized
- [ ] Button colors match EFSW theme (primary/success)
- [ ] Disabled states have proper opacity
- [ ] Tooltip appears on hover for applicable states
- [ ] Tooltip shows correct information
- [ ] Tooltip arrow points to button
- [ ] Button animation works (BubbleButton effect)
- [ ] Mobile responsive (test on small screens)
- [ ] Transitions are smooth

## API Response Validation

### Auth Status Success
```json
{
  "authenticated": true,
  "memberId": "uuid-here",
  "email": "user@example.com",
  "role": "member"
}
```

### Registration Settings Success
```json
{
  "registrationEnabled": true,
  "registrationStartsAt": "2024-10-15T09:00:00.000Z",
  "registrationEndsAt": "2024-10-30T17:00:00.000Z",
  "maxAttendees": 100,
  "currentRegistrations": 45
}
```

### Registration Status Success
```json
{
  "registered": true,
  "registration": {
    "id": "uuid-here",
    "status": "confirmed",
    "created_at": "2024-10-11T10:30:00.000Z"
  }
}
```

## Common Issues & Solutions

### Issue: Button stuck on "Loading"
**Cause**: API endpoints not responding
**Solution**: 
1. Check dev server is running: `curl http://localhost:3000/api/auth/status`
2. Check browser console for errors
3. Verify API routes exist in `/app/api/`

### Issue: "Registration Closed" always shows
**Cause**: No settings in database
**Solution**: Insert test data:
```sql
INSERT INTO event_registration_settings (event_id, registration_enabled)
VALUES ('your-event-id', true);
```

### Issue: 401 Unauthorized error
**Cause**: Not logged in or invalid token
**Solution**: Login through `/member/login` first

### Issue: Tooltip not showing
**Cause**: No date/capacity information available
**Solution**: Add dates to registration settings

## Performance Checks

- [ ] Component loads in < 1 second
- [ ] API calls complete in < 500ms
- [ ] No console errors
- [ ] No memory leaks on unmount
- [ ] Multiple buttons on same page work independently

## Next Steps After Testing

1. ✅ Verify all 8 states work
2. 🔄 Create RegistrationModal component
3. 🔄 Add POST endpoint for registration
4. 🔄 Integrate with email notifications
5. 🔄 Add to event detail pages
6. 🔄 Test end-to-end flow

## Files to Review

- Component: `/components/events/RegistrationButton.tsx`
- API Auth: `/app/api/auth/status/route.ts`
- API Settings: `/app/api/events/[id]/registration-settings/route.ts`
- API Status: `/app/api/events/[id]/registration-status/route.ts`
- Demo: `REGISTRATION_BUTTON_DEMO.html`
- Docs: `REGISTRATION_BUTTON_USAGE.md`
