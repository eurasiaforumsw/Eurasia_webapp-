import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { RevealObserver } from "@/components/efsw/RevealObserver";
import { SmoothScrollProvider } from "@/components/efsw/SmoothScrollProvider";
import { I18nProvider } from "@/contexts/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/ui/toast";
import enMessages from "@/locales/en.json";
import thMessages from "@/locales/th.json";
import koMessages from "@/locales/ko.json";
import { cookies } from "next/headers";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const bric = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
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

type Locale = 'en' | 'th' | 'ko';

function getInitialLocale(): Locale {
  try {
    const cookieStore = cookies();
    const localeCookie = cookieStore.get("efsw.locale");

    if (localeCookie?.value && ["en", "th", "ko"].includes(localeCookie.value)) {
      return localeCookie.value as Locale;
    }
  } catch (error) {
    // Cookies not available in static rendering
  }

  return "th";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = getInitialLocale();

  return (
    <html lang={initialLocale} className={inter.variable + " " + bric.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('efsw.locale');
                  if (stored && ['en', 'th', 'ko'].includes(stored)) {
                    document.documentElement.lang = stored;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-surface-deep text-text-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <I18nProvider defaultLocale={initialLocale} messages={messages}>
            <ToastProvider>
              <SmoothScrollProvider>
                {/* Watches every [data-reveal] element on any route and adds
                    .is-visible when it scrolls into view. Renders nothing. */}
                <RevealObserver />
                {children}
              </SmoothScrollProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
