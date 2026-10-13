import { ArrowUpRight } from "lucide-react";
import type { AdminLayoutConfig, AdminSettings } from "@/lib/admin-data";

export function SiteFooter({ layout, settings }: { layout: AdminLayoutConfig; settings: AdminSettings }) {
  return (
    <footer className="efsw-footer" id="footer">
      <div className="efsw-footer__top">
        <div>
          <a href="#home" className="efsw-brand" aria-label="Back to EFSW home">
            <span className="efsw-brand__mark">
              <img src="/efsw-logo-cream.png" alt="" width={64} height={64} />
            </span>
            <span>{settings.organizationName}</span>
          </a>
          <p>{layout.footerTagline}</p>
        </div>
        <div className="efsw-footer__links">
          <a href="/about">About</a>
          <a href="/events">Events</a>
          <a href="/news">News</a>
          <a href="/about#membership">Membership</a>
          <a href="/admin" className="efsw-footer__admin-link">{layout.footerAdminLinkLabel}</a>
        </div>
        <div className="efsw-footer__contact">
          <span>{layout.footerEmailLabel}</span>
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </div>
      </div>
      <div className="efsw-footer__bottom"><span>{layout.footerCopyright}</span><a href="#home">Back to top <ArrowUpRight size={15} /></a></div>
    </footer>
  );
}
