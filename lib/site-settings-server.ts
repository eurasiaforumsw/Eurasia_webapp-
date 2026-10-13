import { defaultSiteSettings, normalizeSiteSettings } from "./site-settings";
import type { AdminSettings } from "./admin-data";

export async function getPublicSiteSettings(): Promise<AdminSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return defaultSiteSettings;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      import("@/app/api/settings/route").then(({ GET }) => GET()),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Site settings lookup timed out")), 3000);
      }),
    ]);
    if (!response.ok) throw new Error("Unable to load site settings");
    const data = await response.json();
    return normalizeSiteSettings(data.settings);
  } catch (error) {
    console.error("Unable to load default site settings:", error);
    return defaultSiteSettings;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
