"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Check, LogOut, Save, UserRound } from "lucide-react";
import { getSessionMember, logoutMember, MemberProfile, updateMember } from "@/lib/member-auth";

const typeLabels = { professional: "Professional member", student: "Student member", institutional: "Institutional member" };
const statusLabels: Record<MemberProfile["status"], string> = { pending: "รอตรวจสอบ", active: "สมาชิกใช้งานอยู่", suspended: "ระงับการใช้งานชั่วคราว" };

export default function MemberProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [draft, setDraft] = useState({ fullName: "", country: "", organization: "", position: "", expertise: "", university: "", faculty: "", contactPosition: "", bio: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const current = getSessionMember();
    if (!current) { window.location.href = "/member/login"; return; }
    setMember(current);
    setDraft({ fullName: current.fullName, country: current.country, organization: current.organization, position: current.position, expertise: current.expertise, university: current.university, faculty: current.faculty, contactPosition: current.contactPosition, bio: current.bio });
  }, []);

  const update = (field: keyof typeof draft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const updated = updateMember(draft); setMember(updated); setStatus("บันทึกโปรไฟล์แล้ว"); window.setTimeout(() => setStatus(""), 3000); };
  const logout = () => { logoutMember(); window.location.href = "/member/login"; };

  if (!member) return <main className="efsw-profile-page"><p>กำลังโหลดโปรไฟล์…</p></main>;

  return <main className="efsw-profile-page"><header className="efsw-profile-header"><a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a><nav><a href="/">หน้าหลัก</a><a href="/academic-documents">เอกสารวิชาการ</a><button type="button" onClick={logout}><LogOut size={15} /> ออกจากระบบ</button></nav></header><div className="efsw-profile-layout"><aside className="efsw-profile-sidebar"><div className="efsw-profile-avatar"><UserRound size={31} /></div><h1>{member.fullName}</h1><p>{typeLabels[member.membershipType]}</p><span className={`efsw-status-chip is-${member.status}`}><i /> {statusLabels[member.status]}</span><div className="efsw-profile-side-meta"><span>Member ID</span><strong>{member.id}</strong><span>เข้าร่วมเมื่อ</span><strong>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(member.joinedAt))}</strong></div></aside><section className="efsw-profile-main"><div className="efsw-profile-title"><div><p className="efsw-section-label">Member profile / โปรไฟล์สมาชิก</p><h2>ข้อมูลของคุณ</h2></div>{status && <div className="efsw-profile-saved" role="status"><Check size={15} /> {status}</div>}</div><form onSubmit={submit} className="efsw-profile-form"><fieldset><legend>ข้อมูลพื้นฐาน</legend><div className="efsw-form-grid"><label>ชื่อ–นามสกุล<input required value={draft.fullName} onChange={(event) => update("fullName", event.target.value)} /></label><label>ประเทศที่พำนัก<input required value={draft.country} onChange={(event) => update("country", event.target.value)} /></label></div><label>อีเมลสมาชิก<input value={member.email} readOnly aria-describedby="email-note" /></label><small id="email-note">อีเมลใช้สำหรับเข้าสู่ระบบ หากต้องการเปลี่ยนโปรดติดต่อทีมงาน</small></fieldset><fieldset><legend>ข้อมูลวิชาชีพ</legend>{member.membershipType === "professional" && <><div className="efsw-form-grid"><label>องค์กร / หน่วยงาน<input value={draft.organization} onChange={(event) => update("organization", event.target.value)} /></label><label>ตำแหน่ง<input value={draft.position} onChange={(event) => update("position", event.target.value)} /></label></div><label>ความเชี่ยวชาญ<input value={draft.expertise} onChange={(event) => update("expertise", event.target.value)} /></label></>}{member.membershipType === "student" && <div className="efsw-form-grid"><label>มหาวิทยาลัย / สถาบัน<input value={draft.university} onChange={(event) => update("university", event.target.value)} /></label><label>คณะ / สาขา<input value={draft.faculty} onChange={(event) => update("faculty", event.target.value)} /></label></div>}{member.membershipType === "institutional" && <><label>ชื่อองค์กร<input value={draft.organization} onChange={(event) => update("organization", event.target.value)} /></label><label>ตำแหน่งผู้ติดต่อ<input value={draft.contactPosition} onChange={(event) => update("contactPosition", event.target.value)} /></label></>}</fieldset><fieldset><legend>แนะนำตัว</legend><label>Bio / เกี่ยวกับคุณ<textarea rows={5} value={draft.bio} onChange={(event) => update("bio", event.target.value)} placeholder="เล่าเกี่ยวกับงานหรือความสนใจของคุณ" /></label></fieldset><button className="efsw-button efsw-button--dark" type="submit"><Save size={17} /> บันทึกโปรไฟล์ <ArrowUpRight size={17} /></button></form></section></div></main>;
}
