"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Eye, EyeOff, LogIn } from "lucide-react";
import { getSessionMember, loginMember } from "@/lib/member-auth";

export default function MemberLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => { setLoggedIn(Boolean(getSessionMember())); }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginMember(email, password);
      window.location.href = "/member/profile";
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setSubmitting(false);
    }
  };

  return (
    <main className="efsw-auth-page">
      <a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a>
      <section className="efsw-auth-card" aria-labelledby="login-title">
        {loggedIn ? <div className="efsw-auth-success"><div className="efsw-auth-card__icon"><CheckCircle2 size={21} /></div><p className="efsw-section-label">Member session / สมาชิก</p><h1>คุณเข้าสู่ระบบ<br /><span>เรียบร้อยแล้ว</span></h1><p>มี session สมาชิกที่ใช้งานอยู่ในเบราว์เซอร์นี้</p><a href="/member/profile" className="efsw-button efsw-button--dark">ไปที่โปรไฟล์ <ArrowUpRight size={17} /></a></div> : <><div className="efsw-auth-card__icon"><LogIn size={21} /></div><p className="efsw-section-label">Member access / สมาชิก</p><h1 id="login-title">เข้าสู่ระบบ<br /><span>สมาชิก EFSW</span></h1><p>เข้าสู่พื้นที่สมาชิกเพื่อจัดการโปรไฟล์และข้อมูลเครือข่าย</p>{error && <div className="efsw-form-error" role="alert">{error}</div>}<form onSubmit={submit} className="efsw-member-form"><label>อีเมล *<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><div className="efsw-password-field"><label>รหัสผ่าน *<input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><button type="submit" className="efsw-button efsw-button--dark" disabled={submitting}>{submitting ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"} <ArrowUpRight size={17} /></button></form><div className="efsw-auth-card__footer">ยังไม่มีบัญชี? <a href="/member/register">สมัครสมาชิก <ArrowUpRight size={15} /></a></div></>}
      </section>
      <a href="/" className="efsw-auth-back"><ArrowLeft size={15} /> กลับหน้าหลัก</a>
      <p className="efsw-auth-prototype-note">Prototype mode: ระบบนี้ใช้ local session สำหรับทดสอบ flow ก่อนเชื่อมต่อ auth backend</p>
    </main>
  );
}
