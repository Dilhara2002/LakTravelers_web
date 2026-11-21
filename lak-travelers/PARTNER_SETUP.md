# Partner onboarding: local implementation and deployment prerequisites

## Scope and storage

Routes: `/partners`, `/partners/dashboard`, `/admin/partners`; API: `/api/partners`.
The existing User model/bcrypt credentials and admin JWT authorization are reused. Partner
profiles, hashed one-time tokens, revocable cookie sessions, applications and private document
records are additive MongoDB collections. Guide/driver/vehicle details are validated against
`shared/partnerFields.mjs`; each additional vehicle is a separate application. There is no
legacy-data backfill, vendor promotion or automatic/self-drive authorization.

Documents are stored as private MongoDB binary records (one file per record, 5 MB maximum),
not in public uploads or Cloudinary. Downloads require ownership or administrator authorization,
are attachment-only, non-cacheable and use server-generated filenames. Replacement removes
the previous binary after updating the application. Signature/MIME checks do not constitute
antivirus scanning; documents must be reviewed with appropriately protected software.
Use a database account restricted to the application database and encrypted MongoDB transport,
storage and backups. Apply the organization's document retention/deletion policy before launch.

Sessions expire after seven days and are invalidated by logout, password changes, account
bans/disabling, or deletion. Verification/reset codes expire after 30 minutes, are hashed at
rest and consumed once. Partner mutations require an explicitly trusted Origin and a custom
CSRF header. Production cookies require HTTPS. For browsers blocking third-party cookies,
serve the API on a same-site hostname/reverse proxy; do not weaken cookie security.

Email delivery uses the existing SMTP/Resend implementation. Application events persist email
status in the audit history; administrators can retry failed/pending notifications. If initial
verification mail fails after account creation, log in and use Resend code. There is no fake
email or WhatsApp sending. Customers continue to open their WhatsApp enquiry directly.

## Environment

Backend: existing `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `FRONTEND_URL`,
`ALLOWED_ORIGINS`. Set exact trusted frontend origins, comma separated. No new secrets required.
Email: either `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`; or `EMAIL_PROVIDER=smtp`
with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`; legacy Gmail
`EMAIL_USER`/`EMAIL_PASS` is also supported. Sender domain/account must be authorized by the provider.
Frontend: `VITE_API_URL` pointing to the matching API. Cloudflare Pages alone cannot run Express.

## Safe local commands (from repository root)

Use a separate local MongoDB and sandbox email credentials. These commands override any existing
production `.env` database value. Nothing in this change has been run against production data.

```sh
npm ci --prefix lak-travelers/backend
npm ci --prefix lak-travelers/frontend
MONGO_URI=mongodb://127.0.0.1:27017/lak-travelers-partner-dev npm run partners:indexes --prefix lak-travelers/backend
NODE_ENV=development MONGO_URI=mongodb://127.0.0.1:27017/lak-travelers-partner-dev JWT_SECRET=local-development-only-change-me FRONTEND_URL=http://localhost:5173 ALLOWED_ORIGINS=http://localhost:5173 npm run dev --prefix lak-travelers/backend
# In another terminal:
VITE_API_URL=http://localhost:5001/api npm run dev --prefix lak-travelers/frontend
```

The index initializer refuses non-local URIs and any database not named
`lak-travelers-partner-dev` or `lak-travelers-partner-test`. It adds collections/indexes without
changing existing records. Existing admin promotion tooling can provision an administrator in
the local database; use its documented arguments with the same explicit local MONGO_URI.

## Validation

```sh
node --test lak-travelers/backend/tests/partners.test.js
npm test --prefix lak-travelers/backend
npm test --prefix lak-travelers/frontend
npm run lint --prefix lak-travelers/frontend
npm run check --prefix lak-travelers/backend
npm run build --prefix lak-travelers/frontend
```

Partner HTTP tests use real routes, Mongoose schema validation, bcrypt, JWT middleware and
multipart uploads with an in-memory persistence adapter and mocked email provider. They do not
prove MongoDB concurrency/index behavior or real email delivery. A MongoDB executable is not
available in this workspace. Before launch, perform a staging smoke test with real MongoDB and
sandbox email: register/verify, log in, save/resume all categories, upload/replace/download,
submit, request corrections, resubmit, manually approve/reject/suspend and retry failed mail.
Automated headless-browser checks passed at 320px, 375px, 768px and 1365px for the landing
page and all steps in all three forms, with no horizontal overflow or runtime exceptions.
These checks used local API fixtures and blocked external network requests. The CSS uses
single-column mobile forms, wrapping controls and three-column progress indicators.

## Deployment gate — not executed

No commit, push, deployment, hosting setting change or production migration was performed.
After approval, deploy the backend **including the sibling `shared` directory**, configure the
above variables and the MongoDB unique/TTL indexes from `models/Partner.js` through the approved
migration process. Existing model index creation applies when Mongoose autoIndex is enabled;
otherwise an administrator must create them explicitly. The local-only initializer is not a
production migration command. Existing rate limits are per-process; multiple API instances
require a shared limiter or equivalent ingress limits.

For the existing Cloudflare Pages project, use:

```sh
npm run build --prefix lak-travelers/frontend
# Publish lak-travelers/frontend/dist through the existing approved Pages deployment pipeline.
```

The included `_redirects` entries support direct partner URLs. No hosting/domain settings need
to be changed by this implementation. Confirm backend availability, private storage access,
email sender delivery, same-site session behavior and staging verification before publishing.

## Results recorded in this implementation

- Focused partner backend tests: 4 passed (including end-to-end HTTP workflow with model doubles).
- Frontend suite: 12 passed, including account-free WhatsApp regression checks.
- Full backend suite: 32 passed, 1 failed, 1 skipped initially. The failure was an existing PNG
  fixture mislabeled as JPEG in `customerReviews.test.js`. Only the test MIME/filename and
  offline-email setup were corrected; its focused rerun passed all 3 tests. The full suite
  was not redundantly rerun. The skipped test requires an explicitly configured real MongoDB.
- Frontend lint: zero errors, six existing warnings in Home/PublicGallery.
- Production build: passed once, with the existing large-chunk warning. Partner chunks and
  direct-route redirects are included in `dist`.
- Backend syntax checks and `git diff --check`: passed.

## Changed files

New backend: `models/Partner.js`, `routes/partnerRoutes.js`, `utils/partnerValidation.js`,
`scripts/initializePartnerIndexes.js`, `tests/partners.test.js`.
Backend integration: `app.js`, `package.json`; existing test fixture correction:
`tests/customerReviews.test.js` (no review runtime changes).

New frontend: `src/pages/Partners.jsx`, `src/pages/AdminPartners.jsx`,
`src/services/partnerApi.js`, `src/styles/partners.css`, `tests/partners.test.js`.
Frontend integration: `src/App.jsx`, `src/components/Navbar.jsx`, `src/components/Footer.jsx`,
`src/components/WhatsApp.jsx`, `src/pages/Dashboard.jsx`, `public/_redirects`.
Shared contract: `shared/partnerFields.mjs`. Setup and results: this file.
