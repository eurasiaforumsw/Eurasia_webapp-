export const navItems = [
  { label: "About EFSW", href: "#about" },
  { label: "Membership", href: "#membership" },
  { label: "Resources", href: "#resources" },
  { label: "Contact", href: "#contact" },
] as const;

export const efswImages = {
  small:
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85",
  large:
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85",
} as const;

export const membershipTiers = [
  {
    title: "Professional Member",
    slug: "professional",
    category: "Individual Practitioners & Academics",
    description:
      "Full access to premium research papers, global directory networking, and priority registration for international forums.",
    poster: efswImages.small,
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4",
    tone: "work-card--apricot",
    aspect: "landscape",
    badge: "Most Popular",
  },
  {
    title: "Student Member",
    slug: "student",
    category: "Undergraduate & Postgraduate Students",
    description:
      "Connect with senior international experts, access digital resource libraries, and view global field study opportunities.",
    poster: efswImages.large,
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_123323_f909c2b8-ff6c-4edf-882b-8ebcdbe389b5.mp4",
    tone: "work-card--lilac",
    aspect: "square",
    badge: "Mentorship Tier",
  },
  {
    title: "Institutional Member",
    slug: "institutional",
    category: "Universities, NGOs & Government Agencies",
    description:
      "Build cross-border alliances, showcase organization profiles, post international opportunities, and receive group passes.",
    poster: efswImages.small,
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4",
    tone: "work-card--apricot",
    aspect: "landscape",
    badge: "Partner Tier",
  },
] as const;

export type MembershipTier = (typeof membershipTiers)[number];
