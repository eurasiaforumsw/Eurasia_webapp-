import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/efsw/SmoothScrollProvider";
import { I18nProvider } from "@/contexts/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import enMessages from "@/locales/en.json";
import thMessages from "@/locales/th.json";
import koMessages from "@/locales/ko.json";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-axion-body",
});

const bric = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-axion-display",
});

const messages = {
  en: enMessages,
  th: thMessages,
  ko: koMessages,
};

export const metadata: Metadata = {
  title: "Eurasia Forum for Social Workers (EFSW) | Award-Winning Interactive Platform",
  description: "Premier international platform for professional networking, academic dissemination, and cross-border collaboration across the Eurasian region.",
  keywords: ["EFSW", "Social Workers", "Eurasia", "International Forum", "Social Work Network"],
  authors: [{ name: "EFSW" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Eurasia Forum for Social Workers (EFSW)",
    description: "Connect · Empower · Advocate. Bridging communities and advancing knowledge across the Eurasian region.",
    siteName: "EFSW",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eurasia Forum for Social Workers (EFSW)",
    description: "Connect · Empower · Advocate. Bridging communities and advancing knowledge across the Eurasian region.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable + " " + bric.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased bg-surface-deep text-text-primary">
        <ThemeProvider>
          <I18nProvider defaultLocale="en" messages={messages}>
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
