"use client";

import { Languages, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import type { TranslationState } from "@/hooks/useTranslatedFields";
import { useI18n } from "@/contexts/I18nContext";

const LOCALES = [
  { code: "th", label: "ไทย", short: "TH" },
  { code: "ko", label: "한국어", short: "KO" },
] as const;

type TranslateControlProps = {
  /** Locale currently applied, or null when showing the original. */
  target: string | null;
  state: TranslationState;
  error: string | null;
  onTranslate: (locale: string) => void;
  onReset: () => void;
};

export default function TranslateControl({
  target,
  state,
  error,
  onTranslate,
  onReset,
}: TranslateControlProps) {
  const { t } = useI18n();
  const busy = state === "loading";

  return (
    <div className="efsw-translate" role="group" aria-label={t("article.translate")}>
      <span className="efsw-translate__icon" aria-hidden>
        {busy ? <Loader2 size={14} strokeWidth={2} className="efsw-translate__spin" /> : <Languages size={14} strokeWidth={2} />}
      </span>
      <span className="efsw-translate__label">{t("article.translate")}</span>

      {LOCALES.map((locale) => (
        <button
          key={locale.code}
          type="button"
          className={`efsw-translate__pill ${target === locale.code ? "is-active" : ""}`}
          onClick={() => onTranslate(locale.code)}
          disabled={busy}
          aria-pressed={target === locale.code}
          title={`Translate to ${locale.label}`}
        >
          {locale.short}
        </button>
      ))}

      {target && (
        <button
          type="button"
          className="efsw-translate__pill efsw-translate__pill--reset"
          onClick={onReset}
          disabled={busy}
          title={t("article.showOriginal")}
        >
          <RotateCcw size={12} strokeWidth={2.2} aria-hidden />
          {t("article.showOriginal")}
        </button>
      )}

      <span className="efsw-translate__status" role="status" aria-live="polite">
        {busy && t("article.translating")}
        {state === "done" && target && t("article.machineTranslated")}
        {state === "error" && (
          <span className="efsw-translate__error">
            <TriangleAlert size={12} strokeWidth={2.2} aria-hidden />
            {error ?? t("article.translateError")}
          </span>
        )}
      </span>
    </div>
  );
}
