# RegistrationButton Component

## Overview
Smart event registration button that handles all registration states automatically.

## Features
✅ **8 Different States** - Handles all registration scenarios
✅ **Authentication Integration** - Checks login status automatically  
✅ **Real-time Validation** - Checks capacity, dates, and user registration
✅ **Tooltip Information** - Shows registration period on hover
✅ **EFSW Theme** - Uses BubbleButton with consistent styling
✅ **Responsive Icons** - Lucide icons for each state

## Installation
Component is located at: `/components/events/RegistrationButton.tsx`

## Required API Endpoints
The component requires these endpoints to function:

1. **GET /api/auth/status** - Check if user is authenticated
2. **GET /api/events/[id]/registration-settings** - Get event registration config
3. **GET /api/events/[id]/registration-status** - Check if user is registered

All endpoints have been created in `/app/api/` directory.

## Usage

### Basic Usage
```tsx
import RegistrationButton from '@/components/events/RegistrationButton';

<RegistrationButton
  eventId="event-123"
  onOpenModal={() => setShowModal(true)}
/>
```

### With Custom Styling
```tsx
<RegistrationButton
  eventId="event-123"
  onOpenModal={() => setShowModal(true)}
  className="w-full sm:w-auto"
/>
```

### Complete Example
```tsx
'use client';

import { useState } from 'react';
import RegistrationButton from '@/components/events/RegistrationButton';
import RegistrationModal from '@/components/events/RegistrationModal';

export default function EventDetailPage({ params }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="event-detail">
      <h1>Event Title</h1>
      
      <RegistrationButton
        eventId={params.id}
        onOpenModal={() => setShowModal(true)}
      />
      
      {showModal && (
        <RegistrationModal
          eventId={params.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```

## Button States

| State | Icon | Variant | Clickable | Description |
|-------|------|---------|-----------|-------------|
| **Loading** | Clock | - | ❌ | Fetching registration data |
| **Login to Register** | Lock | primary | ✅ | User not logged in - redirects to login |
| **Registration Closed** | X | - | ❌ | Registration disabled in settings |
| **Registration Opens Soon** | Clock | - | ❌ | Before registration start date |
| **Registration Ended** | X | - | ❌ | After registration end date |
| **Event Full** | X | - | ❌ | Max attendees reached |
| **You are Registered** | Check | success | ❌ | User already registered |
| **Register Now** | UserPlus | primary | ✅ | Ready to register - opens modal |

## Props

```typescript
interface RegistrationButtonProps {
  eventId: string;           // Required: Event ID
  onOpenModal?: () => void;  // Optional: Callback when "Register Now" clicked
  className?: string;        // Optional: Additional CSS classes
}
```

## Tooltip Content
Hover over the button to see:
- Registration opening date/time
- Registration closing date/time  
- Current registrations / Max capacity

Example: `Opens: Oct 15, 2024, 9:00 AM • Closes: Oct 30, 2024, 5:00 PM • 45/100 registered`

## Database Requirements

### event_registration_settings table
```sql
- event_id (uuid, FK to content)
- registration_enabled (boolean)
- registration_starts_at (timestamptz, nullable)
- registration_ends_at (timestamptz, nullable)
- max_attendees (integer, nullable)
```

### event_registrations table
```sql
- id (uuid, PK)
- event_id (uuid, FK to content)
- member_id (uuid, FK to members)
- status (text: 'confirmed', 'cancelled', etc.)
- created_at (timestamptz)
```

## API Response Formats

### /api/auth/status
```json
{
  "authenticated": true,
  "memberId": "uuid",
  "email": "user@example.com",
  "role": "member"
}
```

### /api/events/[id]/registration-settings
```json
{
  "registrationEnabled": true,
  "registrationStartsAt": "2024-10-15T09:00:00Z",
  "registrationEndsAt": "2024-10-30T17:00:00Z",
  "maxAttendees": 100,
  "currentRegistrations": 45
}
```

### /api/events/[id]/registration-status
```json
{
  "registered": true,
  "registration": {
    "id": "uuid",
    "status": "confirmed",
    "created_at": "2024-10-11T10:30:00Z"
  }
}
```

## Styling
Uses EFSW design tokens:
- Surface colors: `#0A0D12` (tooltip background)
- BubbleButton variants: `primary`, `success`
- Icons: Lucide React icons (4x4 size)
- Tooltip: Custom implementation with arrow

## Testing

### Manual Test Scenarios

1. **Test Not Logged In**
   - Open browser in incognito mode
   - Button should show "Login to Register"
   - Click should redirect to login page

2. **Test Registration Closed**
   - Set `registration_enabled = false` in database
   - Button should show "Registration Closed"

3. **Test Date Restrictions**
   - Set `registration_starts_at` to future date
   - Button should show "Registration Opens Soon"
   - Set `registration_ends_at` to past date
   - Button should show "Registration Ended"

4. **Test Capacity**
   - Set `max_attendees = 50`
   - Create 50 registrations
   - Button should show "Event Full"

5. **Test Already Registered**
   - Login and register for event
   - Button should show "You are Registered" (green)

6. **Test Can Register**
   - Login
   - Ensure registration is open and not full
   - Button should show "Register Now"
   - Click should trigger onOpenModal callback

### Browser Console Testing
```javascript
// Check auth status
fetch('/api/auth/status').then(r => r.json()).then(console.log);

// Check registration settings
fetch('/api/events/event-123/registration-settings').then(r => r.json()).then(console.log);

// Check registration status (must be logged in)
fetch('/api/events/event-123/registration-status').then(r => r.json()).then(console.log);
```

## Files Created

1. **Component**: `/components/events/RegistrationButton.tsx` (270 lines)
2. **API Endpoints**:
   - `/app/api/auth/status/route.ts` (24 lines)
   - `/app/api/events/[id]/registration-settings/route.ts` (65 lines)
   - `/app/api/events/[id]/registration-status/route.ts` (51 lines)
3. **Test File**: `/components/events/RegistrationButton.test.tsx`
4. **Documentation**: This file

## Next Steps

To complete the registration system:

1. **Create RegistrationModal component** - Form for collecting registration data
2. **Create POST /api/events/[id]/register endpoint** - Save registration
3. **Add to event detail pages** - Import and use the button
4. **Create database tables** - Run migrations for registration tables
5. **Test end-to-end flow** - From button click to confirmation

## Notes

- Component is fully TypeScript typed
- Uses Next.js 14 App Router patterns
- All API calls are client-side (component is marked "use client")
- Error handling includes console logging for debugging
- Gracefully degrades if APIs are unavailable
- Tooltip is custom-built (no external tooltip library required)
- Compatible with all modern browsers

## Support
For issues or questions, refer to:
- Component source: `/components/events/RegistrationButton.tsx`
- API implementations: `/app/api/auth/` and `/app/api/events/[id]/`
- Test examples: `/components/events/RegistrationButton.test.tsx`
