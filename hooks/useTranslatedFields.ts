"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TranslationState = "idle" | "loading" | "done" | "error";

const CACHE_KEY = "efsw.translationCache";
const CACHE_LIMIT = 60;

type CacheShape = Record<string, Record<string, string>>;

const readCache = (): CacheShape => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed as CacheShape : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: CacheShape) => {
  if (typeof window === "undefined") return;
  try {
    // Trim oldest entries so a long browsing session cannot fill the quota.
    const keys = Object.keys(cache);
    const trimmed = keys.length > CACHE_LIMIT
      ? Object.fromEntries(keys.slice(-CACHE_LIMIT).map((key) => [key, cache[key]]))
      : cache;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // A full quota is not worth failing the translation over.
  }
};

/**
 * Translates a set of named strings on demand and remembers the result.
 *
 * `cacheId` should identify the source content (e.g. an article id) so the same
 * article is not re-translated on every visit.
 */
export function useTranslatedFields(cacheId: string, fields: Record<string, string>) {
  const [target, setTarget] = useState<string | null>(null);
  const [state, setState] = useState<TranslationState>("idle");
  const [translated, setTranslated] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  // Dropping the source content or switching articles invalidates the result.
  useEffect(() => {
    setTarget(null);
    setState("idle");
    setTranslated(null);
    setError(null);
  }, [cacheId]);

  const reset = useCallback(() => {
    requestRef.current += 1;
    setTarget(null);
    setState("idle");
    setTranslated(null);
    setError(null);
  }, []);

  const translate = useCallback(async (locale: string) => {
    if (locale === "en") {
      reset();
      return;
    }

    const cacheKey = `${cacheId}:${locale}`;
    const cache = readCache();
    if (cache[cacheKey]) {
      setTarget(locale);
      setTranslated(cache[cacheKey]);
      setState("done");
      setError(null);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setTarget(locale);
    setState("loading");
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, target: locale }),
      });
      const payload = await response.json();
      // A newer request (or a reset) superseded this one.
      if (requestRef.current !== requestId) return;

      if (!response.ok) throw new Error(payload?.error ?? "Translation failed");

      setTranslated(payload.fields);
      setState("done");
      writeCache({ ...cache, [cacheKey]: payload.fields });
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Translation failed");
      setState("error");
    }
  }, [cacheId, fields, reset]);

  return { target, state, translated, error, translate, reset };
}
