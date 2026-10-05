"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { type AdminContentItem } from "@/lib/admin-data";

/* Event hero slider — the full-bleed image band that opens the events
   section. Each slide auto-advances on a timer and wipes in from the
   right; clicking the photo or the copy (or the CTA) routes to that
   event's own page.

   Autoplay pauses on hover / focus / when the tab is hidden, and stops
   entirely for visitors who ask for reduced motion — an unrequested
   moving carousel is exactly what that preference is about.

   The progress bar is driven by the same clock that advances the slides
   and written straight to the DOM, so it can never drift out of step with
   the transition it is describing. */

const AUTOPLAY_MS = 6000;
/** Grace after a manual arrow/dot click so the visitor's own navigation
 *  isn't immediately undone by the timer. */
const RESUME_DELAY_MS = 1200;
const TICK_MS = 60;

function formatDateRange(item: AdminContentItem): string {
  if (!item.startsAt) return "";
  try {
    const start = new Date(item.startsAt);
    const end = item.endsAt ? new Date(item.endsAt) : null;
    const startStr = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(start);

    if (!end) return startStr;
    if (start.toDateString() === end.toDateString()) return startStr;
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const endStr = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(end);
      return `${startStr.split(",")[0]}–${endStr}, ${end.getFullYear()}`;
    }
    const endStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(end);
    return `${startStr} – ${endStr}`;
  } catch {
    return "";
  }
}

export function EventHeroSlider({ events }: { events: AdminContentItem[] }) {
  const [index, setIndex] = useState(0);
  /* Hover and tab-visibility are tracked separately so one clearing can't
     cancel the other — returning to a tab must not resume a carousel the
     visitor is still hovering, and leaving the carousel must not resume
     one whose tab is hidden. */
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const isPaused = hovered || hidden;
  const total = events.length;

  /* These two hold the clock. They live in refs rather than state so that
     every 60ms tick paints the bar directly instead of re-rendering the
     whole slide stack — the same trick the scroll progress rail uses. */
  const fillRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const elapsedRef = useRef(0);
  const resumeAtRef = useRef(0);
  const lastTickRef = useRef(0);
  const pausedRef = useRef(false);

  /* Keep the ref current without putting it in the interval's dependency
     array (which would tear the timer down on every hover). */
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  /* Guard against the list shrinking under us (admin deletes an event,
     a publish window closes) and leaving `index` past the end. */
  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [index, total]);

  const paint = useCallback(
    (activeIndex: number, progress: number) => {
      fillRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.transform = `scaleX(${i === activeIndex ? progress : 0})`;
      });
    },
    [],
  );

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
      elapsedRef.current = 0;
      paint(((next % total) + total) % total, 0);
    },
    [total, paint],
  );

  const stepManual = useCallback(
    (delta: number) => {
      resumeAtRef.current = Date.now() + RESUME_DELAY_MS;
      goTo(index + delta);
    },
    [goTo, index],
  );

  const goToManual = useCallback(
    (next: number) => {
      resumeAtRef.current = Date.now() + RESUME_DELAY_MS;
      goTo(next);
    },
    [goTo],
  );

  /* Single interval drives both the countdown and the slide swap, and
     pauses cleanly: while paused we neither accumulate time nor repaint,
     so resuming picks up exactly where it left off. */
  useEffect(() => {
    if (total <= 1) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      // Reduced motion: no auto-advance, bar parked full on the active dot.
      paint(index, 1);
      return;
    }

    elapsedRef.current = 0;
    lastTickRef.current = performance.now();
    paint(index, 0);

    let timer = 0;
    const tick = (now: number) => {
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!pausedRef.current && Date.now() >= resumeAtRef.current) {
        elapsedRef.current += dt;
        if (elapsedRef.current >= AUTOPLAY_MS) {
          setIndex((current) => (current + 1) % total);
          elapsedRef.current = 0;
          lastTickRef.current = now;
        } else {
          paint(index, Math.min(1, elapsedRef.current / AUTOPLAY_MS));
        }
      }

      timer = window.setTimeout(() => { timer = window.requestAnimationFrame(tick); }, TICK_MS);
    };

    timer = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(timer);
      window.clearTimeout(timer);
    };
    // Repaint target changes with the index, so re-arm on every slide.
  }, [total, index, paint]);

  /* Stop advancing while the tab is in the background so returning to the
     page doesn't jump the visitor several slides forward. */
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (total === 0) return null;

  const current = events[index];

  return (
    <section
      className="efsw-event-hero"
      data-paused={isPaused ? "true" : "false"}
      aria-roledescription="carousel"
      aria-label="Featured events"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(false);
      }}
    >
      <div className="efsw-event-hero__viewport">
        {events.map((item, i) => {
          const isActive = i === index;
          return (
            <article
              key={item.id}
              className="efsw-event-hero__slide"
              data-active={isActive ? "true" : "false"}
              aria-hidden={!isActive}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
            >
              {/* The photo itself is the primary target — clicking the
                  artwork goes to the event just as the copy does. */}
              <a
                className="efsw-event-hero__media"
                href={`/events/${item.id}`}
                tabIndex={isActive ? 0 : -1}
                aria-label={`Open event: ${item.title}`}
              >
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" aria-hidden="true" loading={i === 0 ? "eager" : "lazy"} />
                ) : (
                  <span className="efsw-event-hero__placeholder" />
                )}
              </a>

              <span className="efsw-event-hero__scrim" aria-hidden="true" />

              <div className="efsw-event-hero__body">
                <span className="efsw-event-hero__chip">{item.category}</span>

                <h3 className="efsw-event-hero__title">
                  <a href={`/events/${item.id}`} tabIndex={isActive ? 0 : -1}>
                    {item.title}
                  </a>
                </h3>

                <div className="efsw-event-hero__meta">
                  {item.startsAt && (
                    <span>
                      <Calendar size={15} aria-hidden />
                      <time dateTime={item.startsAt}>{formatDateRange(item)}</time>
                    </span>
                  )}
                  {item.venue && (
                    <span>
                      <MapPin size={15} aria-hidden />
                      {item.venue}
                    </span>
                  )}
                  {item.format && <span className="efsw-event-hero__format">{item.format}</span>}
                </div>

                {item.summary && <p className="efsw-event-hero__summary">{item.summary}</p>}

                <a
                  href={`/events/${item.id}`}
                  className="efsw-event-hero__cta"
                  tabIndex={isActive ? 0 : -1}
                >
                  <span>View event</span>
                  <span className="efsw-event-hero__cta-icon" aria-hidden="true">
                    <ArrowUpRight size={17} strokeWidth={2.2} />
                  </span>
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="efsw-event-hero__nav efsw-event-hero__nav--prev"
            onClick={() => stepManual(-1)}
            aria-label="Previous event"
          >
            <ChevronLeft size={22} aria-hidden />
          </button>

          <button
            type="button"
            className="efsw-event-hero__nav efsw-event-hero__nav--next"
            onClick={() => stepManual(1)}
            aria-label="Next event"
          >
            <ChevronRight size={22} aria-hidden />
          </button>

          <div className="efsw-event-hero__dots" role="tablist" aria-label="Choose event">
            {events.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show event: ${item.title}`}
                className="efsw-event-hero__dot"
                data-active={i === index ? "true" : "false"}
                onClick={() => goToManual(i)}
              >
                <span
                  className="efsw-event-hero__dot-fill"
                  ref={(el) => { fillRefs.current[i] = el; }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Announce slide changes without moving focus, which would yank the
          visitor out of the carousel mid-interaction. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {current.title}
      </p>
    </section>
  );
}

export default EventHeroSlider;
