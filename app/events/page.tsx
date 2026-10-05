import type { Metadata } from "next";
import EventsPage from "@/components/efsw/EventsPage";
import { type PublicContentItem } from "@/components/efsw/PublicContentFeed";

export const metadata: Metadata = {
  title: "Events | Eurasia Forum for Social Workers",
  description: "Summits, webinars, workshops and gatherings hosted by the Eurasia Forum for Social Workers.",
};

const eventItems: PublicContentItem[] = [
  {
    id: "event-summit-2026",
    category: "Summit",
    title: "EFSW Regional Summit 2026",
    summary: "Our flagship annual gathering — three days of keynotes, workshops and cross-border partnerships under one roof.",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&h=900&q=80",
    imageCaption: "Delegates at a regional summit plenary",
    startsAt: "2026-11-12T09:00:00.000Z",
    endsAt: "2026-11-14T17:30:00.000Z",
    venue: "Bangkok International Trade & Exhibition Centre (BITEC)",
    format: "In-person",
  },
  {
    id: "event-webinar-youth",
    category: "Webinar",
    title: "Youth mental-health practice across borders",
    summary: "A 90-minute panel bringing school social workers from Seoul, Bangkok and Tbilisi into one live conversation.",
    coverImage: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1600&h=900&q=80",
    imageCaption: "Online panel discussion",
    startsAt: "2026-10-08T13:00:00.000Z",
    endsAt: "2026-10-08T14:30:00.000Z",
    venue: "Online (Zoom)",
    format: "Webinar",
  },
  {
    id: "event-workshop-data",
    category: "Workshop",
    title: "Field data & evidence: a two-day masterclass",
    summary: "Hands-on training for practitioner-researchers who want to turn casework into publishable evidence.",
    coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&h=900&q=80",
    imageCaption: "Small-group workshop",
    startsAt: "2026-09-22T09:00:00.000Z",
    endsAt: "2026-09-23T16:00:00.000Z",
    venue: "Chulalongkorn University, Bangkok",
    format: "In-person",
  },
];

export default function Page() {
  return <EventsPage initialItems={eventItems} />;
}
