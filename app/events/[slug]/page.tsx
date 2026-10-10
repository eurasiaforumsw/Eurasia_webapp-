"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import ArticleView, { type ArticleSeed } from "@/components/efsw/ArticleView";
import RegistrationButton from "@/components/events/RegistrationButton";
import RegistrationModal from "@/components/events/RegistrationModal";
import { initialContent } from "@/lib/admin-data";
import { Users } from "lucide-react";

type PageProps = { params: { slug: string } };

/* Mirrors /news/[slug] — seeds come from bundled content so each route
   prerenders with real copy, then ArticleView swaps in localStorage on mount. */
const seeds = initialContent.filter((item) => item.kind === "event") as ArticleSeed[];

const findSeed = (slug: string): ArticleSeed | undefined => seeds.find((item) => item.id === slug);

export default function EventDetailPage({ params }: PageProps) {
  const seed = findSeed(params.slug);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [registrationCount, setRegistrationCount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRegistration() {
      try {
        const response = await fetch(`/api/events/${params.slug}/registration-settings`);
        if (response.ok) {
          const data = await response.json();
          setRegistrationEnabled(data.registrationEnabled);
          setRegistrationCount(data.currentRegistrations ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch registration settings:", error);
      } finally {
        setLoading(false);
      }
    }

    checkRegistration();
  }, [params.slug]);

  if (!seed) notFound();

  const handleRegistrationSuccess = (confirmationNumber: string) => {
    // Refresh registration count
    fetch(`/api/events/${params.slug}/registration-settings`)
      .then(res => res.json())
      .then(data => {
        setRegistrationCount(data.currentRegistrations ?? 0);
      })
      .catch(console.error);
  };

  return (
    <>
      <style jsx global>{`
        .efsw-event-registration-section {
          margin: 3rem auto;
          padding: 2rem;
          max-width: 52rem;
          background: var(--surface-1);
          border: 1px solid var(--border-default);
          border-radius: 1rem;
        }

        .efsw-event-registration-section__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .efsw-event-registration-section__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background: var(--surface-2);
          border-radius: 0.5rem;
          color: var(--accent-primary);
        }

        .efsw-event-registration-section__title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .efsw-event-registration-section__description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .efsw-event-registration-section__stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: var(--surface-2);
          border-radius: 0.75rem;
        }

        .efsw-event-registration-section__stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .efsw-event-registration-section__stat-label {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .efsw-event-registration-section__stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .efsw-event-registration-section__action {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 48rem) {
          .efsw-event-registration-section {
            padding: 1.5rem;
            margin: 2rem 1rem;
          }

          .efsw-event-registration-section__stats {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .efsw-event-registration-section__stat {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>

      <ArticleView
        kind="event"
        slug={params.slug}
        seed={seed}
        backHref="/events"
      />

      {!loading && registrationEnabled && (
        <div className="efsw-event-registration-section">
          <div className="efsw-event-registration-section__header">
            <div className="efsw-event-registration-section__icon">
              <Users size={20} strokeWidth={2} />
            </div>
            <h2 className="efsw-event-registration-section__title">
              Event Registration
            </h2>
          </div>

          <p className="efsw-event-registration-section__description">
            Register for this event to receive updates and confirmation details.
            You must be logged in to complete your registration.
          </p>

          {registrationCount !== null && registrationCount > 0 && (
            <div className="efsw-event-registration-section__stats">
              <div className="efsw-event-registration-section__stat">
                <span className="efsw-event-registration-section__stat-label">
                  Registered Attendees
                </span>
                <span className="efsw-event-registration-section__stat-value">
                  {registrationCount}
                </span>
              </div>
            </div>
          )}

          <div className="efsw-event-registration-section__action">
            <RegistrationButton
              eventId={params.slug}
              onOpenModal={() => setIsModalOpen(true)}
            />
          </div>
        </div>
      )}

      <RegistrationModal
        eventId={params.slug}
        eventName={seed.title}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
}
