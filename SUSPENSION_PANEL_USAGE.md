# SuspensionPanel Component Usage Guide

## Overview

The `SuspensionPanel` component provides a comprehensive UI for admins to suspend members from the platform. It includes:

- **Member Information Display**: Shows member name, email, and join date
- **Suspension Form**: Radio buttons for suspension type (24h, custom duration, permanent)
- **Reason Selection**: Dropdown with predefined suspension reasons
- **Additional Notes**: Optional textarea for detailed explanation
- **Confirmation Modal**: Double-check before applying suspension
- **Suspension History**: Shows all past suspensions with full details
- **Validation**: Ensures required fields are filled

## Installation

The component is already created at:
```
/components/admin/moderation/SuspensionPanel.tsx
```

## Usage

### Basic Integration

```tsx
import { SuspensionPanel } from "@/components/admin/moderation/SuspensionPanel";

export function MemberDetailsPage({ memberId }: { memberId: string }) {
  return (
    <SuspensionPanel
      memberId={memberId}
      memberName="John Doe"
      onSuccess={() => {
        // Refresh member list or show success message
        console.log("Member suspended successfully");
      }}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `memberId` | `string` | Yes | The ID of the member to suspend |
| `memberName` | `string` | No | Display name (optional, fetched from API if not provided) |
| `onSuccess` | `() => void` | No | Callback function when suspension is successful |

## Features

### 1. Suspension Types

- **Temporary (24 hours)**: Automatic 1-day suspension
- **Temporary (Custom duration)**: 1-365 days (user specifies)
- **Permanent**: Indefinite ban until manually lifted

### 2. Suspension Reasons

- Spam or flooding
- Abusive language
- Harassment
- Inappropriate content
- Terms of service violation
- Other (allows free text)

### 3. Validation

- **Reason Required**: User must select a reason
- **Custom Days Required**: When custom duration is selected, days must be > 0
- **Form Submission**: Shows loading state and prevents double submission

### 4. Suspension History

Shows all suspensions (active and lifted) with:
- Suspension type badge (color-coded)
- Reason category
- Detailed reason notes
- Suspension date/time
- Expiration date (if applicable)
- Lifted date (if already lifted)
- Active/Lifted status indicator

## API Endpoints

### 1. Get Member Details
```
GET /api/admin/members/[id]/details
```
Returns member name, email, and join date.

### 2. Get Suspension History
```
GET /api/admin/members/[id]/suspensions
```
Returns all suspensions for the member (active and inactive).

### 3. Suspend Member (Existing)
```
POST /api/admin/members/[id]/suspend
```
Requires:
- `suspension_type`: "temporary_24h" | "temporary_custom" | "permanent"
- `suspension_reason`: "Spam or flooding" | "Abusive language" | etc.
- `additional_notes`: Optional string
- `days_count`: Required if suspension_type is "temporary_custom"

Returns suspension ID and details.

## Design System Integration

The component uses admin design system CSS variables:
- `--admin-ink`: Primary text color
- `--admin-surface`: Card backgrounds
- `--admin-surface-deep`: Input/form backgrounds
- `--admin-line`: Border colors
- `--admin-muted`: Secondary text color
- `--admin-red`: Danger/suspension color
- `--admin-blue`: Secondary color
- `--admin-orange`: Warning color
- `--admin-green`: Success color

## Error Handling

The component handles:
- Missing member data (displays error state)
- Network failures (shows error message)
- Submission errors (displays error toast)
- Form validation errors (highlights required fields)

## Loading States

- Initial load: Shows loading spinner
- Form submission: Button shows spinner and "Suspending..." text
- Refresh after suspension: Automatically fetches updated suspension history

## Success States

After successful suspension:
1. Shows green success message
2. Clears form
3. Refreshes suspension history
4. Calls `onSuccess` callback if provided

## Testing

### Manual Testing Steps

1. Navigate to a member detail page with the component
2. Select suspension type (try each: 24h, custom, permanent)
3. If custom, enter days (test boundaries: 1, 365, invalid)
4. Select a reason
5. (Optional) Add additional notes
6. Click "Suspend Member"
7. Confirm in modal
8. Verify suspension appears in history
9. Check success message

### API Testing

```bash
# Get member details
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/members/member-id/details

# Get suspension history
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/members/member-id/suspensions

# Suspend a member
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suspension_type": "temporary_24h",
    "suspension_reason": "Spam or flooding",
    "additional_notes": "User sent 50 messages in 5 minutes"
  }' \
  http://localhost:3000/api/admin/members/member-id/suspend
```

## Database

The component relies on:
- `members` table: Member information
- `member_suspensions` table: Suspension records

Database functions used:
- `suspend_member()`: Creates suspension
- `lift_suspension()`: Removes suspension
- `is_member_suspended()`: Checks if member is currently suspended

## Styling Notes

The component uses:
- Inline styles for consistency
- CSS Grid for layouts
- CSS animations for loading/transitions
- Card-based design matching admin console
- Color-coded badges for suspension types

## Security

- JWT token verification on all API endpoints
- Admin role requirement enforced
- Audit logging integrated (logged in suspend endpoint)
- Cannot suspend self
- CSRF protection via standard Next.js mechanisms

## Accessibility

- Form labels properly associated with inputs
- Semantic HTML structure
- ARIA labels for icon buttons
- Keyboard navigable
- Color not the only indicator (uses icons + text)

## Performance

- Memoized component (`React.memo`)
- Efficient re-renders
- Suspensions fetched on mount
- No unnecessary API calls
- Pagination-ready for large histories

## Future Enhancements

Potential improvements:
- Bulk suspend multiple members
- Lift suspension from panel
- View lift history with lifted_by details
- Export suspension history CSV
- Search/filter in suspension history
- Automated suspension rules
- Notification to suspended member
- Email receipt for suspension
