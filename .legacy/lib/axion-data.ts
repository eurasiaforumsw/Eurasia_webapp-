export const navItems = [
  {
    label: "Projects",
    href: "/projects",
    children: [
      { label: "Narrativ", href: "/projects/narrativ" },
      { label: "Luminar", href: "/projects/luminar" },
    ],
  },
  { label: "Studio", href: "/studio" },
] as const;

export const studioImages = {
  small:
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85",
  large:
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85",
} as const;

export const workItems = [
  {
    title: "Narrativ",
    slug: "narrativ",
    poster: studioImages.small,
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4",
    tone: "work-card--apricot",
    aspect: "landscape",
    category: "Interactive 3D showcase",
    description:
      "Winner of Site of the Month 2025 - an interactive 3D showcase driving record engagement.",
  },
  {
    title: "Luminar",
    slug: "luminar",
    poster: studioImages.large,
    video:
      "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_123323_f909c2b8-ff6c-4edf-882b-8ebcdbe389b5.mp4",
    tone: "work-card--lilac",
    aspect: "square",
    category: "Brand experience",
    description:
      "Transforming a dated platform into a conversion-focused brand experience.",
  },
] as const;

export type WorkItem = (typeof workItems)[number];
