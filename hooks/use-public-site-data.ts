"use client";

import { useEffect, useState } from "react";
import { ADMIN_LAYOUT_KEY, ADMIN_SETTINGS_KEY, defaultLayoutConfig, getAdminSettingsRemote, syncAdminLayout, type AdminContentItem, type AdminContentKind } from "@/lib/admin-data";
import { fetchPublishedContent } from "@/lib/public-site-data";
import { defaultSiteSettings } from "@/lib/site-settings";

let layoutRequest: ReturnType<typeof syncAdminLayout> | null = null;

export function usePublicSettings() {
  const [settings, setSettings] = useState(defaultSiteSettings);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = await getAdminSettingsRemote();
        if (active) setSettings(next);
      } catch (error) {
        console.error("Unable to refresh public settings:", error);
      }
    };
    const onStorage = (event: StorageEvent) => { if (event.key === ADMIN_SETTINGS_KEY) void refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return settings;
}

export function usePublicLayout() {
  const [layout, setLayout] = useState(defaultLayoutConfig);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        layoutRequest ??= syncAdminLayout().finally(() => { layoutRequest = null; });
        const next = await layoutRequest;
        if (active) setLayout(next);
      } catch (error) {
        console.error("Unable to refresh public layout:", error);
      }
    };
    const onStorage = (event: StorageEvent) => { if (event.key === ADMIN_LAYOUT_KEY) void refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return layout;
}

export function usePublishedContent(kind: AdminContentKind) {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    let version = 0;
    setLoading(true);
    setLoaded(false);
    const refresh = async () => {
      const requestVersion = ++version;
      try {
        const next = await fetchPublishedContent(kind);
        if (active && requestVersion === version) {
          setItems(next);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Unable to refresh public content:", error);
      } finally {
        if (active && requestVersion === version) setLoading(false);
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [kind]);
  return { items, loading, loaded };
}
