# Lak Travelers review update — 6 November 2026

**Implemented locally; not committed, pushed or deployed.** No production records, credentials, roles or DNS were changed.

## Features and access

- Public `/reviews` retains account-free submission, name, 1–5 stars, 10–2000 characters, five optional JPG/PNG/WebP photos (5 MB each), previews/removal, feedback and lightbox. Added an immediate in-flight guard against repeated submit clicks.
- Existing MongoDB review/image persistence, pending-by-default status, approval/rejection, private drafts, photo authorization and spam limits are retained. Email failure does not erase saved submissions.
- `PUBLIC_AUTH_ENABLED = false` hides public account navigation and redirects `/login` and `/register` home. Authentication/OTP components, APIs and existing accounts remain intact for restoration; this is a public UI restriction, not removal of the registration API.
- Direct administrator entry: **`/admin/login`**. It reuses password authentication via new `/api/users/admin/auth`, which rejects non-admin roles before issuing a token. Both admin and super-admin are supported. Existing server-side moderation/gallery role checks remain enforced. Unauthorized management-page visits lead to admin sign-in; no public admin sign-in button was added.
- Existing gallery supports private upload, captions, publication/unpublication, preview, public lightbox and confirmed deletion. Visitors cannot manage it. MongoDB photos remain independent of Render filesystem storage.
- About Us now displays **Manjula Kumara — Chief Executive Officer (CEO)** using the supplied actual photograph, optimized from 1.4 MB PNG to approximately 179 KB JPEG (767×1000), without altering the face. Responsive framing, descriptive alt text and lazy loading are present. Existing founder/company/contact facts remain; no CEO biography was invented.
- Vehicle content and vehicle-specific WhatsApp enquiries are preserved.

## TrustBridge separation

Removed residual homepage/footer promotion, WhatsApp specialization, metadata and sitemap references. Case-insensitive searches found **zero TrustBridge references in frontend source/public files and the production dist output**.

The separate project `/Users/ishan/Documents/GitHub/TrustBridge-Lanka` and existing source/assets backup `/Users/ishan/Documents/GitHub/LakTravelers_TrustBridge_backup_20261106_000132` were not modified. Removed integration snippets and the orphaned TrustBridge-only test are additionally preserved under `/private/tmp/lak-travelers-separation-20261106` (temporary storage).

## Verification

| Check | Result |
|---|---|
| Backend suite | PASS: 27 passed, 0 failed, 1 skipped real-database write test |
| Remaining frontend suite | PASS: 1 passed, 0 failed |
| Targeted gallery/auth rerun | PASS: 3 passed, included above |
| Lint / production build / backend syntax / diff check | PASS; existing large-chunk build warning remains |
| Five-photo multipart submission | PASS with isolated models: five image documents, pending review; sixth photo and invalid bytes rejected |
| Review workflow | PASS: unauthenticated submission, ordinary-user moderation denial, approve/reject visibility, private photo restrictions, optional email failure preservation |
| Gallery workflow | PASS: admin restrictions, private upload, bytes preserved, publish/edit/unpublish/private-photo denial/delete using mocks |
| Admin sign-in | PASS: admin and super-admin accepted, ordinary user and wrong password denied; no token cookie issued to denied user |
| Production-preview browser | PASS: public login/register redirect home; review/gallery management redirects to admin login; labeled admin form available; public review form accessible without login; mobile CEO profile renders with no observed horizontal overflow and no public auth links |

No test writes reached MongoDB or an email provider. Existing four private drafts and two referenced photos were verified read-only during the prior audit; this update performed no database operations and left those models/storage records untouched.

## Files changed in this update

Paths below are relative to `lak-travelers/`:

- Backend: `controllers/userController.js`, `routes/userRoutes.js`, `tests/customerReviews.test.js`, `tests/deployment.test.js`.
- Frontend: `src/App.jsx`, `src/services/{features,api}.js`, `src/components/{Navbar,Footer,PageMetadata}.jsx`, `src/pages/{Login,Home,CustomerReviews,AboutUs}.jsx`, `public/sitemap.xml`, new `src/assets/manjula-kumara-ceo.jpg`; orphaned `tests/trustbridge.test.js` moved outside the repository.
- Root: this report. All unrelated pre-existing changes were preserved.

## Production actions / limitations

**NOT VERIFIED:** live administrator credentials, deployed new admin endpoint, email delivery, and live write workflows. No production write tests were attempted. No new secrets or account changes are required. After separate deployment authorization, deploy backend and frontend together, keep the existing API/CORS/email settings, then verify an existing admin can sign in and view private drafts/gallery. Use staging for synthetic submission tests. The localhost production preview is not evidence of live API integration. In-memory OTP/rate limits and existing large bundles remain unchanged.
