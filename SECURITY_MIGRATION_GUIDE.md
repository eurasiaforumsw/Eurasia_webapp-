# 🔐 Security Migration Guide

## Overview
This guide walks through deploying the JWT + HttpOnly Cookie authentication system to replace the current client-side localStorage authentication.

**Estimated Time:** 30-45 minutes  
**Risk Level:** Medium (requires environment variable changes)  
**Rollback Time:** < 5 minutes

---

## ✅ Pre-Migration Checklist

- [ ] Read SECURITY_AUDIT_TH.md or SECURITY_FIXES_REQUIRED.md
- [ ] Backup current `.env.local` file
- [ ] Have access to Vercel dashboard (or your deployment platform)
- [ ] Test environment ready (optional but recommended)

---

## 📋 Step 1: Generate Password Hash

### Option A: Using Node.js (Recommended)

```bash
# Install bcryptjs if not already installed
npm install bcryptjs

# Create a hash generation script
node -e "const bcrypt = require('bcryptjs'); const hash = bcrypt.hashSync('YOUR_NEW_PASSWORD', 10); console.log('Password Hash:', hash);"
```

### Option B: Using Online Tool (Less Secure)

1. Visit: https://bcrypt-generator.com/
2. Enter your password
3. Select rounds: **10**
4. Copy the generated hash (starts with `$2a$10$` or `$2b$10$`)

**⚠️ Save this hash - you'll need it in the next step**

---

## 📋 Step 2: Update Environment Variables

### Local Development

1. Open `.env.local` in your project root
2. **Remove** the old variable:
   ```bash
   # DELETE THIS LINE:
   NEXT_PUBLIC_ADMIN_PASSWORD=your_password
   ```

3. **Add** new variables:
   ```bash
   # Paste the hash from Step 1
   ADMIN_PASSWORD_HASH=$2b$10$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
   
   # Generate a random JWT secret (use a password generator for 32+ characters)
   JWT_SECRET=your_super_long_random_secret_at_least_32_characters
   
   # Optional: Set token expiration (default: 24h)
   JWT_EXPIRES_IN=24h
   ```

4. **Generate JWT_SECRET** (choose one method):
   ```bash
   # Method 1: OpenSSL
   openssl rand -base64 32
   
   # Method 2: Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Method 3: Use a password manager to generate a 32+ character random string
   ```

### Production (Vercel)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Navigate to: **Settings** → **Environment Variables**
4. **Delete** the old variable:
   - Remove `NEXT_PUBLIC_ADMIN_PASSWORD`
5. **Add** new variables:
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `ADMIN_PASSWORD_HASH` | (paste hash from Step 1) | Production, Preview, Development |
   | `JWT_SECRET` | (paste secret from Step 1) | Production, Preview, Development |
   | `JWT_EXPIRES_IN` | `24h` | Production, Preview, Development |

6. Click **Save**

---

## 📋 Step 3: Deploy Updated Code

### If Code Already Deployed
```bash
# No code changes needed - just redeploy to pick up new env vars
git commit --allow-empty -m "chore: trigger redeploy for security env vars"
git push origin main
```

### If Implementing New Security Code
The security fixes should already be implemented in:
- `/app/api/admin/login/route.ts` - JWT login endpoint
- `/app/api/admin/verify/route.ts` - Token verification endpoint
- `/middleware.ts` - Server-side JWT validation
- `/app/admin/login/page.tsx` - Updated login form
- All `/app/api/*` routes - Protected with JWT checks

```bash
# Verify changes are staged
git status

# Commit if needed
git add .
git commit -m "security: implement JWT authentication with HttpOnly cookies

- Replace localStorage auth with JWT tokens
- Add HttpOnly cookie support
- Implement server-side middleware validation
- Protect all API routes with JWT verification
- Remove NEXT_PUBLIC_ADMIN_PASSWORD from bundle

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"

# Push to trigger deployment
git push origin main
```

---

## 📋 Step 4: Testing Checklist

### Local Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test Login Flow:**
   - [ ] Navigate to `http://localhost:3000/admin/login`
   - [ ] Enter your new password
   - [ ] Should redirect to `/admin` on success
   - [ ] Check browser DevTools → Application → Cookies
   - [ ] Should see `auth-token` cookie with HttpOnly flag

3. **Test Protected Routes:**
   - [ ] Try accessing `/admin` without logging in → should redirect to `/admin/login`
   - [ ] After login, access `/admin` → should load successfully
   - [ ] Open DevTools → Console → Run: `document.cookie`
   - [ ] Should NOT see the token value (HttpOnly protection working)

4. **Test API Protection:**
   ```bash
   # Without auth - should fail
   curl http://localhost:3000/api/members
   # Expected: {"error": "Unauthorized"}
   
   # After login through browser, try again in that same browser
   # Expected: Success with data
   ```

5. **Test Logout:**
   - [ ] Click logout (if implemented)
   - [ ] Or manually clear cookies
   - [ ] Try accessing `/admin` again → should redirect to login

### Production Testing

Repeat steps 2-5 above using your production URL (e.g., `https://yoursite.com`)

### Security Verification

1. **Check password not in bundle:**
   ```bash
   # Build the app
   npm run build
   
   # Search for old password in build output
   grep -r "NEXT_PUBLIC_ADMIN_PASSWORD" .next/
   # Expected: No results
   
   # Search in source code
   grep -r "NEXT_PUBLIC_ADMIN_PASSWORD" app/ lib/
   # Expected: No results (should be removed)
   ```

2. **Verify HttpOnly cookie:**
   - Open DevTools → Application → Cookies
   - Check `auth-token` cookie properties:
     - ✅ HttpOnly: true
     - ✅ Secure: true (in production)
     - ✅ SameSite: Strict

3. **Test localStorage bypass (should fail):**
   ```javascript
   // Open DevTools Console
   localStorage.setItem('isAdminAuthenticated', 'true');
   window.location.href = '/admin';
   // Expected: Still redirected to /admin/login (localStorage ignored)
   ```

---

## 🔄 Rollback Procedure

If something goes wrong:

### Quick Rollback (< 5 minutes)

1. **Revert environment variables in Vercel:**
   - Settings → Environment Variables
   - Delete new variables: `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `JWT_EXPIRES_IN`
   - Add back: `NEXT_PUBLIC_ADMIN_PASSWORD` with old password

2. **Revert code (if deployed):**
   ```bash
   # Find last working commit
   git log --oneline -10
   
   # Revert to previous version (replace COMMIT_HASH)
   git revert COMMIT_HASH
   git push origin main
   ```

3. **Immediate access (emergency):**
   If you're locked out and need immediate access:
   - Go to Vercel → Deployments
   - Find the last working deployment (before migration)
   - Click "..." → "Promote to Production"

### Partial Rollback (Keep new code, revert env only)

This is useful if code is fine but env vars are wrong:

```bash
# Don't revert code, just fix env vars
# Then trigger redeploy:
git commit --allow-empty -m "chore: redeploy with corrected env vars"
git push origin main
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid credentials" on first login

**Cause:** Password hash mismatch or wrong password

**Solution:**
1. Verify hash was generated correctly
2. Try regenerating hash with same password
3. Check for trailing spaces in password or hash
4. Ensure hash includes the full string (starts with `$2a$10$` or `$2b$10$`)

```bash
# Debug: Log the hash (temporarily)
node -e "console.log('Hash:', process.env.ADMIN_PASSWORD_HASH)"
```

### Issue 2: "JWT_SECRET is not defined"

**Cause:** Environment variable not set or not loaded

**Solution:**
```bash
# Check local .env.local exists and has the variable
cat .env.local | grep JWT_SECRET

# Restart dev server (env vars only load on startup)
# Kill the server (Ctrl+C) and run:
npm run dev

# For production: verify in Vercel dashboard and redeploy
```

### Issue 3: Cookie not being set

**Cause:** Secure flag requires HTTPS in production

**Solution:**
- In development: This is normal (Secure flag skipped on localhost)
- In production: Ensure you're accessing via `https://` not `http://`

### Issue 4: Infinite redirect loop

**Cause:** Middleware detecting invalid token but login page also protected

**Solution:**
```typescript
// In middleware.ts, ensure /admin/login is excluded:
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api/admin/login|admin/login|_next/static|_next/image|favicon.ico).*)'
  ]
}
```

### Issue 5: "Failed to fetch" on login

**Cause:** API route not created or not deployed

**Solution:**
```bash
# Check API route exists
ls -la app/api/admin/login/

# Check Vercel deployment logs
# Go to Vercel dashboard → Deployments → (latest) → View Logs
# Look for errors during build
```

### Issue 6: Logged in but API calls fail with 401

**Cause:** Cookie not being sent with API requests

**Solution:**
```typescript
// Ensure API calls include credentials:
fetch('/api/members', {
  credentials: 'include' // This sends cookies
})

// Or if using fetch wrapper, set globally:
// In lib/api.ts
export const api = {
  get: (url) => fetch(url, { credentials: 'include' }),
  post: (url, data) => fetch(url, { 
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data)
  })
}
```

---

## 📞 Support & Next Steps

### If Migration Succeeds
- [ ] Test all admin functions thoroughly
- [ ] Update any admin user documentation
- [ ] Consider adding 2FA (future enhancement)
- [ ] Set up monitoring for failed login attempts

### If You Need Help
1. Check Vercel deployment logs
2. Check browser console for errors
3. Review this guide's Common Issues section
4. Check the detailed audit files:
   - `SECURITY_AUDIT_TH.md` (Thai)
   - `SECURITY_FIXES_REQUIRED.md` (English)

### Post-Migration Security Enhancements (Optional)

1. **Add rate limiting** (IP-based, server-side)
2. **Add login attempt monitoring** (email alerts)
3. **Implement refresh tokens** (for longer sessions)
4. **Add 2FA/MFA** (Google Authenticator, SMS)
5. **Set up audit logging** (track all admin actions)

---

## ✅ Migration Complete

Once all tests pass:
- ✅ Password hash stored securely server-side
- ✅ JWT tokens in HttpOnly cookies
- ✅ Middleware blocking unauthorized access
- ✅ API routes protected
- ✅ No password in browser bundle
- ✅ LocalStorage bypass fixed

**Your admin panel is now secure! 🎉**
