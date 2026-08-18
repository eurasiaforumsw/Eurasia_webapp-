"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ADMIN_DEMO_ACCOUNT, getAdminSession, loginAdmin } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getAdminSession()) window.location.replace("/admin");
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
      window.location.replace("/admin");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setSubmitting(false);
    }
  };

  return (
    <main className="efsw-admin-auth">
      <a href="/" className="efsw-brand" aria-label="EFSW home">
        <span className="efsw-brand__mark">E</span>
        <span>Eurasia Forum<br />for Social Workers</span>
      </a>
      <section className="efsw-admin-auth__card" aria-labelledby="admin-login-title">
        <div className="efsw-admin-auth__icon"><LockKeyhole size={20} /></div>
        <p className="efsw-admin-eyebrow">EFSW operations / ผู้ดูแลระบบ</p>
        <h1 id="admin-login-title">เข้าสู่พื้นที่<br /><span>ผู้ดูแลระบบ</span></h1>
        <p className="efsw-admin-auth__lede">จัดการสมาชิก ข่าวประชาสัมพันธ์ เอกสารวิชาการ และการตั้งค่าของเว็บไซต์จากพื้นที่ทำงานเดียว</p>
        {error && <div className="efsw-admin-error" role="alert">{error}</div>}
        <form onSubmit={submit} className="efsw-admin-login-form">
          <label>อีเมลผู้ดูแล *<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
          <div className="efsw-admin-password">
            <label>รหัสผ่าน *<input id="admin-password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-controls="admin-password" aria-pressed={showPassword} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button type="submit" className="efsw-admin-primary" disabled={submitting}>
            {submitting ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบผู้ดูแล"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <div className="efsw-admin-demo-hint">
          <span>Demo access</span>
          <code>{ADMIN_DEMO_ACCOUNT.email}</code>
          <code>Contact admin for password</code>
        </div>
      </section>
      <a href="/" className="efsw-admin-auth__back"><ArrowLeft size={15} /> กลับหน้าหลัก</a>
      <p className="efsw-admin-prototype-note">Prototype mode: session นี้เก็บไว้ในเบราว์เซอร์เพื่อทดสอบ workflow เท่านั้น</p>
    </main>
  );
}
