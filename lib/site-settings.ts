import type { AdminSettings } from "./admin-data";

export const defaultSiteSettings: AdminSettings = {
  organizationName: "Eurasia Forum for Social Workers",
  contactEmail: "support@eurasiaforumsw.org",
  defaultLocale: "en",
  reviewNotifications: true,
};

export function normalizeSiteSettings(value: unknown): AdminSettings {
  const settings = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return {
    organizationName: typeof settings.organizationName === "string" && settings.organizationName.trim()
      ? settings.organizationName.trim() : defaultSiteSettings.organizationName,
    contactEmail: typeof settings.contactEmail === "string" && settings.contactEmail.trim()
      ? settings.contactEmail.trim() : typeof settings.organizationEmail === "string" && settings.organizationEmail.trim()
        ? settings.organizationEmail.trim() : defaultSiteSettings.contactEmail,
    defaultLocale: settings.defaultLocale === "th" || settings.defaultLocale === "ko" ? settings.defaultLocale : "en",
    reviewNotifications: typeof settings.reviewNotifications === "boolean" ? settings.reviewNotifications : true,
  };
}

export async function resolveInitialLocale(cookieValue: string | undefined,
  getSiteSettings: () => Promise<AdminSettings>): Promise<AdminSettings["defaultLocale"]> {
  if (cookieValue === "en" || cookieValue === "th" || cookieValue === "ko") return cookieValue;
  return (await getSiteSettings()).defaultLocale;
}
