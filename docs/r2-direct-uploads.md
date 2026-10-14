# R2 browser uploads on Vercel

Admin media, academic documents, gallery images and member avatars use `/api/upload/direct` to request a short-lived URL. The browser sends file bytes to R2; Vercel verifies size and file signature before copying the object from `uploads/pending/` to its final key. This avoids Vercel's request body limit while keeping the existing 20 MB image/document, 200 MB video and 5 MB gallery/avatar limits.

Configure bucket CORS using `r2-cors.example.json`, replacing every example origin with the actual domain and Vercel preview origins you use. In the Cloudflare dashboard use the rules inside `CORSRules`; with the S3 API use the full object. Wildcard origins are unnecessary. The request URL uses the account's `r2.cloudflarestorage.com` endpoint. `R2_PUBLIC_URL` must be a configured public bucket/custom-domain origin serving final keys.

Set a bucket lifecycle rule expiring objects under `uploads/pending/` after one day. Abandoned browser uploads otherwise remain in storage. A 15-minute ticket binds purpose, member/admin identity, size and MIME type. Successful finalization deletes the staging object. Never expose R2 API credentials to the browser.

Before production, verify in the target browser/domain: PDF larger than 4.5 MB, media larger than 4.5 MB, member avatar and gallery uploads; load their public URL; delete a gallery item and confirm it disappears. Check CORS preflight and PUT responses. Mocked handler tests do not prove the actual bucket credentials, CORS or public-domain setup.

For the temporary Neon/R2 environment, run `npm run smoke:services` with the
test credentials loaded. It inserts temporary Neon rows inside a transaction,
rolls them back, uploads one uniquely named text object, reads it back and
deletes it in a `finally` cleanup. Set `SMOKE_CHECK_PUBLIC=1` to also check the
configured public object URL. The script never sends email.
