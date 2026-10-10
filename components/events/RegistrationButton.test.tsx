/**
 * RegistrationButton Component Test File
 *
 * Manual testing checklist:
 *
 * 1. NOT LOGGED IN STATE:
 *    - Button shows "Login to Register" with Lock icon
 *    - Click redirects to /login?returnTo=/events/{eventId}
 *
 * 2. REGISTRATION CLOSED STATE:
 *    - Button shows "Registration Closed" with X icon
 *    - Button is disabled
 *
 * 3. REGISTRATION NOT STARTED STATE:
 *    - Button shows "Registration Opens Soon" with Clock icon
 *    - Tooltip shows opening date
 *
 * 4. REGISTRATION ENDED STATE:
 *    - Button shows "Registration Ended" with X icon
 *    - Button is disabled
 *
 * 5. EVENT FULL STATE:
 *    - Button shows "Event Full" with X icon
 *    - Tooltip shows current/max attendees
 *
 * 6. ALREADY REGISTERED STATE:
 *    - Button shows "You are Registered" with Check icon (success variant)
 *    - Button is disabled
 *
 * 7. CAN REGISTER STATE:
 *    - Button shows "Register Now" with UserPlus icon (primary variant)
 *    - Click calls onOpenModal callback
 *    - Tooltip shows registration period
 *
 * To test in browser:
 *
 * 1. Start dev server: npm run dev
 * 2. Navigate to any event page
 * 3. Add RegistrationButton component to event detail page
 * 4. Test each state by modifying database values
 */

import RegistrationButton from './RegistrationButton';

// Example usage in an event detail page:
/*

import RegistrationButton from '@/components/events/RegistrationButton';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  return (
    <div>
      <h1>Event Title</h1>

      <RegistrationButton
        eventId={params.id}
        onOpenModal={() => setShowRegistrationModal(true)}
        className="mt-4"
      />

      {showRegistrationModal && (
        <RegistrationModal
          eventId={params.id}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
    </div>
  );
}

*/

export default function RegistrationButtonTest() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">RegistrationButton Test Page</h1>

      <div className="space-y-4">
        <RegistrationButton
          eventId="test-event-1"
          onOpenModal={() => alert('Modal opened!')}
        />
      </div>
    </div>
  );
}
