# 📋 Event Components

## RegistrationButton Component

### Features
✅ **8 Smart States** - Automatically handles all registration scenarios  
✅ **Authentication Aware** - Detects login status and redirects when needed  
✅ **Real-time Validation** - Checks dates, capacity, and registration status  
✅ **Beautiful Tooltips** - Shows registration info on hover  
✅ **EFSW Theme** - Consistent styling with BubbleButton integration  
✅ **Type Safe** - Full TypeScript support  

### Quick Start

```tsx
import RegistrationButton from '@/components/events/RegistrationButton';

<RegistrationButton
  eventId="your-event-id"
  onOpenModal={() => setShowModal(true)}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | string | ✅ | Event ID from database |
| `onOpenModal` | () => void | ❌ | Callback when "Register Now" is clicked |
| `className` | string | ❌ | Additional CSS classes |

### States

1. **Loading** - Fetching data
2. **Login to Register** - User not authenticated (redirects to login)
3. **Registration Closed** - Disabled in settings
4. **Registration Opens Soon** - Before start date
5. **Registration Ended** - After end date
6. **Event Full** - Max capacity reached
7. **You are Registered** - User already registered (green checkmark)
8. **Register Now** - Ready to register (opens modal)

### Documentation

- **Usage Guide**: `/REGISTRATION_BUTTON_USAGE.md`
- **Testing Guide**: `/TEST_REGISTRATION_BUTTON.md`
- **Visual Demo**: `/REGISTRATION_BUTTON_DEMO.html`

### API Dependencies

The component requires these endpoints:

- `GET /api/auth/status` - Check authentication
- `GET /api/events/[id]/registration-settings` - Get event settings
- `GET /api/events/[id]/registration-status` - Check user registration

All endpoints are implemented in `/app/api/`

### Example Integration

```tsx
'use client';

import { useState } from 'react';
import RegistrationButton from '@/components/events/RegistrationButton';
import RegistrationModal from '@/components/events/RegistrationModal';

export default function EventPage({ event }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      
      <RegistrationButton
        eventId={event.id}
        onOpenModal={() => setShowModal(true)}
        className="mt-6"
      />
      
      {showModal && (
        <RegistrationModal
          eventId={event.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```

### Styling

Uses EFSW design system:
- Primary gradient: `#38BDF8` → `#3B6DFF`
- Success gradient: `#6EE7B7` → `#10B981`
- Surface colors: `#0A0D12`, `#0F131C`
- Border radius: `999px` (fully rounded)
- Icons: Lucide React (18px)

### Testing

```bash
# Run dev server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/auth/status
curl http://localhost:3000/api/events/event-id/registration-settings
curl http://localhost:3000/api/events/event-id/registration-status

# Open visual demo
open REGISTRATION_BUTTON_DEMO.html
```

### Browser Console Testing

```javascript
// Check all endpoints
fetch('/api/auth/status').then(r => r.json()).then(console.log);
fetch('/api/events/event-summit-2026/registration-settings').then(r => r.json()).then(console.log);
fetch('/api/events/event-summit-2026/registration-status').then(r => r.json()).then(console.log);
```

### Database Schema

```sql
-- Registration Settings
CREATE TABLE event_registration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES content(id) UNIQUE,
  registration_enabled BOOLEAN DEFAULT false,
  registration_starts_at TIMESTAMPTZ,
  registration_ends_at TIMESTAMPTZ,
  max_attendees INTEGER
);

-- Event Registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES content(id),
  member_id UUID REFERENCES members(id),
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, member_id)
);
```

## Files Structure

```
components/events/
├── RegistrationButton.tsx          # Main component
├── RegistrationButton.test.tsx     # Test examples
└── README.md                       # This file

app/api/
├── auth/status/route.ts            # Auth check endpoint
└── events/[id]/
    ├── registration-settings/route.ts  # Get event settings
    └── registration-status/route.ts    # Check user registration

Documentation:
├── REGISTRATION_BUTTON_USAGE.md    # Complete usage guide
├── REGISTRATION_BUTTON_DEMO.html   # Visual demo (all states)
└── TEST_REGISTRATION_BUTTON.md     # Testing guide
```

## Next Steps

1. ✅ Component created and tested
2. 🔄 Create RegistrationModal for form input
3. 🔄 Create POST /api/events/[id]/register endpoint
4. 🔄 Add email confirmation system
5. 🔄 Integrate into event detail pages
6. 🔄 Create admin registration management UI

---

**Created**: October 11, 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
