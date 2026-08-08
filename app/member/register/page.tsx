"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerMember, MembershipType } from "@/lib/member-auth";

const baseFields = {
  fullName: "",
  email: "",
  country: "",
  password: "",
  confirmPassword: "",
  membershipType: "professional" as MembershipType,
  organization: "",
  position: "",
  expertise: "",
  university: "",
  faculty: "",
  degree: "bachelor",
  organizationType: "ngo",
  contactPosition: "",
};

export default function MemberRegisterPage() {
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(baseFields);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const update = (name: keyof typeof baseFields, value: string) => setFields((current) => ({ ...current, [name]: value }));

  const continueToDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!fields.fullName.trim() || !fields.email.trim() || !fields.country.trim()) return setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
    if (fields.password.length < 8) return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (fields.password !== fields.confirmPassword) return setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
    setStep(2);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerMember({
        fullName: fields.fullName,
        email: fields.email,
        country: fields.country,
        password: fields.password,
        membershipType: fields.membershipType,
        organization: fields.organization,
        position: fields.position,
        expertise: fields.expertise,
        university: fields.university,
        faculty: fields.faculty,
        degree: fields.degree,
        organizationType: fields.organizationType,
        contactPosition: fields.contactPosition,
        bio: "",
      });
      setComplete(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="efsw-auth-page">
      <a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a>
      <section className="efsw-auth-card efsw-register-card" aria-labelledby="register-title">
        {complete ? (
          <div className="efsw-auth-success">
            <div className="efsw-auth-card__icon"><Check size={21} /></div>
            <p className="efsw-section-label">Application received / ส่งข้อมูลแล้ว</p>
            <h1>ยินดีต้อนรับ<br /><span>สู่เครือข่าย EFSW</span></h1>
            <p>โปรไฟล์ของคุณถูกสร้างในเครื่องนี้แล้ว สถานะปัจจุบันคือรอการตรวจสอบจากทีมงาน</p>
            <div className="efsw-auth-card__actions"><a href="/member/profile" className="efsw-button efsw-button--dark">ดูโปรไฟล์ <ArrowUpRight size={17} /></a><a href="/" className="efsw-text-link"><ArrowLeft size={16} /> กลับหน้าหลัก</a></div>
          </div>
        ) : (
          <>
            <div className="efsw-auth-card__icon"><UserPlus size={21} /></div>
            <p className="efsw-section-label">Join the network / สมัครสมาชิก</p>
            <h1 id="register-title">เข้าร่วม<br /><span>เครือข่าย EFSW</span></h1>
            <p>สร้างโปรไฟล์สมาชิกเพื่อเชื่อมต่อกับผู้ทำงานด้านสังคมสงเคราะห์ทั่วภูมิภาค</p>
            <div className="efsw-form-steps" aria-label={`ขั้นตอนที่ ${step} จาก 2`}><span className="is-active">01 ข้อมูลบัญชี</span><i /><span className={step === 2 ? "is-active" : ""}>02 ข้อมูลวิชาชีพ</span></div>
            {error && <div className="efsw-form-error" role="alert">{error}</div>}
            {step === 1 ? (
              <form onSubmit={continueToDetails} className="efsw-member-form">
                <div className="efsw-form-grid"><label>ชื่อ–นามสกุล *<input required value={fields.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" /></label><label>ประเทศที่พำนัก *<input required value={fields.country} onChange={(event) => update("country", event.target.value)} autoComplete="country-name" /></label></div>
                <label>อีเมล *<input required type="email" value={fields.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" /></label>
                <div className="efsw-password-field"><label>รหัสผ่าน *<input required type={showPassword ? "text" : "password"} value={fields.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" /></label><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                <div className="efsw-password-field"><label>ยืนยันรหัสผ่าน *<input required type={showConfirm ? "text" : "password"} value={fields.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" /></label><button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "ซ่อนการยืนยันรหัสผ่าน" : "แสดงการยืนยันรหัสผ่าน"}>{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                <button type="submit" className="efsw-button efsw-button--dark">ถัดไป <ArrowUpRight size={17} /></button>
              </form>
            ) : (
              <form onSubmit={submit} className="efsw-member-form">
                <fieldset><legend>ประเภทสมาชิก *</legend><div className="efsw-membership-options">{[["professional", "Professional", "นักสังคมสงเคราะห์ นักวิชาการ และผู้ปฏิบัติงาน"], ["student", "Student", "นักศึกษาสาขาสังคมสงเคราะห์หรือสาขาที่เกี่ยวข้อง"], ["institutional", "Institutional", "มหาวิทยาลัย NGO หน่วยงานรัฐ และองค์กรพันธมิตร"]].map(([value, title, description]) => <label key={value} className={fields.membershipType === value ? "is-selected" : ""}><input type="radio" name="membershipType" value={value} checked={fields.membershipType === value} onChange={(event) => update("membershipType", event.target.value)} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div></fieldset>
                {fields.membershipType === "professional" && <div className="efsw-form-grid"><label>องค์กร / หน่วยงาน<input value={fields.organization} onChange={(event) => update("organization", event.target.value)} /></label><label>ตำแหน่ง<input value={fields.position} onChange={(event) => update("position", event.target.value)} /></label></div>}
                {fields.membershipType === "professional" && <label>ความเชี่ยวชาญ<input value={fields.expertise} onChange={(event) => update("expertise", event.target.value)} placeholder="เช่น เด็กและครอบครัว การแพทย์ ผู้สูงอายุ" /></label>}
                {fields.membershipType === "student" && <div className="efsw-form-grid"><label>มหาวิทยาลัย / สถาบัน<input value={fields.university} onChange={(event) => update("university", event.target.value)} /></label><label>คณะ / สาขา<input value={fields.faculty} onChange={(event) => update("faculty", event.target.value)} /></label></div>}
                {fields.membershipType === "student" && <label>ระดับการศึกษา<select value={fields.degree} onChange={(event) => update("degree", event.target.value)}><option value="bachelor">ปริญญาตรี</option><option value="master">ปริญญาโท</option><option value="doctorate">ปริญญาเอก</option></select></label>}
                {fields.membershipType === "institutional" && <div className="efsw-form-grid"><label>ชื่อองค์กร<input value={fields.organization} onChange={(event) => update("organization", event.target.value)} /></label><label>ประเภทองค์กร<select value={fields.organizationType} onChange={(event) => update("organizationType", event.target.value)}><option value="ngo">NGO</option><option value="university">มหาวิทยาลัย</option><option value="government">หน่วยงานรัฐ</option><option value="social-enterprise">กิจการเพื่อสังคม</option></select></label></div>}
                {fields.membershipType === "institutional" && <label>ตำแหน่งผู้ติดต่อ<input value={fields.contactPosition} onChange={(event) => update("contactPosition", event.target.value)} /></label>}
                <div className="efsw-auth-card__actions"><button type="button" className="efsw-text-link" onClick={() => setStep(1)}><ArrowLeft size={16} /> ย้อนกลับ</button><button type="submit" className="efsw-button efsw-button--dark" disabled={submitting}>{submitting ? "กำลังส่งข้อมูล…" : "สร้างโปรไฟล์สมาชิก"} <ArrowUpRight size={17} /></button></div>
              </form>
            )}
            <div className="efsw-auth-card__footer">เป็นสมาชิกแล้ว? <a href="/member/login">เข้าสู่ระบบ <ArrowUpRight size={15} /></a></div>
          </>
        )}
      </section>
      <p className="efsw-auth-prototype-note">Prototype mode: ข้อมูลสมาชิกถูกเก็บไว้ในเบราว์เซอร์นี้เพื่อทดสอบ flow เท่านั้น</p>
    </main>
  );
}
