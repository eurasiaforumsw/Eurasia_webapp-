"use client";

import { ArrowUpRight, Network, BookOpen, Globe, Users, Handshake, CornerDownRight } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ExecutiveBoard } from "@/components/efsw/ExecutiveBoard";
import { useI18n } from "@/contexts/I18nContext";

/* Structure and copy live in the `organization` locale namespace; this file
   keeps only the ordering, icons, and numbering that are not translatable. */
const BRANCHES = [
  { num: "02", key: "knowledge", Icon: BookOpen },
  { num: "03", key: "partnerships", Icon: Globe },
  { num: "04", key: "community", Icon: Users },
] as const;

const MEMBERSHIP_KEYS = ["professional", "student", "institutional"] as const;

/* Working groups — placeholder seed data awaiting EFSW confirmation.
   Roles are described by function, not by named individuals, so nothing
   here misrepresents a real appointment before the network confirms it. */
const WORKING_GROUPS = [
  { id: "WG-01", key: "wg01", seats: 12 },
  { id: "WG-02", key: "wg02", seats: 18 },
  { id: "WG-03", key: "wg03", seats: 9 },
  { id: "WG-04", key: "wg04", seats: 10 },
] as const;

/* Collaboration reach — indicative figures, pending confirmation */
const COLLAB_REACH = [
  { value: "4", key: "groups", Icon: Network },
  { value: "49", key: "seats", Icon: Users },
  { value: "3", key: "languages", Icon: Globe },
  { value: "2026", key: "cycle", Icon: Handshake },
] as const;

const COLLAB_STAGES = [
  { step: "01", key: "proposal" },
  { step: "02", key: "review" },
  { step: "03", key: "joint" },
  { step: "04", key: "practice" },
] as const;

export default function OrganizationPage() {
  const { t, tList } = useI18n();

  return (
    <>
      <SiteNav />
      <main className="efsw-org-page">

        {/* ── Masthead ── */}
        <header className="efsw-org-masthead" id="org-top">
          <div className="efsw-org-masthead__inner">
            <p className="efsw-section-label" data-reveal="fade">
              <Network size={14} aria-hidden /> {t("organization.eyebrow")}
            </p>
            <h1 data-reveal="clip" data-reveal-slow>
              {t("organization.headline")}<br /><span>{t("organization.headlineAccent")}</span>
            </h1>
            <p data-reveal="slide">{t("organization.intro")}</p>
          </div>
        </header>

        {/* ── Org Structure ── */}
        <section className="efsw-org-structure" id="structure" aria-labelledby="structure-label">
          <p id="structure-label" className="efsw-visually-hidden">{t("organization.structureLabel")}</p>
          <div className="efsw-org-structure__inner">

            {/* Executive Council — primary node */}
            <article className="efsw-org-node efsw-org-node--primary" data-reveal="scale">
              <div className="efsw-org-node__header">
                <span className="efsw-org-node__num">01</span>
                <span className="efsw-org-node__tag">{t("organization.nodes.council.tag")}</span>
              </div>
              <h2>{t("organization.nodes.council.title")}</h2>
              <p>{t("organization.nodes.council.body")}</p>
            </article>

            {/* Visual connector */}
            <div className="efsw-org-connector" aria-hidden="true">
              <span className="efsw-org-connector__stem" />
              <span className="efsw-org-connector__bar" />
            </div>

            {/* Three branches */}
            <div className="efsw-org-branches" data-reveal-group>
              {BRANCHES.map(({ num, key, Icon }) => (
                <article key={num} className="efsw-org-node efsw-org-node--branch" data-reveal="slide">
                  <div className="efsw-org-node__header">
                    <span className="efsw-org-node__num">{num}</span>
                    <span className="efsw-org-node__tag">{t(`organization.nodes.${key}.tag`)}</span>
                  </div>
                  <Icon size={22} className="efsw-org-node__icon" aria-hidden />
                  <h2>{t(`organization.nodes.${key}.title`)}</h2>
                  <p>{t(`organization.nodes.${key}.body`)}</p>
                </article>
              ))}
            </div>

          </div>
        </section>

        <ExecutiveBoard />

        {/* ── Team collaboration ── */}
        <section className="efsw-org-collab" id="collaboration" aria-labelledby="collab-title">
          <div className="efsw-org-collab__inner">

            <div className="efsw-org-collab__head">
              <div>
                <p className="efsw-section-label" data-reveal="fade">
                  <Handshake size={14} aria-hidden /> {t("organization.collabEyebrow")}
                </p>
                <h2 id="collab-title" data-reveal="clip" data-reveal-slow>
                  {t("organization.collabHeadline")}<br /><span>{t("organization.collabHeadlineAccent")}</span>
                </h2>
              </div>
              <p className="efsw-org-collab__lede" data-reveal="slide">{t("organization.collabLede")}</p>
            </div>

            {/* Reach strip */}
            <div className="efsw-org-collab__reach" data-reveal-group>
              {COLLAB_REACH.map(({ value, key, Icon }) => (
                <div key={key} className="efsw-collab-stat" data-reveal="scale">
                  <Icon size={18} aria-hidden />
                  <strong>{value}</strong>
                  <span>{t(`organization.reach.${key}.label`)}</span>
                  <small>{t(`organization.reach.${key}.note`)}</small>
                </div>
              ))}
            </div>

            {/* Working groups */}
            <div className="efsw-org-collab__grid" data-reveal-group>
              {WORKING_GROUPS.map(({ id, key, seats }) => {
                const roles = tList(`organization.workingGroups.${key}.composition`);
                return (
                  <article key={id} className="efsw-collab-card" data-reveal="slide">
                    <div className="efsw-collab-card__top">
                      <span className="efsw-collab-card__id"><Network size={15} aria-hidden /> {id}</span>
                      <span className="efsw-collab-card__cadence">{t(`organization.workingGroups.${key}.cadence`)}</span>
                    </div>

                    <h3>{t(`organization.workingGroups.${key}.name`)}</h3>
                    <p className="efsw-collab-card__reports">
                      <CornerDownRight size={13} aria-hidden />{" "}
                      {t("organization.reportsTo", {
                        group: t(`organization.nodes.${t(`organization.workingGroups.${key}.reportsTo`)}.title`),
                      })}
                    </p>
                    <p className="efsw-collab-card__focus">{t(`organization.workingGroups.${key}.focus`)}</p>

                    <ul className="efsw-collab-card__roles">
                      {roles.map((role) => <li key={role}>{role}</li>)}
                    </ul>

                    <div className="efsw-collab-card__foot">
                      <span><Users size={13} aria-hidden /> {t("organization.seats", { count: seats })}</span>
                      <span className="efsw-collab-card__status">{t("organization.openToMembers")}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* How collaboration moves */}
            <div className="efsw-org-collab__flow">
              <p className="efsw-section-label" data-reveal="fade">{t("organization.stagesLabel")}</p>
              <ol className="efsw-collab-flow" data-reveal-group>
                {COLLAB_STAGES.map(({ step, key }) => (
                  <li key={step} className="efsw-collab-step" data-reveal="slide">
                    <span className="efsw-collab-step__num">{step}</span>
                    <h4>{t(`organization.stages.${key}.title`)}</h4>
                    <p>{t(`organization.stages.${key}.body`)}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="efsw-org-collab__note" data-reveal="fade">{t("organization.note")}</p>
          </div>
        </section>

        {/* ── Membership ── */}
        <section className="efsw-org-membership" id="membership" aria-labelledby="membership-title">
          <div className="efsw-org-membership__inner">
            <p className="efsw-section-label" data-reveal="fade">{t("organization.membershipLabel")}</p>
            <h2 id="membership-title" data-reveal="clip" data-reveal-slow>
              {t("organization.membershipHeadline")}<br /><span>{t("organization.membershipHeadlineAccent")}</span>
            </h2>
            <div className="efsw-org-membership__grid" data-reveal-group>
              {MEMBERSHIP_KEYS.map((key) => (
                <div key={key} className="efsw-membership-type" data-reveal="slide">
                  <strong>{t(`organization.membership.${key}.type`)}</strong>
                  <p>{t(`organization.membership.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="efsw-content-cta" id="org-cta" data-reveal-group>
          <p className="efsw-section-label" data-reveal="fade">{t("organization.ctaLabel")}</p>
          <h2 data-reveal="clip" data-reveal-slow>
            {t("organization.ctaHeadline")}<br /><span>{t("organization.ctaHeadlineAccent")}</span>
          </h2>
          <p className="efsw-content-cta__copy" data-reveal="slide">{t("organization.ctaBody")}</p>
          <a
            href="mailto:support@eurasiaforumsw.org"
            className="efsw-button efsw-button--dark"
            data-reveal="slide"
          >
            {t("organization.ctaButton")} <ArrowUpRight size={17} aria-hidden />
          </a>
        </section>

        <footer className="efsw-about-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
          <span>English · Korean · Thai</span>
        </footer>
      </main>
    </>
  );
}
