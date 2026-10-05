# Phase 43 — Member Avatar Dropdown + Content Engagement System

## 🎯 Goal
1. **Top-right nav avatar dropdown** when member logged in
 - Avatar circle (image, or initials fallback)
 - Click → dropdown menu: Profile, Messages, Interest
 - **Dynamic, animated, not square/angular**
2. **Content engagement**:
 - Heart icon (❤) on news/events to mark "interest" (saved)
 - Like button (👍) with live count
 - View counter (eye icon) — auto-increment on visit
 - All counts reflect real interactions

## 📁 Files to create/modify

### Data layer
- **`lib/member-engagement.ts`** (NEW) — localStorage-backed store:
 - `interests: { memberId, contentId, createdAt }[]`
 - `likes: { memberId, contentId, createdAt }[]`
 - `views: { contentId, memberId?, count }` — incremented when public page visited (no memberId = anonymous)
 - SSR-safe: read on client only, sync via storage event
 - API fallbacks for when Supabase ready (`/api/engagement/...`)

- **`lib/admin-data.ts`** — add engagement fields to `AdminContentItem`:
 - `likeCount?: number`, `viewCount?: number`, `interestCount?: number`
 - These auto-update from member actions; admin sees counts in content list

### API routes (NEW)
- **`app/api/engagement/route.ts`** — `GET` (counts for content), `POST` (toggle interest/like), `PATCH` (increment view)
- Graceful when Supabase unavailable — falls back to localStorage on client

### Nav component
- **`components/efsw/MemberMenu.tsx`** (NEW) — dropdown with:
 - Avatar (img if `avatarUrl`, else initials via gradient bg)
 - Member name + email (top of dropdown)
 - 3 menu items: Profile (`/user/profile`), Messages (`/user/messages`),
   Interest (`/user/interest`)
 - Logout button (with confirm)
 - Hover-triggered open on desktop, click on mobile
 - Animation: scale-up + fade-in with backdrop blur
 - Closes on outside click + Escape

- **`components/efsw/SiteNav.tsx`** — replace `{isMember && <Link to profile>}` with:
 ```tsx
 {isMember && <MemberMenu member={member} />}
 ```
 Keep mobile sheet version too (different layout — full-width cards)

### Public content components
- **`components/efsw/PublicContentFeed.tsx`** — each card adds:
 - Heart icon (interest toggle) — top-right of card, animates on toggle
 - Like button + count — bottom of card footer
 - View count (eye icon + count) — bottom right
 - Real-time counts via engagement store

- **`components/efsw/ArticleView.tsx`** (or news/event detail page) — adds:
 - Heart + Like in header
 - Auto-increment view on mount

### Routes
- **`app/user/profile/page.tsx`** (NEW) — wraps `/member/profile` (alias)
 OR redirect `/user/profile → /member/profile`
- **`app/user/messages/page.tsx`** (NEW) — placeholder "Messages" page
 (link to existing DM system if present)
- **`app/user/interest/page.tsx`** (NEW) — saved items list:
 - All news/events the member hearted
 - Grouped by kind, sortable by date
 - Each item → click to read original article

### CSS
- **`app/globals.css`** — new sections:
 - `.efsw-member-menu` — dropdown panel
 - `.efsw-avatar` — circle w/ gradient bg fallback
 - `.efsw-content-card__heart` — animated heart icon
 - `.efsw-content-card__like`, `__view` — bottom stats row
 - All matching site's deep-teal/cream palette, no hard edges (rounded)

### Locales
- en.json / th.json / ko.json — add:
 - `navigation.profileMenu` (avatar menu title)
 - `user.profile`, `user.messages`, `user.interest`, `user.logout`
 - `engagement.like`, `engagement.interest`, `engagement.view`
 - Plural forms (1 view vs 1k views)

## 🎨 UX details
- **Avatar**: 36px diameter, 2px ring on dropdown open
 - Initials gradient: from `--efsw-green` to `--efsw-ink`
- **Dropdown**: 280px wide, 12px radius, soft shadow, deep-cream bg
 - Stagger animation: name → email → menu items (each 60ms apart)
 - Heart-beat micro-interaction on interest toggle (scale 1.2 then 1.0)
- **Heart states**: outline (not interested) ↔ filled deep-red (interested)
- **Like button**: thumbs-up with count badge, pulse on click
- **View counter**: subtle eye icon + format number (1.2k, 15k)

## 📊 Engagement data flow
```
[Visitor opens news/event] 
   → PATCH /api/engagement { action: "view", contentId }
   → server: increment viewCount (or localStorage on client)
   
[Visitor clicks heart]
   → POST /api/engagement { action: "interest", contentId, memberId }
   → server: toggle in `interests` table, recalc interestCount
   → client: optimistically update UI (heart fills, count increments)
   
[Visitor clicks like]
   → POST /api/engagement { action: "like", contentId, memberId }
   → server: toggle in `likes` table, recalc likeCount
   → client: optimistic update
```

For now (no Supabase): localStorage only, sync via `storage` event across tabs.
When Supabase ready: switch to real DB. Both layers return same shape.

## 🧪 Verification
1. tsc clean
2. Build 27 → 30 routes (add /user/messages, /user/interest)
3. Playwright E2E:
 - Login as member
 - Avatar visible top-right
 - Click → dropdown opens with 3 items + logout
 - Click Profile → /user/profile loads
 - Logout → avatar replaced by Login pill
 - News page: heart on a card → save persists across reload
 - Like → count increments + other tabs see update
 - View article → count increments
4. Visual: avatar circle, gradient initials, no hard edges
5. Animations: 150-250ms transitions, no jank