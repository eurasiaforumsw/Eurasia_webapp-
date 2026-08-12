"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { getAdminSession, logoutAdmin, AdminSession } from "@/lib/admin-auth";
import {
  AdminActivity,
  AdminContentItem,
  AdminContentKind,
  AdminContentStatus,
  AdminMember,
  AdminSettings,
  deleteAdminContent,
  deleteAdminMember,
  getAdminActivity,
  getAdminContent,
  getAdminMembers,
  getAdminSettings,
  recordAdminActivity,
  saveAdminContent,
  saveAdminSettings,
  setAdminMemberStatus,
} from "@/lib/admin-data";

type AdminView = "overview" | "members" | "content" | "activity" | "settings";
type MemberFilter = "all" | "pending" | "active" | "suspended";
type ContentFilter = "all" | AdminContentKind;
type ContentStatusFilter = "all" | AdminContentStatus;
type OverlayLayer = "mobile-nav" | "member" | "content" | "confirm";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const getActiveElement = () => document.activeElement instanceof HTMLElement ? document.activeElement : null;

const focusWithoutScrolling = (element: HTMLElement | null) => {
  if (!element?.isConnected) return;
  window.requestAnimationFrame(() => {
    if (element.isConnected) element.focus({ preventScroll: true });
  });
};

const typeLabels: Record<AdminMember["membershipType"], string> = {
  professional: "Professional",
  student: "Student",
  institutional: "Institutional",
};

const statusLabels: Record<AdminMember["status"], string> = {
  pending: "รอตรวจสอบ",
  active: "ใช้งานอยู่",
  suspended: "ระงับชั่วคราว",
};

const statusTone: Record<AdminMember["status"], string> = {
  pending: "is-pending",
  active: "is-active",
  suspended: "is-suspended",
};

const contentStatusLabels: Record<AdminContentStatus, string> = {
  draft: "ฉบับร่าง",
  published: "เผยแพร่แล้ว",
  archived: "เก็บถาวร",
};

const blankContent: AdminContentItem = {
  id: "",
  kind: "news",
  category: "",
  title: "",
  summary: "",
  body: "",
  status: "draft",
  locale: "th",
  updatedAt: "",
};

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "-";
  }
};

const formatTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "-";
  }
};

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [view, setView] = useState<AdminView>("overview");
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [content, setContent] = useState<AdminContentItem[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [contentStatusFilter, setContentStatusFilter] = useState<ContentStatusFilter>("all");
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [memberNote, setMemberNote] = useState("");
  const [contentEditor, setContentEditor] = useState<AdminContentItem | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<"member" | "content" | null>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const memberDrawerRef = useRef<HTMLElement>(null);
  const contentEditorRef = useRef<HTMLElement>(null);
  const confirmDialogRef = useRef<HTMLElement>(null);
  const adminMainRef = useRef<HTMLDivElement>(null);
  const mobileNavReturnFocusRef = useRef<HTMLElement | null>(null);
  const memberReturnFocusRef = useRef<HTMLElement | null>(null);
  const contentReturnFocusRef = useRef<HTMLElement | null>(null);
  const confirmReturnFocusRef = useRef<HTMLElement | null>(null);
  const confirmOwnerRef = useRef<"member" | "content" | null>(null);
  const previousOverlayRef = useRef<OverlayLayer | null>(null);
  const overlayLayer: OverlayLayer | null = confirmDelete
    ? "confirm"
    : selectedMember
      ? "member"
      : contentEditor
        ? "content"
        : mobileNavOpen
          ? "mobile-nav"
          : null;
  const overlayOpen = overlayLayer !== null;

  useEffect(() => {
    const current = getAdminSession();
    if (!current) {
      window.location.replace("/admin/login");
      return;
    }
    setSession(current);
    setMembers(getAdminMembers());
    setContent(getAdminContent());
    setActivity(getAdminActivity());
    setSettings(getAdminSettings());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!overlayOpen) return;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [overlayOpen]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 52rem)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (!event.matches) setMobileNavOpen(false);
    };
    mobileQuery.addEventListener("change", closeOnDesktop);
    return () => mobileQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const baseContentInert = overlayLayer !== null;
    const sidebarInert = overlayLayer !== null && overlayLayer !== "mobile-nav";
    const nestedDialogInert = overlayLayer === "confirm";

    if (adminMainRef.current) adminMainRef.current.inert = baseContentInert;
    if (mobileNavRef.current) mobileNavRef.current.inert = sidebarInert;
    if (memberDrawerRef.current) memberDrawerRef.current.inert = nestedDialogInert;
    if (contentEditorRef.current) contentEditorRef.current.inert = nestedDialogInert;

    return () => {
      if (adminMainRef.current) adminMainRef.current.inert = false;
      if (mobileNavRef.current) mobileNavRef.current.inert = false;
      if (memberDrawerRef.current) memberDrawerRef.current.inert = false;
      if (contentEditorRef.current) contentEditorRef.current.inert = false;
    };
  }, [overlayLayer]);

  useEffect(() => {
    const previousLayer = previousOverlayRef.current;
    previousOverlayRef.current = overlayLayer;

    if (!overlayLayer) {
      const returnTarget = previousLayer === "confirm"
        ? confirmOwnerRef.current === "member"
          ? memberReturnFocusRef.current
          : contentReturnFocusRef.current
        : previousLayer === "member"
          ? memberReturnFocusRef.current
          : previousLayer === "content"
            ? contentReturnFocusRef.current
            : previousLayer === "mobile-nav"
              ? mobileNavReturnFocusRef.current
              : null;
      const fallbackTarget = adminMainRef.current?.querySelector<HTMLElement>(".efsw-admin-view-heading h1") ?? null;
      focusWithoutScrolling(returnTarget?.isConnected ? returnTarget : fallbackTarget);
      return;
    }

    const container = overlayLayer === "confirm"
      ? confirmDialogRef.current
      : overlayLayer === "member"
        ? memberDrawerRef.current
        : overlayLayer === "content"
          ? contentEditorRef.current
          : mobileNavRef.current;
    if (!container) return;

    const getFocusableElements = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => element.getAttribute("aria-hidden") !== "true" && element.offsetParent !== null);
    const preferredFocus = previousLayer === "confirm" && overlayLayer !== "confirm"
      ? confirmReturnFocusRef.current
      : container.querySelector<HTMLElement>("[data-initial-focus]") ?? getFocusableElements()[0] ?? container;
    focusWithoutScrolling(preferredFocus);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (overlayLayer === "confirm") setConfirmDelete(null);
        if (overlayLayer === "member") setSelectedMember(null);
        if (overlayLayer === "content") setContentEditor(null);
        if (overlayLayer === "mobile-nav") setMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [overlayLayer]);

  const refreshActivity = () => setActivity(getAdminActivity());
  const notify = (message: string) => setToast(message);

  const logActivity = (action: string, detail: string, tone: AdminActivity["tone"] = "neutral") => {
    recordAdminActivity({ action, detail, tone });
    refreshActivity();
  };

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    return members.filter((member) => {
      const matchesStatus = memberFilter === "all" || member.status === memberFilter;
      const haystack = [member.fullName, member.email, member.country, member.organization, member.university].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [memberFilter, memberSearch, members]);

  const filteredContent = useMemo(() => content.filter((item) => {
    const matchesKind = contentFilter === "all" || item.kind === contentFilter;
    const matchesStatus = contentStatusFilter === "all" || item.status === contentStatusFilter;
    return matchesKind && matchesStatus;
  }), [content, contentFilter, contentStatusFilter]);

  const pendingCount = members.filter((member) => member.status === "pending").length;
  const activeCount = members.filter((member) => member.status === "active").length;
  const suspendedCount = members.filter((member) => member.status === "suspended").length;
  const publishedCount = content.filter((item) => item.status === "published").length;
  const draftCount = content.filter((item) => item.status === "draft").length;

  const openMember = (member: AdminMember) => {
    memberReturnFocusRef.current = getActiveElement();
    setSelectedMember(member);
    setMemberNote(member.reviewNote ?? "");
  };

  const openContentEditor = (item: AdminContentItem) => {
    contentReturnFocusRef.current = getActiveElement();
    setContentEditor({ ...item });
  };

  const openDeleteConfirmation = (owner: "member" | "content") => {
    confirmReturnFocusRef.current = getActiveElement();
    confirmOwnerRef.current = owner;
    setConfirmDelete(owner);
  };

  const toggleMobileNav = () => {
    if (!mobileNavOpen) mobileNavReturnFocusRef.current = getActiveElement();
    setMobileNavOpen((open) => !open);
  };

  const updateMemberStatus = (status: AdminMember["status"]) => {
    if (!selectedMember) return;
    const updated = setAdminMemberStatus(selectedMember.id, status, memberNote);
    setMembers(getAdminMembers());
    setSelectedMember(updated);
    logActivity(status === "active" ? "อนุมัติสมาชิก" : status === "suspended" ? "ระงับสมาชิก" : "เปลี่ยนสถานะสมาชิก", `${selectedMember.fullName} · ${statusLabels[status]}`, status === "active" ? "success" : "warning");
    notify(`อัปเดตสถานะของ ${selectedMember.fullName} แล้ว`);
  };

  const saveMemberNote = () => {
    if (!selectedMember) return;
    const updated = setAdminMemberStatus(selectedMember.id, selectedMember.status, memberNote);
    setMembers(getAdminMembers());
    setSelectedMember(updated);
    logActivity("บันทึกหมายเหตุสมาชิก", selectedMember.fullName, "success");
    notify("บันทึกหมายเหตุจากผู้ตรวจสอบแล้ว");
  };

  const removeSelectedMember = () => {
    if (!selectedMember) return;
    const name = selectedMember.fullName;
    setMembers(deleteAdminMember(selectedMember.id));
    logActivity("ลบสมาชิก", name, "warning");
    setSelectedMember(null);
    setConfirmDelete(null);
    notify("ลบสมาชิกออกจากรายการแล้ว");
  };

  const exportMembers = () => {
    const rows = [
      ["Member ID", "Name", "Email", "Country", "Type", "Status", "Joined"],
      ...filteredMembers.map((member) => [member.id, member.fullName, member.email, member.country, typeLabels[member.membershipType], statusLabels[member.status], formatDate(member.joinedAt)]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "efsw-members.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    logActivity("ส่งออกข้อมูลสมาชิก", `${filteredMembers.length} รายการ`);
    notify("ดาวน์โหลด CSV แล้ว");
  };

  const saveContentItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contentEditor) return;
    const isNew = !contentEditor.id;
    const item = { ...contentEditor, id: contentEditor.id || `content-${Date.now().toString(36)}`, updatedAt: new Date().toISOString() };
    setContent(saveAdminContent(item));
    logActivity(isNew ? "สร้างเนื้อหา" : "แก้ไขเนื้อหา", item.title, "success");
    setContentEditor(null);
    notify("บันทึกเนื้อหาแล้ว");
  };

  const removeContentItem = () => {
    if (!contentEditor) return;
    setContent(deleteAdminContent(contentEditor.id));
    logActivity("ลบเนื้อหา", contentEditor.title, "warning");
    setContentEditor(null);
    setConfirmDelete(null);
    notify("ลบเนื้อหาแล้ว");
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSettings(saveAdminSettings(settings));
    logActivity("บันทึกการตั้งค่า", "ปรับปรุงข้อมูลการติดต่อและการแจ้งเตือน", "success");
    notify("บันทึกการตั้งค่าแล้ว");
  };

  const signOut = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  if (!session) return <main className="efsw-admin-loading"><div className="efsw-admin-loader" /><p>กำลังเปิดพื้นที่ผู้ดูแล…</p></main>;

  const navItems: Array<{ id: AdminView; label: string; english: string; icon: typeof LayoutDashboard; badge?: number }> = [
    { id: "overview", label: "ภาพรวม", english: "Overview", icon: LayoutDashboard },
    { id: "members", label: "จัดการสมาชิก", english: "Members", icon: UsersRound, badge: pendingCount },
    { id: "content", label: "เนื้อหาเว็บไซต์", english: "Content", icon: Newspaper },
    { id: "activity", label: "ประวัติการทำงาน", english: "Activity", icon: Activity },
    { id: "settings", label: "การตั้งค่า", english: "Settings", icon: Settings },
  ];

  const changeView = (next: AdminView) => {
    setView(next);
    setMobileNavOpen(false);
  };

  return (
    <main className="efsw-admin-shell">
      <aside id="efsw-admin-sidebar" ref={mobileNavRef} className={`efsw-admin-sidebar ${mobileNavOpen ? "is-open" : ""}`} tabIndex={-1} aria-hidden={overlayLayer && overlayLayer !== "mobile-nav" ? true : undefined} data-lenis-prevent>
        <div className="efsw-admin-sidebar__brand">
          <a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a>
          <button type="button" className="efsw-admin-sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="ปิดเมนูผู้ดูแล"><X size={18} /></button>
          <span className="efsw-admin-brand-tag">OPERATIONS</span>
        </div>
        <nav className="efsw-admin-nav" aria-label="เมนูผู้ดูแลระบบ">
          <span className="efsw-admin-nav__label">Workspace</span>
          {navItems.map(({ id, label, english, icon: Icon, badge }) => (
            <button key={id} type="button" className={view === id ? "is-active" : ""} onClick={() => changeView(id)} aria-label={label} aria-current={view === id ? "page" : undefined}>
              <Icon size={17} aria-hidden="true" /><span>{label}<small>{english}</small></span>{badge ? <b>{badge}</b> : null}
            </button>
          ))}
        </nav>
        <div className="efsw-admin-sidebar__footer">
          <div className="efsw-admin-user"><span className="efsw-admin-user__avatar"><UserRound size={16} /></span><span><strong>{session.name}</strong><small>{session.role}</small></span></div>
          <button type="button" className="efsw-admin-signout" onClick={signOut} aria-label="ออกจากระบบ"><LogOut size={16} /><span>ออกจากระบบ</span></button>
        </div>
      </aside>

      <div ref={adminMainRef} className="efsw-admin-main" aria-hidden={overlayOpen ? true : undefined}>
        <header className="efsw-admin-topbar">
          <button type="button" className="efsw-admin-mobile-toggle" onClick={toggleMobileNav} aria-controls="efsw-admin-sidebar" aria-expanded={mobileNavOpen} aria-label={mobileNavOpen ? "ปิดเมนู" : "เปิดเมนู"}>{mobileNavOpen ? <X size={19} /> : <Menu size={19} />}</button>
          <div><p className="efsw-admin-eyebrow">EFSW / Admin console</p><span className="efsw-admin-topbar__date">{new Intl.DateTimeFormat("th-TH", { dateStyle: "full" }).format(new Date())}</span></div>
          <div className="efsw-admin-topbar__actions"><a href="/" target="_blank" rel="noreferrer" className="efsw-admin-quiet-action">ดูเว็บไซต์ <ArrowUpRight size={15} /></a><span className="efsw-admin-prototype-pill"><ShieldCheck size={14} /> Local prototype</span></div>
        </header>

        <div className="efsw-admin-content">
          {view === "overview" && <OverviewView members={members} content={content} activity={activity} pendingCount={pendingCount} activeCount={activeCount} suspendedCount={suspendedCount} publishedCount={publishedCount} draftCount={draftCount} onView={changeView} />}

          {view === "members" && <section className="efsw-admin-view" aria-labelledby="members-title">
            <ViewHeading id="members-title" eyebrow="People / สมาชิก" title="จัดการสมาชิก" description="ตรวจสอบสถานะ ดูรายละเอียด และดูแลข้อมูลผู้สมัครในเครือข่าย EFSW." action={<button type="button" className="efsw-admin-outline-action" onClick={exportMembers}><ClipboardList size={16} /> ส่งออก CSV</button>} />
            <div className="efsw-admin-toolbar"><label className="efsw-admin-search"><Search size={17} /><span className="sr-only">ค้นหาสมาชิก</span><input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="ค้นหาชื่อ อีเมล ประเทศ หรือองค์กร" /></label><label className="efsw-admin-select"><Filter size={15} /><span className="sr-only">กรองสถานะ</span><select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value as MemberFilter)}><option value="all">ทุกสถานะ</option><option value="pending">รอตรวจสอบ</option><option value="active">ใช้งานอยู่</option><option value="suspended">ระงับชั่วคราว</option></select><ChevronDown size={15} /></label><span className="efsw-admin-result-count">{filteredMembers.length} จาก {members.length} รายการ</span></div>
            <div className="efsw-admin-table-wrap"><table className="efsw-admin-table"><caption className="sr-only">รายชื่อสมาชิก EFSW</caption><thead><tr><th>สมาชิก</th><th>ประเภท</th><th>ประเทศ / องค์กร</th><th>สถานะ</th><th>เข้าร่วมเมื่อ</th><th><span className="sr-only">การทำงาน</span></th></tr></thead><tbody>{filteredMembers.map((member) => <tr key={member.id} tabIndex={0} aria-label={`เปิดรายละเอียดสมาชิก ${member.fullName}`} onClick={() => openMember(member)} onKeyDown={(event) => { if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return; event.preventDefault(); openMember(member); }}><td data-label="สมาชิก"><span className="efsw-admin-member-cell"><span className="efsw-admin-member-avatar"><UserRound size={16} /></span><span><strong>{member.fullName}</strong><small>{member.email}</small></span></span></td><td data-label="ประเภท"><span className="efsw-admin-type">{typeLabels[member.membershipType]}</span></td><td data-label="ประเทศ / องค์กร"><span>{member.country}</span><small>{member.organization || member.university || "ยังไม่ระบุ"}</small></td><td data-label="สถานะ"><span className={`efsw-admin-status ${statusTone[member.status]}`}><i />{statusLabels[member.status]}</span></td><td data-label="เข้าร่วมเมื่อ">{formatDate(member.joinedAt)}</td><td data-label="การทำงาน"><button type="button" className="efsw-admin-icon-button" onClick={(event) => { event.stopPropagation(); openMember(member); }} aria-label={`ดูข้อมูล ${member.fullName}`}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table>{filteredMembers.length === 0 && <EmptyState icon={UsersRound} title="ไม่พบสมาชิก" body="ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" />}</div>
          </section>}

          {view === "content" && <section className="efsw-admin-view" aria-labelledby="content-title">
            <ViewHeading id="content-title" eyebrow="Publishing / เนื้อหา" title="เนื้อหาเว็บไซต์" description="จัดการข่าวประชาสัมพันธ์และเอกสารวิชาการ พร้อมสถานะร่าง เผยแพร่ และเก็บถาวร." action={<button type="button" className="efsw-admin-primary efsw-admin-primary--compact" onClick={() => openContentEditor(blankContent)}><Plus size={16} /> สร้างเนื้อหา</button>} />
            <div className="efsw-admin-toolbar"><div className="efsw-admin-segmented" role="group" aria-label="ประเภทเนื้อหา"><button type="button" aria-pressed={contentFilter === "all"} className={contentFilter === "all" ? "is-active" : ""} onClick={() => setContentFilter("all")}>ทั้งหมด</button><button type="button" aria-pressed={contentFilter === "news"} className={contentFilter === "news" ? "is-active" : ""} onClick={() => setContentFilter("news")}><Newspaper size={14} /> ข่าว</button><button type="button" aria-pressed={contentFilter === "document"} className={contentFilter === "document" ? "is-active" : ""} onClick={() => setContentFilter("document")}><FileText size={14} /> เอกสาร</button></div><label className="efsw-admin-select"><Filter size={15} /><span className="sr-only">กรองสถานะเนื้อหา</span><select value={contentStatusFilter} onChange={(event) => setContentStatusFilter(event.target.value as ContentStatusFilter)}><option value="all">ทุกสถานะ</option><option value="published">เผยแพร่แล้ว</option><option value="draft">ฉบับร่าง</option><option value="archived">เก็บถาวร</option></select><ChevronDown size={15} /></label><span className="efsw-admin-result-count">{filteredContent.length} รายการ</span></div>
            <div className="efsw-admin-content-list">{filteredContent.map((item) => <article className="efsw-admin-content-row" key={item.id}><div className="efsw-admin-content-row__marker"><span>{item.kind === "news" ? <Newspaper size={17} /> : <FileText size={17} />}</span><small>{item.category}</small></div><div className="efsw-admin-content-row__body"><div className="efsw-admin-content-row__meta"><span>{item.kind === "news" ? "ข่าวประชาสัมพันธ์" : "เอกสารวิชาการ"}</span><span>{item.locale.toUpperCase()}</span></div><h2>{item.title}</h2><p>{item.summary}</p><div className="efsw-admin-content-row__footer"><span className={`efsw-admin-content-status is-${item.status}`}>{contentStatusLabels[item.status]}</span><small>อัปเดต {formatDate(item.updatedAt)}</small><button type="button" className="efsw-admin-text-action" onClick={() => openContentEditor(item)}>แก้ไข <ArrowUpRight size={15} /></button></div></div></article>)}{filteredContent.length === 0 && <EmptyState icon={FileText} title="ไม่พบเนื้อหา" body="ลองเปลี่ยนประเภทหรือสถานะที่กรองไว้" />}</div>
          </section>}

          {view === "activity" && <section className="efsw-admin-view" aria-labelledby="activity-title"><ViewHeading id="activity-title" eyebrow="Audit trail / บันทึก" title="ประวัติการทำงาน" description="ติดตามการเปลี่ยนแปลงที่เกิดขึ้นในพื้นที่ผู้ดูแลระบบ." /><div className="efsw-admin-activity-list">{activity.length ? activity.map((entry) => <article key={entry.id}><span className={`efsw-admin-activity-icon is-${entry.tone}`}><Activity size={16} /></span><div><strong>{entry.action}</strong><p>{entry.detail}</p></div><time dateTime={entry.at}>{formatTime(entry.at)}</time></article>) : <EmptyState icon={Activity} title="ยังไม่มีประวัติการทำงาน" body="กิจกรรมจากการตรวจสอบสมาชิกและแก้ไขเนื้อหาจะแสดงที่นี่" />}</div></section>}

          {view === "settings" && <section className="efsw-admin-view" aria-labelledby="settings-title"><ViewHeading id="settings-title" eyebrow="Configuration / ตั้งค่า" title="การตั้งค่าระบบ" description="กำหนดข้อมูลพื้นฐานและการแจ้งเตือนสำหรับทีมดูแล EFSW." /><form className="efsw-admin-settings-form" onSubmit={saveSettings}><fieldset><legend>ข้อมูลเว็บไซต์</legend><label>ชื่อองค์กร<input required value={settings.organizationName} onChange={(event) => setSettings((current) => ({ ...current, organizationName: event.target.value }))} /></label><label>อีเมลติดต่อหลัก<input required type="email" value={settings.contactEmail} onChange={(event) => setSettings((current) => ({ ...current, contactEmail: event.target.value }))} /></label><label>ภาษาเริ่มต้น<select value={settings.defaultLocale} onChange={(event) => setSettings((current) => ({ ...current, defaultLocale: event.target.value as AdminSettings["defaultLocale"] }))}><option value="th">ไทย</option><option value="en">English</option><option value="ko">한국어</option></select></label></fieldset><fieldset><legend>การแจ้งเตือน</legend><label className="efsw-admin-switch-row"><span><strong>แจ้งเตือนเมื่อมีสมาชิกใหม่</strong><small>แสดงสถานะการตรวจสอบใน dashboard เมื่อเปิดพื้นที่ผู้ดูแล</small></span><input type="checkbox" checked={settings.reviewNotifications} onChange={(event) => setSettings((current) => ({ ...current, reviewNotifications: event.target.checked }))} /></label></fieldset><div className="efsw-admin-settings-actions"><button type="submit" className="efsw-admin-primary"><Check size={16} /> บันทึกการตั้งค่า</button><p>การตั้งค่าในโหมดนี้เก็บไว้ในเบราว์เซอร์เครื่องนี้</p></div></form></section>}
        </div>
      </div>

      {mobileNavOpen && <button type="button" className="efsw-admin-scrim" onClick={() => setMobileNavOpen(false)} aria-label="ปิดเมนูผู้ดูแล" />}

      {selectedMember && <div className="efsw-admin-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMember(null); }}><section ref={memberDrawerRef} className="efsw-admin-drawer" role="dialog" aria-modal={confirmDelete ? undefined : true} aria-hidden={confirmDelete ? true : undefined} aria-labelledby="member-drawer-title" tabIndex={-1} data-lenis-prevent><header><div><p className="efsw-admin-eyebrow">Member record / รายละเอียดสมาชิก</p><h2 id="member-drawer-title">{selectedMember.fullName}</h2></div><button type="button" className="efsw-admin-icon-button" onClick={() => setSelectedMember(null)} aria-label="ปิดรายละเอียดสมาชิก" data-initial-focus><X size={18} /></button></header><div className="efsw-admin-drawer__status"><span className={`efsw-admin-status ${statusTone[selectedMember.status]}`}><i />{statusLabels[selectedMember.status]}</span><span>{typeLabels[selectedMember.membershipType]}</span></div><dl className="efsw-admin-detail-list"><div><dt>อีเมล</dt><dd>{selectedMember.email}</dd></div><div><dt>ประเทศ</dt><dd>{selectedMember.country}</dd></div><div><dt>องค์กร / สถาบัน</dt><dd>{selectedMember.organization || selectedMember.university || "ยังไม่ระบุ"}</dd></div><div><dt>ตำแหน่ง / สาขา</dt><dd>{selectedMember.position || selectedMember.faculty || selectedMember.contactPosition || "ยังไม่ระบุ"}</dd></div><div><dt>Member ID</dt><dd>{selectedMember.id}</dd></div><div><dt>สมัครเมื่อ</dt><dd>{formatDate(selectedMember.joinedAt)}</dd></div></dl><label className="efsw-admin-drawer__note">บันทึกจากผู้ตรวจสอบ<textarea rows={4} value={memberNote} onChange={(event) => setMemberNote(event.target.value)} placeholder="เพิ่มหมายเหตุสำหรับทีมงาน" /></label><div className="efsw-admin-note-actions"><small>บันทึกหมายเหตุได้โดยไม่เปลี่ยนสถานะสมาชิก</small><button type="button" className="efsw-admin-outline-action" onClick={saveMemberNote} disabled={memberNote === (selectedMember.reviewNote ?? "")}><Check size={15} /> บันทึกหมายเหตุ</button></div><div className="efsw-admin-drawer__actions">{selectedMember.status !== "active" && <button type="button" className="efsw-admin-primary" onClick={() => updateMemberStatus("active")}><UserCheck size={16} /> อนุมัติสมาชิก</button>}{selectedMember.status === "active" && <button type="button" className="efsw-admin-outline-action" onClick={() => updateMemberStatus("suspended")}><Archive size={16} /> ระงับชั่วคราว</button>}{selectedMember.status === "suspended" && <button type="button" className="efsw-admin-primary" onClick={() => updateMemberStatus("active")}><UserCheck size={16} /> เปิดใช้งานอีกครั้ง</button>}<button type="button" className="efsw-admin-danger-action" onClick={() => openDeleteConfirmation("member")}><Trash2 size={16} /> ลบสมาชิก</button></div></section></div>}

      {contentEditor && <div className="efsw-admin-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContentEditor(null); }}><section ref={contentEditorRef} className="efsw-admin-editor" role="dialog" aria-modal={confirmDelete ? undefined : true} aria-hidden={confirmDelete ? true : undefined} aria-labelledby="content-editor-title" tabIndex={-1} data-lenis-prevent><header><div><p className="efsw-admin-eyebrow">Publishing / แก้ไขเนื้อหา</p><h2 id="content-editor-title">{contentEditor.id ? "แก้ไขเนื้อหา" : "สร้างเนื้อหาใหม่"}</h2></div><button type="button" className="efsw-admin-icon-button" onClick={() => setContentEditor(null)} aria-label="ปิดตัวแก้ไข"><X size={18} /></button></header><form onSubmit={saveContentItem}><div className="efsw-admin-form-grid"><label>ประเภท<select value={contentEditor.kind} onChange={(event) => setContentEditor((current) => current ? { ...current, kind: event.target.value as AdminContentKind } : current)}><option value="news">ข่าวประชาสัมพันธ์</option><option value="document">เอกสารวิชาการ</option></select></label><label>สถานะ<select value={contentEditor.status} onChange={(event) => setContentEditor((current) => current ? { ...current, status: event.target.value as AdminContentStatus } : current)}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่แล้ว</option><option value="archived">เก็บถาวร</option></select></label></div><div className="efsw-admin-form-grid"><label>หมวดหมู่<input required value={contentEditor.category} onChange={(event) => setContentEditor((current) => current ? { ...current, category: event.target.value } : current)} /></label><label>ภาษา<select value={contentEditor.locale} onChange={(event) => setContentEditor((current) => current ? { ...current, locale: event.target.value as AdminContentItem["locale"] } : current)}><option value="th">ไทย</option><option value="en">English</option><option value="ko">한국어</option></select></label></div><label>หัวข้อ<input required value={contentEditor.title} onChange={(event) => setContentEditor((current) => current ? { ...current, title: event.target.value } : current)} /></label><label>คำโปรย / สรุป<textarea required rows={3} value={contentEditor.summary} onChange={(event) => setContentEditor((current) => current ? { ...current, summary: event.target.value } : current)} /></label><label>เนื้อหาหลัก<textarea required rows={10} value={contentEditor.body} onChange={(event) => setContentEditor((current) => current ? { ...current, body: event.target.value } : current)} /></label><div className="efsw-admin-editor__footer"><button type="button" className="efsw-admin-outline-action" onClick={() => setContentEditor(null)}>ยกเลิก</button>{contentEditor.id && <button type="button" className="efsw-admin-danger-action" onClick={() => openDeleteConfirmation("content")}><Trash2 size={15} /> ลบ</button>}<button type="submit" className="efsw-admin-primary"><Check size={16} /> บันทึก</button></div></form></section></div>}

      {confirmDelete && <div className="efsw-admin-modal-layer" role="presentation"><section ref={confirmDialogRef} className="efsw-admin-confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" tabIndex={-1}><div className="efsw-admin-confirm__icon"><Trash2 size={19} /></div><h2 id="confirm-title">ยืนยันการลบรายการนี้?</h2><p id="confirm-description">การลบจาก prototype จะนำรายการออกจากเบราว์เซอร์เครื่องนี้ทันที และไม่สามารถกู้คืนจาก dashboard ได้</p><div><button type="button" className="efsw-admin-outline-action" onClick={() => setConfirmDelete(null)} data-initial-focus>ยกเลิก</button><button type="button" className="efsw-admin-danger-action" onClick={confirmDelete === "member" ? removeSelectedMember : removeContentItem}><Trash2 size={15} /> ยืนยันการลบ</button></div></section></div>}

      {toast && <div className="efsw-admin-toast" role="status" aria-live="polite"><CheckCircle2 size={17} /> {toast}</div>}
    </main>
  );
}

function ViewHeading({ id, eyebrow, title, description, action }: { id: string; eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="efsw-admin-view-heading"><div><p className="efsw-admin-eyebrow">{eyebrow}</p><h1 id={id} tabIndex={-1}>{title}</h1><p>{description}</p></div>{action && <div className="efsw-admin-view-heading__action">{action}</div>}</div>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof UsersRound; title: string; body: string }) {
  return <div className="efsw-admin-empty"><Icon size={23} /><h2>{title}</h2><p>{body}</p></div>;
}

function OverviewView({ members, content, activity, pendingCount, activeCount, suspendedCount, publishedCount, draftCount, onView }: { members: AdminMember[]; content: AdminContentItem[]; activity: AdminActivity[]; pendingCount: number; activeCount: number; suspendedCount: number; publishedCount: number; draftCount: number; onView: (view: AdminView) => void }) {
  const latestMembers = members.slice(0, 5);
  const latestActivity = activity.slice(0, 4);
  const memberTotal = Math.max(members.length, 1);
  const bars = [{ label: "ใช้งานอยู่", value: activeCount, tone: "active" }, { label: "รอตรวจสอบ", value: pendingCount, tone: "pending" }, { label: "ระงับชั่วคราว", value: suspendedCount, tone: "suspended" }];
  return <section className="efsw-admin-view" aria-labelledby="overview-title"><ViewHeading id="overview-title" eyebrow="Good morning / สวัสดี" title="ภาพรวม EFSW" description="จุดเริ่มต้นสำหรับดูสุขภาพของเครือข่ายและงานที่ต้องจัดการวันนี้." action={<button type="button" className="efsw-admin-outline-action" onClick={() => onView("activity")}><Activity size={16} /> ดู activity log</button>} /><div className="efsw-admin-stat-grid"><StatCard icon={UsersRound} label="สมาชิกทั้งหมด" value={members.length} note="รายการใน local workspace" tone="green" /><StatCard icon={UserCheck} label="รอตรวจสอบ" value={pendingCount} note="ควรตรวจสอบก่อนอนุมัติ" tone="sun" onClick={() => onView("members")} /><StatCard icon={Newspaper} label="เผยแพร่แล้ว" value={publishedCount} note="ข่าวและเอกสารบนระบบ" tone="ink" onClick={() => onView("content")} /><StatCard icon={FileText} label="ฉบับร่าง" value={draftCount} note="เนื้อหาที่รอการจัดทำ" tone="paper" onClick={() => onView("content")} /></div><div className="efsw-admin-overview-grid"><section className="efsw-admin-panel efsw-admin-health"><div className="efsw-admin-panel__head"><div><p className="efsw-admin-eyebrow">Member health</p><h2>สถานะสมาชิก</h2></div><button type="button" className="efsw-admin-text-action" onClick={() => onView("members")}>ดูทั้งหมด <ArrowUpRight size={15} /></button></div><div className="efsw-admin-bars">{bars.map((bar) => <div key={bar.label} className="efsw-admin-bar-row"><div><span>{bar.label}</span><strong>{bar.value}</strong></div><div className="efsw-admin-bar-track"><span className={`is-${bar.tone}`} style={{ "--bar-size": `${(bar.value / memberTotal) * 100}%` } as React.CSSProperties} /></div></div>)}</div><div className="efsw-admin-panel__note"><BarChart3 size={16} /> ข้อมูลจะอัปเดตเมื่อมีการสมัครสมาชิกหรือทีมงานเปลี่ยนสถานะ</div></section><section className="efsw-admin-panel efsw-admin-quick"><div className="efsw-admin-panel__head"><div><p className="efsw-admin-eyebrow">Quick actions</p><h2>งานที่ใช้บ่อย</h2></div></div><div className="efsw-admin-quick-grid"><button type="button" onClick={() => onView("members")}><UsersRound size={18} /><span>ตรวจสมาชิก</span><small>{pendingCount} รายการรอการตรวจสอบ</small></button><button type="button" onClick={() => onView("content")}><Newspaper size={18} /><span>จัดการข่าว</span><small>{content.filter((item) => item.kind === "news").length} รายการในระบบ</small></button><button type="button" onClick={() => onView("content")}><FileText size={18} /><span>จัดการเอกสาร</span><small>{content.filter((item) => item.kind === "document").length} รายการในระบบ</small></button><button type="button" onClick={() => onView("settings")}><Settings size={18} /><span>ตั้งค่าระบบ</span><small>ข้อมูลองค์กรและการแจ้งเตือน</small></button></div></section></div><div className="efsw-admin-overview-grid efsw-admin-overview-grid--lower"><section className="efsw-admin-panel"><div className="efsw-admin-panel__head"><div><p className="efsw-admin-eyebrow">Latest members</p><h2>สมาชิกใหม่ล่าสุด</h2></div><button type="button" className="efsw-admin-text-action" onClick={() => onView("members")}>จัดการ <ArrowUpRight size={15} /></button></div>{latestMembers.length ? <div className="efsw-admin-mini-list">{latestMembers.map((member) => <button type="button" key={member.id} onClick={() => onView("members")}><span className="efsw-admin-member-avatar"><UserRound size={15} /></span><span><strong>{member.fullName}</strong><small>{typeLabels[member.membershipType]} · {formatDate(member.joinedAt)}</small></span><span className={`efsw-admin-status ${statusTone[member.status]}`}><i />{statusLabels[member.status]}</span></button>)}</div> : <EmptyState icon={UsersRound} title="ยังไม่มีสมาชิก" body="เมื่อมีผู้สมัคร รายชื่อจะปรากฏที่นี่" />}</section><section className="efsw-admin-panel"><div className="efsw-admin-panel__head"><div><p className="efsw-admin-eyebrow">Recent activity</p><h2>กิจกรรมล่าสุด</h2></div><button type="button" className="efsw-admin-text-action" onClick={() => onView("activity")}>ทั้งหมด <ArrowUpRight size={15} /></button></div>{latestActivity.length ? <div className="efsw-admin-activity-mini">{latestActivity.map((entry) => <div key={entry.id}><span className={`efsw-admin-activity-icon is-${entry.tone}`}><Activity size={14} /></span><span><strong>{entry.action}</strong><small>{entry.detail}</small></span><time>{formatTime(entry.at)}</time></div>)}</div> : <EmptyState icon={Activity} title="ยังไม่มี activity" body="การทำงานของผู้ดูแลจะแสดงที่นี่" />}</section></div></section>;
}

function StatCard({ icon: Icon, label, value, note, tone, onClick }: { icon: typeof UsersRound; label: string; value: number; note: string; tone: string; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return <Tag type={onClick ? "button" : undefined} className={`efsw-admin-stat-card is-${tone} ${onClick ? "is-clickable" : ""}`} onClick={onClick}><span className="efsw-admin-stat-card__icon"><Icon size={18} /></span><span className="efsw-admin-stat-card__label">{label}</span><strong>{value}</strong><small>{note}</small>{onClick && <ArrowUpRight className="efsw-admin-stat-card__arrow" size={16} />}</Tag>;
}
