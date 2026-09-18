"use client";

import { useEffect, useState } from "react";
import {
  AdminBoardMember,
  defaultLayoutConfig,
  getAdminLayout,
} from "@/lib/admin-data";

function BoardMemberCard({ member }: { member: AdminBoardMember }) {
  const initials = member.name
    .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="efsw-board-member" data-reveal="scale">
      <div className="efsw-board-member__portrait" aria-label={`Portrait placeholder for ${member.name}`}>
        {member.image ? <img src={member.image} alt={member.name} /> : <span>{initials}</span>}
      </div>
      <div className="efsw-board-member__body">
        <span className="efsw-board-member__country">{member.country}</span>
        <h3>{member.name}</h3>
        {member.title !== "Executive Committee" && <p>{member.title}</p>}
      </div>
    </article>
  );
}

export function ExecutiveBoard() {
  const [members, setMembers] = useState<AdminBoardMember[]>(defaultLayoutConfig.boardMembers);
  const [activeGroup, setActiveGroup] = useState<"president" | "committee">("president");

  useEffect(() => {
    const sync = () => setMembers(getAdminLayout().boardMembers);
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);

  const president = members.filter(({ title }) => title === "President");
  const committee = members.filter(({ title }) => title !== "President");
  const countries = new Set(committee.map(({ country }) => country)).size;
  const visibleMembers = activeGroup === "president" ? president : committee;

  return (
    <section className="efsw-org-board" id="executive-board" aria-labelledby="board-title">
      <div className="efsw-org-board__inner">
        <div className="efsw-org-board__head">
          <div>
            <p className="efsw-section-label" data-reveal="fade">Executive board</p>
            <h2 id="board-title" data-reveal="clip" data-reveal-slow>
              The people<br /><span>behind the forum.</span>
            </h2>
          </div>
          <p data-reveal="slide">
            Meet the regional leaders who guide the Eurasia Forum of Social Workers and keep its work connected across borders.
          </p>
        </div>

        <div className="efsw-org-board__tabs" role="tablist" aria-label="Executive board groups">
          <button
            type="button"
            role="tab"
            aria-selected={activeGroup === "president"}
            className={activeGroup === "president" ? "is-active" : ""}
            onClick={() => setActiveGroup("president")}
          >
            <span>01</span>
            <strong>President</strong>
            <small>{president[0]?.country || "South Korea"}</small>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeGroup === "committee"}
            className={activeGroup === "committee" ? "is-active" : ""}
            onClick={() => setActiveGroup("committee")}
          >
            <span>02</span>
            <strong>Executive committee</strong>
            <small>{committee.length} members · {countries} countries</small>
          </button>
        </div>

        <div className="efsw-org-board__section efsw-org-board__section--active" key={activeGroup} data-reveal-group>
          <div className="efsw-org-board__section-label">
            <span>{activeGroup === "president" ? "01" : "02"}</span>
            <h3>{activeGroup === "president" ? "President" : "Executive committee"}</h3>
            <span>{activeGroup === "president" ? president[0]?.country || "South Korea" : `${committee.length} members · ${countries} countries`}</span>
          </div>
          <div className={`efsw-org-board__grid ${activeGroup === "president" ? "efsw-org-board__grid--president" : ""}`}>
            {visibleMembers.map((member) => <BoardMemberCard key={member.id} member={member} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
