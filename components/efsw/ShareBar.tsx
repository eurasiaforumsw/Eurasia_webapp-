"use client";

import { useEffect, useState } from "react";
import { Check, Link as LinkIcon, Mail, Share2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

/* Brand glyphs are inline SVG because lucide-react ships no brand marks.
   Each path is drawn on a 24x24 viewBox and filled with currentColor so the
   buttons inherit the neutral/brand hover colouring from CSS. */
const BrandGlyph = ({ path, label }: { path: string; label: string }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" role="img" aria-label={label}>
    <path d={path} />
  </svg>
);

const FACEBOOK_PATH =
  "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z";

const LINE_PATH =
  "M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 0 1-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 0 1-.631.63.62.62 0 0 1-.51-.251l-2.443-3.317v2.94a.63.63 0 0 1-1.257 0V8.108a.626.626 0 0 1 .624-.63c.195 0 .375.104.494.256l2.462 3.33V8.108a.63.63 0 0 1 1.261 0v4.771zm-5.741 0a.63.63 0 0 1-.629.63.63.63 0 0 1-.63-.63V8.108a.63.63 0 0 1 .63-.63c.346 0 .629.285.629.63v4.771zm-2.466.63H4.917a.634.634 0 0 1-.63-.63V8.108c0-.345.283-.63.63-.63.348 0 .629.285.629.63v4.141h1.756c.348 0 .629.283.629.63a.63.63 0 0 1-.629.63M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314";

const KAKAO_PATH =
  "M12 2.4C6.2 2.4 1.5 6.06 1.5 10.58c0 2.9 1.94 5.45 4.87 6.9-.21.79-.78 2.9-.89 3.35-.14.55.2.54.42.39.17-.11 2.74-1.86 3.85-2.62.73.11 1.48.16 2.25.16 5.8 0 10.5-3.66 10.5-8.18S17.8 2.4 12 2.4Z";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.025-.52-.083-.149-.669-1.612-.916-2.207-.245-.595-.49-.51-.669-.51-.173 0-.371-.025-.57-.025-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

const TELEGRAM_PATH =
  "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.26-1.91.178-.184 3.247-2.977 3.307-3.23.005-.03.01-.14-.054-.196-.055-.048-.145-.03-.212-.017-.096.017-1.622 1.03-4.586 3.043-.433.297-.824.442-1.174.433-.386-.008-1.13-.219-1.682-.4-.68-.221-1.219-.338-1.196-.714.012-.195.283-.395.81-.6 3.16-1.376 5.267-2.283 6.322-2.72 3.011-1.253 3.636-1.47 4.043-1.477z";

type ShareTarget = {
  id: string;
  label: string;
  /** Builds the share endpoint from the encoded page URL and title. */
  href: (url: string, title: string) => string;
  glyph: string;
};

/* Web share endpoints only — none of these need an SDK or app key, so they work
   from a static export. Kakao routes through KakaoStory: in-web KakaoTalk
   sharing requires the Kakao JS SDK with a registered JavaScript key. */
const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "facebook",
    label: "Facebook",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    glyph: FACEBOOK_PATH,
  },
  {
    id: "line",
    label: "LINE",
    href: (url, title) => `https://social-plugins.line.me/lineit/share?url=${url}&text=${title}`,
    glyph: LINE_PATH,
  },
  {
    id: "kakao",
    label: "Kakao",
    href: (url) => `https://story.kakao.com/share?url=${url}`,
    glyph: KAKAO_PATH,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: (url, title) => `https://api.whatsapp.com/send?text=${title}%20${url}`,
    glyph: WHATSAPP_PATH,
  },
  {
    id: "telegram",
    label: "Telegram",
    href: (url, title) => `https://t.me/share/url?url=${url}&text=${title}`,
    glyph: TELEGRAM_PATH,
  },
];

type ShareBarProps = {
  title: string;
  summary?: string;
  /** Optional label above the buttons; omit for a bare row. */
  heading?: string;
  variant?: "block" | "inline";
  /** Path of the page being shared, used to build an href before hydration. */
  path?: string;
  /** Content ID for tracking shares in the database. */
  contentId?: string;
  /** Member ID if user is logged in. */
  memberId?: string;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

export default function ShareBar({ title, summary, heading, variant = "block", path, contentId, memberId }: ShareBarProps) {
  const { t } = useI18n();
  // Seeded server-side so the anchors ship with a real href (focusable, and
  // usable without JS); replaced with the live URL once mounted.
  const [pageUrl, setPageUrl] = useState(() => (SITE_URL && path ? `${SITE_URL}${path}` : SITE_URL));
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const trackShare = (platform: string) => {
    if (!contentId) return;

    // Fire and forget - don't block the share action
    fetch("/api/engagement/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId,
        platform,
        memberId: memberId || undefined,
      }),
    }).catch(() => {
      // Silently fail - tracking is non-critical
    });
  };

  useEffect(() => {
    if (!copied) return;
    const reset = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(reset);
  }, [copied]);

  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  const mailtoHref = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${summary ? `${summary}\n\n` : ""}${pageUrl}`)}`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: summary, url: pageUrl });
      trackShare("native");
    } catch {
      // A dismissed share sheet rejects; nothing to recover from.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      trackShare("copy_link");
    } catch {
      setCopied(false);
    }
  };

  const handleShareClick = (platform: string) => {
    trackShare(platform);
  };

  return (
    <div className={`efsw-share ${variant === "inline" ? "efsw-share--inline" : ""}`}>
      {heading && <p className="efsw-share__heading">{heading}</p>}
      <div className="efsw-share__row">
        {SHARE_TARGETS.map((target) => (
          <a
            key={target.id}
            className={`efsw-share__button efsw-share__button--${target.id}`}
            href={target.href(encodedUrl, encodedTitle)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("article.shareOn", { service: target.label })}
            title={t("article.shareOn", { service: target.label })}
            onClick={() => handleShareClick(target.id)}
          >
            <BrandGlyph path={target.glyph} label={target.label} />
          </a>
        ))}

        <a
          className="efsw-share__button efsw-share__button--mail"
          href={mailtoHref}
          aria-label={t("article.shareByEmail")}
          title={t("article.shareByEmail")}
          onClick={() => handleShareClick("email")}
        >
          <Mail size={17} strokeWidth={1.9} aria-hidden />
        </a>

        <button
          type="button"
          className={`efsw-share__button efsw-share__button--copy ${copied ? "is-copied" : ""}`}
          onClick={handleCopy}
          aria-label={t(copied ? "article.linkCopied" : "article.copyLink")}
          title={t(copied ? "article.linkCopied" : "article.copyLink")}
        >
          {copied ? <Check size={17} strokeWidth={2.2} aria-hidden /> : <LinkIcon size={17} strokeWidth={1.9} aria-hidden />}
        </button>

        {/* Native sheet covers region-specific apps (WeChat, Zalo, KakaoTalk…). */}
        {canNativeShare && (
          <button
            type="button"
            className="efsw-share__button efsw-share__button--native"
            onClick={handleNativeShare}
            aria-label={t("article.moreOptions")}
            title={t("article.moreOptions")}
          >
            <Share2 size={17} strokeWidth={1.9} aria-hidden />
          </button>
        )}
      </div>
      <span className="efsw-share__status" role="status" aria-live="polite">
        {copied ? t("article.linkCopiedStatus") : ""}
      </span>
    </div>
  );
}
