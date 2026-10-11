# การเปิดใช้การป้องกันเว็บ EFSW

โค้ดนี้เพิ่มการตรวจสิทธิ์ API และเจ้าของข้อมูล, JWT แบบ HS256 ที่ต้องมีวันหมดอายุ,
การป้องกัน CSRF, CSP ด้วย nonce ต่อคำขอ, การจำกัดคำขอและขนาด body, การตรวจไฟล์
อัปโหลด และการรีเซ็ตรหัสผ่านที่ตรวจ token พร้อมรหัสยืนยันใน transaction เดียวกัน

## ก่อน deploy

1. ใช้ฐานข้อมูล staging ที่มี migrations เดิม แล้วรัน
   `supabase/migrations/022_security_hardening.sql` ใน Supabase SQL Editor
   ก่อน deploy โค้ดใหม่ migration นี้ปิดการเข้าถึงข้อมูลสมาชิกและข้อมูลส่วนตัว
   ด้วย `anon` / `authenticated` key และเพิ่ม RPC สำหรับ rate limit กับ password reset
   ไม่ลบข้อมูลสมาชิก เนื้อหา หรือข้อความ
2. ตั้ง `JWT_SECRET` ใหม่ด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   ห้ามใช้ค่าตัวอย่าง การเปลี่ยน secret จะทำให้ session เดิมต้องล็อกอินใหม่
3. สร้าง `ADMIN_PASSWORD_HASH` ของรหัสผ่านที่คุณเลือกด้วย bcrypt 12 rounds
   เก็บ secret, hash และ `SUPABASE_SERVICE_ROLE_KEY` ไว้ฝั่ง server เท่านั้น
   ห้ามใช้ชื่อ env ที่ขึ้นต้นด้วย `NEXT_PUBLIC_` สำหรับค่าลับ
4. ตั้ง `NEXT_PUBLIC_APP_URL` เป็น URL HTTPS จริงของเว็บ เช่น
   `https://your-domain.example` ซึ่งใช้ตรวจ Origin ของคำขอเขียนข้อมูล
   ตั้ง `RESEND_API_KEY` และ `RESEND_FROM_EMAIL` เพื่อส่งอีเมลกู้รหัสผ่านจริง
5. ตั้ง `SECURITY_RATE_LIMIT_STORE=database` ซึ่งเป็นค่าเริ่มต้นของ production
   หาก RPC หรือฐานข้อมูลไม่พร้อม API จะคืน 503 เพื่อให้การป้องกันยังคงบังคับใช้
6. หากโฮสต์หลัง reverse proxy ให้เปิด `SECURITY_TRUST_PROXY=true` เฉพาะเมื่อ
   proxy เขียนทับ `X-Forwarded-For` และผู้ใช้อินเทอร์เน็ตเข้าถึง origin โดยตรงไม่ได้
   ถ้าไม่มี IP ที่เชื่อถือได้ คำขอจะใช้ bucket ร่วม `unknown-client`
7. รัน `npm run type-check`, `npm run test:security`, `npm run build` และ
   `npm audit --omit=dev` แล้วตรวจ flow ล็อกอิน, แก้โปรไฟล์, บันทึกเนื้อหา,
   อัปโหลดรูป/แกลเลอรี และรีเซ็ตรหัสผ่านบน staging

## พฤติกรรมที่เปลี่ยน

- API ผู้ดูแลตรวจบทบาทด้วย allowlist สมาชิกทั่วไปเรียก API เหล่านี้ไม่ได้
  `super-admin` ใช้สิทธิ์ผู้ดูแลได้ และ Bearer token ใช้ตัวตรวจเดียวกับ cookie
- สมาชิกอ่าน/แก้โปรไฟล์และบุ๊กมาร์กของตนเองได้ ตัวตนมาจาก JWT
  การเปลี่ยน email/status/role ผ่านคำขอแก้โปรไฟล์ของสมาชิกถูกปฏิเสธ
- สมัครสมาชิกใช้ ID ใหม่จาก server เสมอ, role `member`, status `pending`
  ไม่ upsert ตาม ID ที่ผู้ใช้ส่งมา รหัสผ่านไม่ถูก trim และยาวไม่เกิน 72 bytes ตาม bcrypt
- หน้า admin ส่งข้อมูลเนื้อหาผ่าน `/api/content` ที่ตรวจสิทธิ์ก่อนบันทึก
  ไม่เขียนผ่าน Supabase anon key โดยตรง
- คำขอเขียนข้าม Origin ถูกปฏิเสธ รวมถึงล็อกอินและการอัปโหลด
  clients ที่ใช้ cookie ต้องส่ง Origin ที่ถูกต้อง หรือ Fetch Metadata `same-origin`
  clients ที่ใช้ Bearer token และไม่มี cookie สามารถเรียกจาก script ได้
- ล็อกอินจำกัด 5 คำขอต่อบัญชีใน 15 นาที, กลุ่มยืนยันตัวตน 10 คำขอต่อ IP ใน 15 นาที,
  API ทั่วไป 120 คำขอต่อ IP ต่อนาที, แปลภาษา 20 และอัปโหลด 10
  คำตอบ 429 มี `Retry-After` ค่า bucket ในฐานข้อมูลเป็น HMAC เพื่อไม่เก็บ IP/email ตรง ๆ
- JSON body จำกัด 1 MiB, แกลเลอรี 6 MiB รวม multipart, อัปโหลดทั่วไป 201 MiB รวม multipart
  ไฟล์รูปเดี่ยวจำกัด 20 MiB, แกลเลอรี 5 MiB และวิดีโอ 200 MiB
  SVG ไม่รับ รูปต้องตรวจ signature และ decode/re-encode ด้วย sharp
  จำกัดภาพ 20 ล้าน pixels และไม่ fallback ไปเผยแพร่ไฟล์ที่ decode ไม่ผ่าน
- CSP ใช้ nonce เพื่อบล็อก inline script และ event handler ที่ถูกแทรก
  หน้า HTML รวมหน้าข่าว/เอกสารจึง render ต่อคำขอและไม่เก็บ shared cache
  ยอมให้ iframe จากเว็บเดียวกันเพื่อรักษาหน้า preview ของผู้ดูแล
- Endpoint สร้างข้อมูลทดสอบคืน 404 ใน production
- รีเซ็ตรหัสผ่านตรวจ token/code ทุกครั้งรวมขั้นตอนบันทึก ใช้ bcrypt แทน SHA-256
  ล็อกแถวขณะตรวจจำนวนครั้งและเปลี่ยนรหัสผ่าน เพื่อป้องกันการส่งพร้อมกัน/ใช้ซ้ำ

## การทดสอบและขอบเขต

`npm run test:security` ใช้ฐานข้อมูลจำลองและไม่ส่งอีเมลหรือแก้ฐานข้อมูลจริง
ทดสอบการข้ามสิทธิ์, เจ้าของข้อมูล, JWT, CSRF, CSP, ขนาดคำขอ, rate limit และ reset flow
ต้องทดสอบ migration/RPC และ browser flow บน staging เพิ่มก่อนเปิดใช้จริง
มีชุดตรวจ SQL ที่ `scripts/security-database.test.sql` สำหรับรันด้วย `psql`
ในฐานข้อมูล PostgreSQL ชั่วคราวที่ว่างเท่านั้น ชุดนี้ยังไม่ได้รันในสภาพแวดล้อมงานนี้

`SECURITY_RATE_LIMIT_STORE=memory` เหมาะสำหรับพัฒนาในเครื่อง ใช้ counter ต่อ process
ซึ่งหายเมื่อ restart และไม่แชร์ระหว่างหลาย instance ห้ามใช้แทน database store ในระบบที่ scale

การจำกัดคำขอในแอปช่วยลด brute force และ abuse ส่วนการรับมือ DDoS ที่ลิงก์เครือข่าย
ต้องตั้งที่ CDN/WAF/load balancer ด้วย ควรตั้งเพดาน body และ timeout ที่ reverse proxy
ก่อนส่งคำขอเข้าตัวแอป ไฟล์วิดีโอตรวจรูปแบบ container; โค้ดนี้ไม่ได้เป็น antivirus scanner
JWT ที่ออกไปแล้วมีผลจนหมดอายุหรือเปลี่ยน `JWT_SECRET`; การเปลี่ยนรหัสผ่านยังไม่ยกเลิก JWT เดิมทันที

ในสภาพแวดล้อมงานนี้ production build, type-check และชุดทดสอบที่ใช้ mock สามารถรันได้
แต่การเปิดเซิร์ฟเวอร์ทดสอบติดข้อจำกัด sandbox, Docker ไม่ผ่านขั้นตอนอนุมัติอัตโนมัติ
เพราะบริการตรวจอนุมัติขัดข้อง และ npm audit เข้าถึง registry ไม่ได้
จึงยังไม่ได้ apply หรือยืนยัน SQL กับ PostgreSQL จริง และยังไม่ได้ตรวจ dependency advisories ล่าสุด
