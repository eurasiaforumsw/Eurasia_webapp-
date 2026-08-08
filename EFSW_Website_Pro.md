# EFSW Website Development Specification (Pro Edition)
### Current Prototype and Production Blueprint for Eurasia Forum for Social Workers

---

## Executive Summary

This document records both the browser-functional prototype currently in this repository and the remaining production blueprint for the **Eurasia Forum for Social Workers (EFSW)** website. It is the reference for public content, membership workflows, administrator operations, and the transition from local prototype data to a secure shared backend.

**Project Objective:** Deliver a trilingual (English, Korean, Thai) membership platform with secure authentication, administrator approval workflows, privacy controls, and a resource hub for social work professionals, students, and institutions.

**Current Implementation Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS and custom CSS tokens, Lenis, Framer Motion, GSAP, Three.js, React Three Fiber, and Lucide icons. The current member, administrator, content, activity, and settings data is stored in browser `localStorage` for prototype testing.

**Production Target:** Replace browser-only storage and authentication with a persistent database, server-side sessions, role-based authorization, media storage, email delivery, audit retention, and privacy controls. WordPress with WPGraphQL remains one possible backend option, but it is not connected to the current application.

**Design Direction:** A modern dark-mode-first experience with scroll-led storytelling, fluid typography, systematic spacing, and sophisticated animations. Six tonal surface levels create depth without harsh contrast, while luminous teal and emerald accents reinforce trust, care, and empowerment. Every interaction should support EFSW's mission: Connect · Empower · Advocate.

> **📐 Design System:** See [DESIGN.md](./DESIGN.md) for complete visual language, component architecture, animation specifications, and technical implementation details.
> 
> **Design System Version:** 2.0.0 (2026-08-08)  
> **Key Features:**
> - Dark-first color palette: 6 surface levels, 4 accent colors, semantic states
> - Fluid typography: 11 scales supporting EN/TH/KR with clamp()
> - Systematic spacing: 9 fluid steps (3xs to 3xl)
> - 19 component specifications with accessibility guidelines
> - 14 animation patterns (Framer Motion + GSAP)
> - WCAG AA compliant, keyboard navigable, reduced-motion support

---

## 0. Current Implementation Snapshot

**Snapshot date:** August 8, 2026  
**Prototype status:** Browser-functional, production build verified  
**Local URL:** `http://localhost:2024`

### 0.1 Implemented Routes

| Route | Current capability |
|---|---|
| `/` | Homepage with navigation, international social-work hero, scroll narrative, featured voices, about bridge, news preview, and footer |
| `/about` | About EFSW |
| `/about/organization` | Organization structure |
| `/news` | Public feed of administrator-published news |
| `/academic-documents` | Public feed of administrator-published academic documents |
| `/member/register` | Registration for professional, student, and institutional members |
| `/member/login` | Prototype member authentication |
| `/member/profile` | Protected member profile with editable account details and visible review status |
| `/admin/login` | Prototype administrator authentication |
| `/admin` | Protected operations workspace for members, content, activity, and settings |

### 0.2 Member Workflow

- Conditional registration fields for Professional, Student, and Institutional membership types
- Browser-side password hashing and local session persistence for prototype use
- Protected member profile, editable details, logout, and pending/active/suspended status display
- New member records become available to the administrator workspace in the same browser
- Administrator approval or suspension updates the corresponding local member profile

### 0.3 Administrator Workspace

- Responsive dashboard overview with member and publishing status summaries
- Member search and status filters; review drawer; internal notes; approve, suspend, reactivate, delete, and CSV export actions
- News and academic-document editor with draft, published, and archived states
- Published content reflected on `/news` and `/academic-documents`, including cross-tab storage updates
- Activity log for administrator actions and persisted organization/notification settings
- Keyboard-operable member rows, focus trapping, Escape dismissal, focus restoration, scroll lock, responsive mobile navigation, empty states, and accessible status announcements

**Prototype administrator account**

```text
Email: admin@efsw.local
Password: EFSW-demo-admin
```

### 0.4 Verification Completed

- `npm run type-check` passes
- `npm run build` generates all current routes successfully
- `git diff --check` passes for the implementation
- Responsive administrator records collapse to stacked layouts without nested horizontal table scrolling

### 0.5 Prototype Boundary

The current system is intentionally client-only. `localStorage` data is limited to one browser profile, does not synchronize across devices, and is not a secure source of identity or authorization. Demo credentials are public, password hashing occurs in the browser, and no server validates administrator privileges. This implementation must not be used for real member data until the production backend and security controls in Sections 3 and 9 are complete.

---

## 1. Strategic Foundation

### 1.1 About the Eurasia Forum for Social Workers (EFSW)

The Eurasia Forum for Social Workers (EFSW) serves as a premier international platform dedicated to bridging communities, advancing knowledge, and empowering social work professionals across the Eurasian region and beyond. Established to address complex social challenges and promote human well-being, EFSW acts as a central hub for professional collaboration, cross-border public relations, and the dissemination of impactful research and social development initiatives.

### 1.2 Vision

To be the leading global network that elevates the standards of social work practice and fosters sustainable social change through international solidarity and shared expertise.

### 1.3 Mission

**Connect:** To build a robust and secure community for social workers, policymakers, and academics across nations to exchange insights and best practices.

**Empower:** To strengthen the capacity and professional recognition of social workers through specialized training, resources, and collaborative projects.

**Advocate:** To champion social justice, human rights, and the welfare of vulnerable groups in Eurasia by amplifying the impact of local and regional social work outcomes on the global stage.

### 1.4 Why Join EFSW

**Driving Global Impact Together**

At EFSW, we believe that social change has no borders. Through our trilingual platform (English, Korean, and Thai), we break communication barriers, ensuring that essential tools, international research, and professional networking opportunities are accessible to everyone, anywhere. Together, we are shaping the future of global social development.

---

## 2. Membership Framework

### 2.1 Membership Categories

EFSW offers three distinct membership tiers designed to serve professionals, students, and institutions at different stages of their social work journey.

#### 2.1.1 Professional Member (Individual)

**Suitable for:** Certified social workers, practitioners, researchers, and academic educators.

**Benefits:**

- **Global Networking:** Connect directly with social work professionals across Eurasia through our secure member directory.
- **Exclusive Resources:** Full access to premium research papers, case studies, and international practice manuals.
- **Professional Development:** Priority registration and special discounts for EFSW international forums, conferences, and webinars.
- **Contribution:** Opportunity to publish your social work research and project outcomes on our global platform.

#### 2.1.2 Student Member

**Suitable for:** Undergraduate and postgraduate students majoring in Social Work or related social science fields.

**Benefits:**

- **Mentorship Opportunities:** Connect with senior international experts and practitioners for career guidance.
- **Knowledge Hub:** Access to our digital resource library for academic research and global field studies.
- **Career Advancement:** Access to international internship notifications, volunteer programs, and job boards.
- **Reduced Rates:** Special student discounts for all EFSW training programs and annual forums.

#### 2.1.3 Institutional Member (Organizations & Partners)

**Suitable for:** Universities, NGOs, government agencies, and social enterprises.

**Benefits:**

- **Strategic Alliances:** Build cross-border partnerships for joint research projects and social development initiatives.
- **Organizational Visibility:** Feature your organization's profile, logo, and active missions on our dedicated Partners page.
- **Talent & Promotion:** Post job openings, training courses, and press releases directly to our international community.
- **Group Access:** Complimentary passes to the annual EFSW forum for up to 3 representatives from your organization.

### 2.2 Registration and Review Process

#### Step 1: Complete the Online Form
Open `/member/register`, select a membership type, and complete the relevant professional, student, or institutional fields.

#### Step 2: Administrator Verification
The application enters the `pending` state and appears under `/admin` in the same browser. An administrator can record an internal review note and approve, suspend, reactivate, or delete the application.

#### Step 3: Member Status and Profile
The member can sign in at `/member/login`, edit profile information at `/member/profile`, and see the current review status. Automated acknowledgement and approval emails remain a production task described in Section 4.

---

## 3. Technical Architecture

### 3.1 Core System Features

#### 3.1.1 Modern Design System (New - Implemented 2026-08-08)

**Color System:**
- **Dark-first palette:** 6 surface levels (3% to 20% lightness) tinted toward cyan-blue (210°)
- **Surface tokens:** `--surface-deepest`, `--surface-deep`, `--surface-mid`, `--surface-raised`, `--surface-elevated`, `--surface-highest`
- **Accent colors:** Teal (#2DD4BF) for trust/connection, Emerald (#34D399) for growth/empowerment, Amber (#FBBF24) for advocacy
- **Semantic colors:** Success, warning, danger, info with vibrant and subtle variants
- **OKLCH color space:** Perceptual uniformity, better than RGB/HSL for consistent lightness

**Typography System:**
- **Primary typeface:** Inter with Noto Sans Thai and Noto Sans KR fallbacks for trilingual support
- **11 fluid scales:** Display, h1-h6, body-lg, body, body-sm, caption
- **All sizes use clamp():** Smooth scaling from mobile to desktop without breakpoint overrides
- **Display tracking:** Tight negative tracking (-0.03em to -0.015em) for visual impact
- **Body line-height:** Generous 1.6-1.7 for extended reading in all three scripts

**Spacing System:**
- **9 fluid steps:** 3xs (4-6px) to 3xl (96-192px) using clamp()
- **Systematic progression:** Clear pattern for consistent rhythm
- **Layout tokens:** Container max-width (80rem), fluid gutter, standardized breakpoints
- **Border radius tokens:** sm to 2xl, plus full (999px) for pills and circle (50%) for avatars

**Animation System:**
- **6 easing curves:** smooth-out, expo-out, spring, in-out, expo-in-out, bounce
- **5 duration tokens:** instant, fast (200ms), base (300ms), slow (500ms), slower (800ms)
- **6 page transitions:** fade, modal-open, drawer-slide, crossfade, toast, accordion
- **7 scroll animations:** fade-in-up, stagger, parallax (slow/fast), scale-in, reveal-left, counter-up
- **8 micro-interactions:** button-ripple, card-hover-lift, link-underline, icon-bounce, input-focus, loading-pulse, toggle-switch, magnetic-hover
- **Reduced-motion support:** Respects user preferences, instant animations when requested

**Component Library:**
- **Buttons:** Primary, secondary, ghost, icon variants with all states (hover, focus, active, disabled)
- **Cards:** News, project, profile with responsive padding and hover effects
- **Forms:** Input, select, textarea, checkbox, radio with error states and accessibility
- **Navigation:** Desktop nav with backdrop blur, mobile nav with drawer, dropdown menus
- **Badges & Status:** Solid, outlined, dot variants with semantic colors
- **Modals & Sheets:** Focus trap, ESC dismiss, backdrop, proper ARIA

**Accessibility:**
- **WCAG AA compliant:** 4.5:1 contrast for body text, 3:1 for large text and interactive elements
- **Focus indicators:** Visible 2px outline on all focusable elements
- **Touch targets:** Minimum 44×44px for all interactive elements
- **Semantic HTML:** Proper heading hierarchy, nav/main/article/section elements
- **ARIA labels:** Icon buttons, current page, form errors, live regions
- **Keyboard navigation:** All interactive elements accessible, modal focus trap, arrow key menus

#### 3.1.2 Multi-Language Content System
- Current content model supports Thai, English, and Korean locale values for administrator-managed content
- Current public routes use a shared URL structure and mixed Thai/English interface copy
- Separate locale paths, translated route metadata, and a production language switcher remain pending
- `next-intl` is installed for the planned locale architecture

#### 3.1.3 Resource and Publications Hub
- Implemented public feeds for published news and academic-document summaries
- Implemented administrator categories, locale, status, summary, and update timestamp fields
- Public feeds update from shared browser storage and handle intentionally empty datasets
- File upload, PDF viewing, advanced filters, download tracking, and persistent media storage remain pending

#### 3.1.4 Membership Portal
- Implemented three-tier membership registration: Professional, Student, and Institutional
- Implemented prototype member and administrator route protection
- Implemented local administrator review and member status workflow
- Production RBAC, shared member directory, account recovery, and downloadable certificates remain pending

#### 3.1.5 Privacy and Compliance
- Prototype supports local deletion of member and content records
- GDPR/CCPA consent management, translated policy pages, retention rules, export requests, and server-side deletion workflows remain pending
- TLS, secure cookies, server-side authorization, rate limiting, and audit retention must be verified in the production environment

### 3.2 Frontend Technology Stack (Current Implementation)

**Core Framework:**
- **Next.js 14 App Router:** File-based routing, server components, streaming
- **React 18:** Concurrent features, automatic batching, transitions
- **TypeScript:** Type safety, improved developer experience

**Styling:**
- **Tailwind CSS:** Utility-first CSS framework
- **Custom CSS tokens:** OKLCH colors, fluid clamp() sizing, CSS custom properties
- **Dark mode:** Default dark theme with surface levels

**Animation Libraries:**
- **Framer Motion:** React animation library for page transitions, scroll animations, micro-interactions
- **GSAP + ScrollTrigger:** Advanced scroll-based animations, parallax, counter animations
- **Lenis:** Smooth scroll library for enhanced scrolling experience

**3D & Visual Effects:**
- **Three.js + React Three Fiber:** 3D graphics and WebGL rendering (if used in hero sections)

**Icons:**
- **Lucide Icons:** Modern, consistent icon set

**State Management:**
- **localStorage:** Prototype-only (browser storage for demo)
- **Production requires:** Server-side sessions, database persistence

### 3.3 Production Backend Requirements

The current repository is client-only. For production deployment, the following backend infrastructure is required:

#### 3.3.1 Database Layer
- **PostgreSQL** or **MySQL:** Relational database for structured data (members, content, settings)
- **Prisma ORM:** Type-safe database client for Next.js
- **Supabase** (alternative): PostgreSQL + Auth + Storage in one platform

**Schema Requirements:**
- Members table: id, email, password_hash, type, status, profile_fields, created_at, updated_at
- Content table: id, type (news/document), title_en, title_th, title_kr, body, locale, status, author_id, published_at
- Activity log: id, admin_id, action, target_type, target_id, metadata, timestamp
- Settings: organization profile, notification preferences, system configuration

#### 3.3.2 Authentication & Authorization
- **NextAuth.js:** Authentication for Next.js (supports credentials, OAuth, magic links)
- **JWT or session-based auth:** Secure token management
- **RBAC (Role-Based Access Control):** Admin, member, guest roles
- **Password hashing:** bcrypt or Argon2
- **Email verification:** Token-based account activation
- **Password recovery:** Secure reset flow

#### 3.3.3 File Storage
- **AWS S3** or **Cloudflare R2:** Scalable object storage for PDFs, images, documents
- **Supabase Storage** (alternative): Built-in file storage with public/private buckets
- **CDN:** CloudFront or Cloudflare for fast global delivery

#### 3.3.4 Email Service
- **Resend** (recommended): Modern email API for transactional emails
- **SendGrid** or **AWS SES** (alternatives): Established providers
- **Email templates:** Registration confirmation, admin approval, password reset, status updates

#### 3.3.5 API Layer
- **Next.js API Routes:** Server-side API endpoints (`/app/api/`)
- **tRPC** (optional): End-to-end typesafe APIs
- **REST or GraphQL:** Choose based on frontend requirements

#### 3.3.6 Deployment Platform
- **Vercel** (recommended): Zero-config Next.js hosting, edge functions, preview deployments
- **AWS (EC2 + RDS + S3):** Full control, suitable for enterprise
- **Railway** or **Render** (alternatives): Simplified deployment with database support

### 3.4 Optional WordPress Backend Plan (Production Only)

The current repository does not include WordPress, WPGraphQL, or the plugins below. This section is retained as one possible production backend approach. The team must compare it with a native Next.js API and database architecture before implementation; do not combine both approaches without a clear ownership and data-migration plan.

#### 3.2.1 Ultimate Member (Community Management)
- Custom registration forms with conditional fields
- User profile management
- Member directory with search/filter
- "Require Admin Review" setting enabled
- Custom user roles and capabilities

**Admin Configuration:**
- Navigate to: Ultimate Member → Settings → User Profiles
- Enable "Require Admin Review" checkbox
- Configure approval email templates

#### 3.2.2 Paid Memberships Pro (Membership Tiers)
- Tiered membership structure (Professional, Student, Institutional)
- Membership-specific content restrictions
- Integration with payment gateways (if needed in future)
- Custom membership levels with approval workflow

**Admin Configuration:**
- Add membership tiers via: Add-ons → Approval Process for Membership
- Link approval settings to admin notification system

#### 3.2.3 Theme My Login (Enhanced Login Experience)
- Custom login/registration pages with brand consistency
- Password reset and account recovery
- No direct admin panel access for non-admin users
- Redirects to member portal after login

**Admin Configuration:**
- Enable "Admin Approval" checkbox in settings
- Customize login redirect URLs

### 3.3 Registration Form Field Structure

#### Common Fields (All Membership Types)

- **First Name / Last Name:** Required text fields (displayed in member directory)
- **Email Address:** Username for login; must be unique
- **Country of Residence:** Dropdown menu (standardized country list)
- **Password / Confirm Password:** Minimum 8 characters with complexity requirements

#### Professional Member Specific Fields

- **Organization / Employer:** Current workplace or affiliated institution
- **Job Title / Position:** Professional role (e.g., Social Worker, Lecturer, Researcher)
- **Professional License Number (Optional):** Certification ID for registered practitioners
- **Area of Expertise:** Multi-select checkboxes (e.g., Child and Family Welfare, Medical Social Work, Elderly Care)

#### Student Member Specific Fields

- **University / Institution:** Name of educational institution
- **Faculty / Major:** Field of study (e.g., Faculty of Social Administration)
- **Degree Level:** Dropdown (Bachelor's, Master's, Doctorate)
- **Expected Graduation Year:** Year picker

#### Institutional Member Specific Fields

- **Organization Name:** Full legal name of entity
- **Organization Type:** Dropdown (NGO, University, Government, Social Enterprise)
- **Official Website / Social Media Link:** URL validator
- **Contact Person Name:** Primary point of contact
- **Contact Person Position:** Role within organization

---

## 4. Automated Email System (Production Target)

**Current status:** Not implemented. The prototype changes status locally and does not send acknowledgement, approval, suspension, rejection, or recovery email.

### 4.1 Email Sequence Overview

EFSW implements a 2-email automated sequence triggered upon user registration:

#### Email 1: Application Received (Automated Acknowledgment)

**Subject:** [EFSW] We have received your membership application!

**Body:**

```
Dear [Member Name],

Thank you for your interest in joining the Eurasia Forum for Social Workers (EFSW). We have successfully received your membership application for the [Membership Category] tier.

To maintain the integrity and security of our professional network, our team is currently reviewing your professional details. This verification process typically takes 2-3 business days.

Once your account is verified and approved, you will receive a follow-up email with your login credentials and instructions on how to access our member-exclusive platform.

If you have any immediate questions, please feel free to reply to this email or contact our support team at support@eurasiaforumsw.org.

Warm regards,
The EFSW Administration Team
Connecting Social Workers Across Eurasia
```

#### Email 2: Account Activated (Post-Admin Approval)

**Subject:** Welcome to EFSW! Your membership account is now active

**Body:**

```
Dear [Member Name],

We are thrilled to inform you that your membership application has been approved! Welcome to the Eurasia Forum for Social Workers (EFSW) community.

Your account is now active, and you can unlock your full membership benefits, including access to our global directory, international resource center, and exclusive event registrations.

Your Account Details:
• Username / Email: [User Email]
• Membership Type: [Membership Category]

You can log in to your member portal anytime by clicking the link below:
[ Link: Access Member Portal ]

Note: If you have not set up your password yet, please click [ Link: Set Your Password ] to complete your profile setup.

Thank you for being a vital part of our global social work network. We look forward to your valuable contributions.

Best regards,
The EFSW Administration Team
www.eurasiaforumsw.org
```

### 4.2 WordPress Plugin Configuration

**Recommended Plugins:**
1. **WP Mail SMTP** or **Mailgun** or **SendGrid** for reliable email delivery
2. **AutomateWoo** or **Uncanny Automator** for workflow automation

**Setup Steps:**
- Configure SMTP settings in WordPress
- Create automated workflow: Registration Trigger → Delay (admin review) → Conditional approval email
- Test both email sequences in staging environment before production deployment

---

## 5. GDPR & Privacy Compliance (Production Target)

**Current status:** Policy and consent implementation is pending. The text below is planning material and requires legal review before publication.

### 5.1 Cookie Consent Banner

EFSW implements a dual-plugin cookie management system to ensure full compliance with international data protection regulations.

#### Plugin 1: Real Cookie Banner (Recommended)

**Features:**
- Scanner mode: Detects all cookies and third-party scripts automatically (Google Maps, YouTube, analytics)
- Granular consent options: Users can accept/reject individual cookie categories
- GDPR/ePrivacy compliant with automatic documentation

**Configuration:**
- Install Real Cookie Banner plugin
- Run automatic cookie scan
- Configure cookie categories: Strictly Necessary, Functional, Analytics
- Customize banner text in all three languages

#### Plugin 2: Cookie Yes / GDPR Cookie Consent

**Features:**
- WordPress native integration (1 plugin installation)
- Pre-built compliance templates for EU and international markets
- Cookie category management: Necessary, Functional, Analytics
- Customizable button text and color schemes

**Configuration:**
- Enable "GDPR" and "CCPA" compliance modes
- Link to Privacy Policy and Cookie Policy pages
- Set default consent state (opt-in vs. opt-out based on region)

### 5.2 Privacy Policy & Cookie Policy Pages

#### Required Content Sections

**1. Privacy Policy Structure:**

```markdown
# Privacy Policy and Cookie Policy

**Last Updated:** [Current Month Year]

The Eurasia Forum for Social Workers (EFSW) ("we," "our," or "us") is committed to protecting your privacy. This policy explains how we collect, use, disclose, and safeguard your information when you visit our website, in compliance with international data protection standards, including the General Data Protection Regulation (GDPR).

## 1. Information We Collect

We collect personal information that you voluntarily provide to us when registering for membership, subscribing to newsletters, or contacting us. This may include:

- **Personal Data:** Name, email address, country of residence, organization/university, professional credentials, and job title.
- **Log Data:** IP address, browser type, pages viewed, and the time/date of your visit.

## 2. How We Use Your Information

We use the collected data for the following purposes:

- To verify and process your membership application.
- To provide access to the member portal and resource library.
- To send vital updates, newsletters, and announcements regarding upcoming forums and webinars.
- To improve our website security, performance, and user experience.

## 3. Data Protection and Retention

We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, or disclosure. We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy or to comply with legal obligations.

## 4. Your Data Rights (GDPR Compliance)

Under GDPR, website users and members have the right to:

- Access, update, or correct the personal information we hold about you.
- Request the deletion of your personal data ("Right to be Forgotten").
- Object to or restrict the processing of your data.
- Withdraw your consent at any time for data processing.

To exercise any of these rights, please contact us at privacy@eurasiaforumsw.org.

## 5. Cookie Policy

Our website uses cookies to enhance your browsing experience. Cookies are small text files stored on your device when you load a webpage.

### Types of Cookies We Use:

- **Strictly Necessary Cookies:** Essential for the website to function properly, including member login and session security. (Cannot be disabled)
- **Functional Cookies:** Used to remember your preferences, such as your selected language (English, Korean, or Thai).
- **Analytics Cookies:** Help us understand how visitors interact with our website (e.g., Google Analytics) so we can improve our content and layout.

### Managing Cookies:

You can choose to accept or reject non-essential cookies via the **Cookie Consent Banner** upon your first visit. You can also modify your browser settings to decline cookies at any time; however, this may prevent certain features of the website from functioning properly.
```

#### Korean Translation (Privacy & Cookie Policy - KR)

```markdown
# 개인정보 처리방침 및 쿠키 정책

**최종 수정일:** [연도 월]

유라시아 사회복지사 포럼(EFSW) 이하 "포럼" 또는 "우리"는 귀하의 개인정보를 보호하기 위해 최선을 다하고 있습니다. 본 정책은 유럽 일반 개인정보보호법(GDPR)을 포함한 국제 데이터 보호 표준에 준수하며, 귀하가 포럼의 정보를 어떻게 수집, 사용, 공개 및 보호하는지 설명합니다.

## 1. 수집하는 개인정보 항목

포럼은 귀하가 회원 가입, 뉴스레터 구독 또는 문의 시 자발적으로 제공하는 개인정보를 수집합니다 수집 항목은 다음과 같습니다:

- **개인 식별 정보:** 성명, 이메일 주소, 거주 국가, 소속 기관/대학교, 직결 정보 및 직책.
- **로그 데이터:** IP 주소, 브라우저 유형, 방문 페이지, 방문 시간 및 날짜.

## 2. 개인정보의 수집 및 이용 목적

수집된 데이터는 다음과 같은 목적으로 사용됩니다:

- 회원 가입 신청 확인 및 심사 처리.
- 회원 전용 포털 및 자료실 접근 권한 부여.
- 포럼 프털 및 웹비나 관련된 주요 업데이트, 뉴스레터, 공지사항 발송.
- 웹사이트 보안, 성능 향상 및 사용자 경험 개선.

## 3. 개인정보의 보호 및 보유 기간

포럼은 허가되지 않은 접근, 변경 또는 공개로부터 귀하의 개인정보를 보호하기 위해 적절한 기술적 관리적 보안 조치를 시행합니다. 귀하의 개인정보는 본 정책에 명시된 목적을 달성하는 데 필요한 기간 동안 또는 법적 의무를 준수하기 위해 필요한 기간 동안에만 보유됩니다.

## 4. 정보주체의 권리 (GDPR 준수)

GDPR에 따라 웹사이트 이용자 및 회원은 다음과 같은 권리를 가집니다:

- 포럼이 보유하고 있는 귀하의 개인정보에 대한 열람, 업데이트 또는 정정 요청 권리.
- 귀하의 개인정보 삭제 요청 권리 ("잊힐 권리").
- 귀하의 데이터 처리에 대한 이의 제기 또는 처리 제한 요청 권리.
- 데이터 처리에 대한 동의를 언제든지 철회할 수 있는 권리.

해당 권리를 행사하시려면 privacy@eurasiaforumsw.org로 문의해 주시기 바랍니다.

## 5. 쿠키(Cookie) 정책

당사 웹사이트는 귀하의 브라우징 경험을 향상시키기 위해 쿠키를 사용합니다. 쿠키는 귀하가 웹페이지를 로드할 때 귀하의 기기에 저장되는 작은 텍스트 파일입니다.

### 사용하는 쿠키의 종류:

- **필수 쿠키 (Strictly Necessary Cookies):** 회원 로그인 및 세션 보안을 포함하여 웹사이트가 정상적으로 작동하는 데 필수적인 쿠키입니다. (비활성화 불가)
- **기능 쿠키 (Functional Cookies):** 귀하가 선택한 언어(영어, 한국어 또는 태국어)를 설정하신 기본 환경을 기억하는 데 사용됩니다.
- **분석 쿠키 (Analytics Cookies):** 방문자가 웹사이트와 상호작용하는 방식을 이해(예: Google Analytics)하여 콘텐츠와 레이아웃을 개선하는 데 도움을 줍니다.

### 쿠키 관리 방법:

귀하는 첫 방문 시 **쿠키 동의 배너**를 통해 필수적이지 않은 쿠키의 수락을 승락하거나 거부할 수 있습니다. 또한 브라우저 설정을 변경하여 언제든지 쿠키 수집을 거부할 수 있으나, 이 경우 웹사이트의 일부 기능이 제대로 작동하지 않을 수 있습니다.
```

---

## 6. Admin Standard Operating Procedures (SOP)

### 6.1 Daily Monitoring Workflow

**Step 1: Check Pending Registrations**

Admin accesses the WordPress dashboard daily to review new membership applications:

**Navigation Path:**
```
[Dashboard] → [Ultimate Member / Paid Memberships Pro] → [Members / Pending Users]
```

**Action Items:**
- Review each pending application
- Verify data completeness and authenticity
- Check for spam/bot submissions

**Expected Timeline:** Review within 24-48 hours of submission

### 6.2 Data Verification Checklist

Admin must verify the following before approving any membership:

1. **Email Authenticity:** Email must not be disposable (e.g., not asdf1234@gmail.com). Verify that professional emails end with legitimate domains (.edu, .org, .ac.th)

2. **Credential Verification:** Cross-reference name, employer, and job title/university. Verify that information is not fabricated (check LinkedIn, organizational websites)

3. **Membership Alignment:** Application matches the selected membership category criteria (e.g., student applicants must provide university information)

### 6.3 Action Execution Workflow

#### Case 1: Approved Application

**Action:**
- Admin clicks "Approve" button
- System automatically triggers Email 2 (Welcome Email)
- User gains immediate access to member portal and resources

#### Case 2: Rejected or Suspicious Application

**Action:**
- Admin clicks "Reject" or "Delete" button
- *Optional:* Send manual rejection email with reason (stored as draft template)

**Rejection Reasons Template:**

```
Dear [Applicant Name],

Thank you for your interest in joining the Eurasia Forum for Social Workers (EFSW).

After careful review, we were unable to verify the professional credentials provided in your application. To maintain the integrity of our professional network, we require validated information from all members.

If you believe this decision was made in error, please feel free to reply to this email with additional documentation or contact our support team directly.

Best regards,
The EFSW Administration Team
```

### 6.4 Logging and Reporting

**Annual Report Generation:**

Admin maintains records of:
- Total registrations per membership tier
- Approval vs. rejection rates
- Geographic distribution of members
- Monthly/quarterly growth metrics

**Dashboard Analytics:** Install analytics plugins (e.g., Google Analytics, MonsterInsights) to track:
- Registration funnel conversion rates
- Most popular membership categories
- Geographic traffic sources

---

## 7. Five-Phase Project Workflow

### Phase 1: Preparation & Branding (Week 1-2)

**Deliverables:**
- Finalize Logo assets in multiple formats (SVG, PNG, JPG)
- Define brand color codes (CI) and typography system
- Secure .org domain on international cloud hosting platform (e.g., SiteGround, Cloudflare)
- Set up staging environment for development

**Stakeholders:** Marketing team, graphic designer, web developer

### Phase 2: Development & Design (Week 3-6)

**Deliverables:**
- Install WordPress CMS with multilingual plugin architecture
- Implement global typography and responsive design framework
- Configure membership plugins with admin approval workflow
- Build custom page templates (Home, About, Membership Benefits, Resources, Contact)

**Stakeholders:** Web developer, UX/UI designer, content strategist

### Phase 3: Content & Translation (Week 7-8)

**Deliverables:**
- Draft and finalize core webpage content in English (About Us, Benefits, Privacy Policy)
- Professional translation into Korean and Thai
- SEO optimization for each language version
- Upload initial resource library content

**Stakeholders:** Content writers, professional translators, SEO specialist

### Phase 4: Quality Assurance & Launch (Week 9-10)

**Deliverables:**
- Execute cross-browser and cross-device testing (Chrome, Safari, Firefox, Edge; desktop, tablet, mobile)
- Verify SSL security certificates and HTTPS configuration
- Conduct user acceptance testing (UAT) with beta members
- Official website launch (Go-Live)

**Stakeholders:** QA testers, cybersecurity consultant, project manager

### Phase 5: Post-Launch & Administration (Ongoing)

**Deliverables:**
- Admin team conducts daily verification of incoming registrations
- Monitor website analytics and user engagement
- Implement feedback loops for continuous improvement
- Regular security updates and plugin maintenance

**Stakeholders:** Admin team, IT support, community manager

---

## 8. Advanced Features (Optional Enhancements)

### 8.1 Member Portal Dashboard

**Features:**
- Personalized member dashboard with profile edit capabilities
- Downloadable membership certificate (PDF generation)
- Event registration system with QR code ticketing
- Direct messaging between members (optional community forum)

### 8.2 Resource Library Advanced Search

**Features:**
- Faceted search by topic, region, publication year, document type
- Bookmark/favorite system for saved resources
- Download tracking analytics
- Citation generator for academic papers

### 8.3 Event Management System

**Features:**
- Online event calendar with RSVP functionality
- Zoom/Teams integration for virtual forums
- Post-event resource sharing (presentation slides, recordings)
- Automated reminder emails

### 8.4 Payment Integration (Future Expansion)

**Features:**
- Stripe/PayPal gateway for paid membership tiers
- Automated renewal reminders
- Invoice generation and receipt emails
- Multi-currency support

---

## 9. Security & Maintenance Protocols

### 9.1 Security Best Practices

**Required Implementations:**
- SSL/TLS encryption (HTTPS)
- Regular WordPress core and plugin updates
- Strong password policies (minimum 12 characters, complexity requirements)
- Two-factor authentication (2FA) for admin accounts
- Automated daily backups with offsite storage
- Web Application Firewall (WAF) via Cloudflare or Sucuri

### 9.2 Maintenance Schedule

**Daily:**
- Check pending registrations
- Monitor uptime and performance metrics

**Weekly:**
- Review security logs
- Update plugins and themes

**Monthly:**
- Full database backup
- Performance optimization (cache clearing, image compression)
- Content audit and broken link checks

**Quarterly:**
- Comprehensive security audit
- User feedback review and feature prioritization
- Analytics reporting to stakeholders

---

## 10. Success Metrics & KPIs

### 10.1 Launch Goals (First 6 Months)

- **Membership Growth:** 500+ registered members across all tiers
- **Geographic Reach:** Members from at least 10 countries
- **Resource Engagement:** 1,000+ resource downloads
- **Event Participation:** 200+ attendees at inaugural virtual forum

### 10.2 Ongoing Performance Indicators

- **Website Traffic:** 10,000+ monthly unique visitors
- **Member Retention Rate:** 85%+ annual renewal rate
- **Content Contributions:** 50+ member-submitted research papers per year
- **SEO Rankings:** Top 10 Google results for "Eurasia social work network" in all three languages

---

## 11. Budget Estimate (Preliminary)

| Item | Cost (USD) |
|------|------------|
| Domain Registration (.org, 2 years) | $30 |
| Cloud Hosting (Premium, 1 year) | $300 |
| WordPress Premium Theme | $60 |
| Membership Plugins (Paid Memberships Pro, Ultimate Member Pro) | $400 |
| Professional Translation (Korean + Thai) | $1,200 |
| SSL Certificate (Wildcard, 1 year) | $100 |
| Logo & Branding Design | $500 |
| Web Development (80 hours @ $50/hr) | $4,000 |
| QA Testing & Launch Support | $800 |
| **Total Estimated Cost** | **$7,390** |

*Note: Prices are estimates and may vary based on service providers and project scope adjustments.*

---

## 13. Modern Design Implementation Guide

### 13.1 Design System Integration

The modern design system (v2.0.0) is fully documented in [DESIGN.md](./DESIGN.md). This section provides integration guidelines for developers.

#### 13.1.1 CSS Custom Properties Setup

Add to `app/globals.css`:

```css
:root {
  /* Surface levels */
  --surface-deepest: oklch(0.10 0.015 210);
  --surface-deep: oklch(0.15 0.018 210);
  --surface-mid: oklch(0.20 0.020 210);
  --surface-raised: oklch(0.25 0.022 210);
  --surface-elevated: oklch(0.30 0.024 210);
  --surface-highest: oklch(0.35 0.026 210);
  
  /* Accent colors */
  --accent-primary: oklch(0.78 0.14 180);
  --accent-secondary: oklch(0.78 0.13 155);
  --accent-muted: oklch(0.85 0.11 175);
  --accent-warm: oklch(0.82 0.14 85);
  
  /* Text colors */
  --text-primary: oklch(0.95 0.01 210);
  --text-secondary: oklch(0.70 0.02 210);
  --text-tertiary: oklch(0.50 0.02 210);
  
  /* Typography */
  --text-display: clamp(2.5rem, 1.8rem + 3.5vw, 5rem);
  --text-h1: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
  --text-h2: clamp(1.75rem, 1.4rem + 1.75vw, 2.75rem);
  --text-body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  
  /* Spacing */
  --space-xs: clamp(0.75rem, 0.65rem + 0.5vw, 1rem);
  --space-sm: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-md: clamp(1.5rem, 1rem + 2.5vw, 2.5rem);
  --space-lg: clamp(2rem, 1rem + 5vw, 4rem);
  --space-xl: clamp(3rem, 1.5rem + 7.5vw, 6rem);
  
  /* Radius */
  --radius-lg: 0.75rem;
  --radius-full: 999px;
  --radius-circle: 50%;
  
  /* Animation */
  --ease-smooth-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 13.1.2 Component Migration Pattern

**Before (old pattern):**
```tsx
<div className="bg-white dark:bg-gray-900 p-6 rounded-lg">
  <h2 className="text-2xl font-bold mb-4">Title</h2>
  <p className="text-gray-600">Content</p>
</div>
```

**After (design system pattern):**
```tsx
<div className="bg-[var(--surface-deep)] p-[var(--space-md)] rounded-[var(--radius-lg)] border border-[var(--surface-mid)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-smooth-out)] hover:translate-y-[-4px]">
  <h2 className="text-[var(--text-h2)] leading-tight tracking-tight font-semibold mb-[var(--space-xs)]">Title</h2>
  <p className="text-[var(--text-secondary)] text-[var(--text-body)]">Content</p>
</div>
```

#### 13.1.3 Animation Implementation

**Page transitions (Framer Motion):**
```tsx
// app/layout.tsx
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 }
};

export default function Template({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**Scroll animations:**
```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export function FadeInSection({ children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

#### 13.1.4 Accessibility Checklist

Before deploying any component:

- [ ] All interactive elements have min 44×44px touch target
- [ ] Focus states visible with 2px outline
- [ ] Color contrast meets WCAG AA (4.5:1 for body text)
- [ ] Semantic HTML used (button, nav, main, article)
- [ ] ARIA labels for icon-only buttons
- [ ] Keyboard navigation tested (Tab, Enter, Esc, Arrow keys)
- [ ] Screen reader tested with VoiceOver/NVDA
- [ ] Reduced motion preference respected

### 13.2 Performance Optimization

#### 13.2.1 Image Optimization

Use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="EFSW Community"
  width={1200}
  height={675}
  priority // for above-fold images
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

#### 13.2.2 Code Splitting

```tsx
// Dynamic import for heavy components
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <LoadingSkeleton />,
  ssr: false // client-only if needed
});
```

#### 13.2.3 Font Loading

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'thai'],
  display: 'swap',
  variable: '--font-body',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body">{children}</body>
    </html>
  );
}
```

#### 13.2.4 Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

Monitor with Vercel Analytics or Google Lighthouse.

### 13.3 Responsive Design Patterns

#### 13.3.1 Breakpoint System

```css
/* Mobile-first approach */
.container {
  padding: var(--space-sm);
}

/* Tablet: 48rem (768px) */
@media (min-width: 48rem) {
  .container {
    padding: var(--space-md);
  }
}

/* Desktop: 64rem (1024px) */
@media (min-width: 64rem) {
  .container {
    padding: var(--space-lg);
  }
}
```

#### 13.3.2 Grid Patterns

```css
/* Auto-fit cards */
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-md);
}

/* Responsive hero */
.grid-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 48rem) {
  .grid-hero {
    grid-template-columns: 1fr 1fr;
  }
}
```

### 13.4 Testing Strategy

#### 13.4.1 Visual Testing

- **Browsers:** Chrome, Safari, Firefox, Edge (latest 2 versions)
- **Devices:** iPhone SE, iPhone 14 Pro, iPad, Desktop (1920×1080)
- **Color schemes:** Dark mode only (primary), light mode (future)

#### 13.4.2 Accessibility Testing

- **Automated:** axe DevTools, Lighthouse Accessibility audit
- **Manual:** Keyboard navigation, screen reader (VoiceOver on macOS/iOS, NVDA on Windows)
- **Tools:** WAVE, Pa11y

#### 13.4.3 Performance Testing

- **Lighthouse:** Target 90+ for Performance, Accessibility, Best Practices, SEO
- **Real devices:** Test on actual mobile devices, not just emulators
- **Network conditions:** Test on 3G/4G throttling

---

## 14. Deployment Checklist

### 14.1 Pre-Launch

#### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
NEXTAUTH_URL=https://eurasiaforumsw.org
NEXTAUTH_SECRET=...

# Email
RESEND_API_KEY=...
EMAIL_FROM=noreply@eurasiaforumsw.org

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=efsw-uploads

# Analytics (optional)
NEXT_PUBLIC_GA_ID=...
```

#### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

#### Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

#### Build Verification

```bash
# Type check
npm run type-check

# Build
npm run build

# Test production build locally
npm start
```

### 14.2 Post-Launch Monitoring

- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Analytics:** Google Analytics, Vercel Analytics
- **Performance:** Lighthouse CI, SpeedCurve

### 14.3 Backup Strategy

- **Database:** Daily automated backups, 30-day retention
- **File storage:** S3 versioning enabled
- **Code:** Git repository with protected branches

---

## 15. Conclusion

This comprehensive specification document provides all necessary technical, content, and operational guidelines to successfully launch and maintain the EFSW website as a world-class platform for social work professionals across Eurasia.

By following this Pro edition blueprint with the modern design system (v2.0.0), the development team will deliver a secure, scalable, and user-friendly membership portal that upholds the highest standards of international data protection, professional networking, and academic collaboration.

### Key Deliverables Summary

**✅ Completed (Prototype):**
- Modern design system v2.0.0 with dark-first palette, fluid typography, and 19+ components
- Responsive Next.js 14 application with App Router
- Trilingual content support (EN/TH/KR)
- Three-tier membership registration (Professional, Student, Institutional)
- Administrator workspace with member review, content publishing, and activity logging
- Local browser-based authentication and storage (demo purposes)
- Accessibility features (WCAG AA, keyboard navigation, reduced motion)
- Animation system with Framer Motion and GSAP
- Component library with consistent design tokens

**⏳ Pending (Production):**
- Backend database (PostgreSQL + Prisma or Supabase)
- Server-side authentication (NextAuth.js)
- Email service (Resend/SendGrid)
- File storage (AWS S3 or Supabase Storage)
- Production deployment (Vercel or AWS)
- GDPR/CCPA compliance implementation
- Multi-language routing with next-intl
- Payment integration (if membership fees required)
- Advanced analytics and monitoring

**📐 Design System Highlights:**
- **6 surface levels:** Dark-first depth through tonal progression
- **4 accent colors:** Teal (trust), Emerald (growth), Amber (advocacy), Muted teal
- **11 type scales:** Fluid clamp() from display to caption
- **9 spacing steps:** Systematic progression with fluid scaling
- **14 animations:** Page transitions, scroll effects, micro-interactions
- **WCAG AA compliant:** 4.5:1 contrast, focus indicators, semantic HTML

**Next Steps:**
1. Review and approve this specification document ✅
2. Review and approve the design system (DESIGN.md) ✅
3. Choose backend architecture (Next.js API + Prisma vs WordPress + WPGraphQL)
4. Set up production database and authentication
5. Implement email service and file storage
6. Migrate from localStorage to server-side persistence
7. Deploy to production environment (Vercel recommended)
8. Set up monitoring and analytics
9. Conduct security audit and penetration testing
10. Launch beta testing program 2 weeks before official Go-Live

---

**Document Version:** 2.0.0  
**Last Updated:** August 8, 2026  
**Design System Version:** 2.0.0 (Modern dark-first implementation)  
**Prepared by:** EFSW Web Development Team  
**Contact:** dev@eurasiaforumsw.org
