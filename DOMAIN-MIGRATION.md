# Lak Travelers domain migration

The owner confirms https://laktravelers.com is active with SSL and customer reviews work after the Render CORS update. The production Pages hostname is https://laktravelers.pages.dev. Keep https://laktravelers-web.pages.dev allowed for compatibility. Domain redirects must remain inactive until separately authorized.

## Manual configuration, in order

1. **Cloudflare DNS and Spaceship:** Domain and SSL setup is complete. Preserve the working nameservers and DNS records; no further Spaceship changes are required for this release.
2. **Cloudflare Pages:** Use the existing project serving `laktravelers.pages.dev` with the active `laktravelers.com` custom domain. Do not create a replacement project or change the working DNS association.
3. **Pages production build settings:** Root directory `lak-travelers/frontend`; build command `npm run build`; output directory `dist`. Set production `VITE_SITE_URL=https://laktravelers.com`. Keep `VITE_API_URL` at its existing deployed HTTPS backend `/api` URL and preserve all other environment values. The build now includes static metadata for 13 public routes and renders the four service pages. Use the same canonical site URL in preview builds; use Cloudflare Access if previews need restricted access.
4. **Render backend → Environment:** CORS is already working; verify rather than replace the existing settings. Set `FRONTEND_URL=https://laktravelers.com`. Append `https://laktravelers.com,https://www.laktravelers.com,https://laktravelers.pages.dev,https://laktravelers-web.pages.dev` to `ALLOWED_ORIGINS`, keeping every existing allowed origin and using comma-separated origins without trailing slashes. Save/redeploy the backend through the normal release process. Leave MongoDB, authentication secrets, mail settings and API host unchanged. Code also explicitly allows both new hosts and retains both Pages hosts and the existing preview-origin rule.
5. **Deploy and verify before redirects:** Deploy the reviewed code through the usual process. Check HTTPS at the apex, navigation and direct reloads for all four service pages, both vehicle details, reviews, gallery and `/admin/login`. Exercise WhatsApp enquiries, admin sign-in and review moderation with existing authorized accounts. Confirm the API has no CORS failures. Check `/robots.txt` and `/sitemap.xml` return 200 with the new domain; `/not-a-real-page` and `/vehicles/not-a-real-vehicle` must return HTTP 404 and noindex. Check page source contains distinct metadata and landing-page content. These live checks are still pending.
6. **Deferred redirects — do not activate in this release.** Only after separate authorization and successful deployment checks:
   - In Cloudflare DNS, configure a proxied `A` record `www` → `192.0.2.1` for the redirect-only host, removing any conflicting `www` record. Wait for valid HTTPS coverage for `www`.
   - Account → Bulk Redirects → create a list with these three entries (source hosts omit the scheme so both HTTP and HTTPS match):

     | Source URL | Target URL | Status |
     | --- | --- | --- |
     | `www.laktravelers.com/` | `https://laktravelers.com/` | 301 |
     | `laktravelers.pages.dev/` | `https://laktravelers.com/` | 301 |
     | `laktravelers-web.pages.dev/` | `https://laktravelers.com/` | 301 |

   - For all entries, enable **Preserve query string**, **Subpath matching**, and **Preserve path suffix**. Leave **Include subdomains** OFF to keep branch/preview URLs working.
   - Create and enable a Bulk Redirect rule referencing that list. Enable Always Use HTTPS for the apex zone. Do not implement cross-domain redirects in the Pages `_redirects` file.
   - Verify all three hosts redirect `/sri-lanka-private-driver?source=test` to `https://laktravelers.com/sri-lanka-private-driver?source=test` with 301 and that the destination returns 200 without a loop.
7. **Google Search Console:** Add Domain property `laktravelers.com`. Copy Google's actual verification TXT value into Cloudflare DNS at `@`; click Verify once visible. Submit `https://laktravelers.com/sitemap.xml` in Sitemaps. Use URL Inspection on the homepage and service pages, run the live test and request indexing where offered. If the old URL-prefix property is verified and Search Console offers Change of Address for this move, submit it after redirects work. Keep the old domain redirects long-term. Verification and indexing have not been performed.
8. **If Google OAuth is configured for admin login:** Add `https://laktravelers.com` to the existing Google OAuth web client's Authorized JavaScript origins, retaining the old origin during migration. Keep the existing client ID. Add callback URLs only if that existing OAuth implementation actually uses callbacks.

## Implementation and limits

- Public metadata has unique titles/descriptions, canonical and sharing URLs, and repository-backed TravelAgency, WebSite and breadcrumb JSON-LD. No ratings or prices were invented.
- Four reusable, responsive enquiry pages include FAQs, internal links and the existing WhatsApp number. Tour package feature flags remain disabled.
- Build-time rendering uses existing Vite/React packages without network requests. The four landing pages include complete content without JavaScript; existing pages get static metadata but their bodies still render in the browser. Full existing-page pre-rendering is a follow-up because of browser storage, lazy routing and live review/gallery data; no framework migration was attempted.
- The build creates `404.html` and a noindex `app.html`. Explicit rewrites preserve auth/protected/disabled routes. Unknown direct requests use Cloudflare's native 404 behavior; client-side navigation displays the app's noindex not-found view. If marketplace vehicle routes are enabled later, add their dynamic rewrite and metadata strategy at that time.
- Crawling is allowed so search engines can read noindex on non-public routes; robots.txt is not access control. Existing authentication still protects data.
- Existing large image assets and >500 kB bundle warnings remain. Lazy loading is retained; this change does not recompress the photo library or refactor bundles.

## Changed files

Frontend: `.env.example`, `index.html`, `package.json`, `public/_redirects`, `public/robots.txt`, `public/sitemap.xml`, `scripts/prerender.mjs`, `src/App.jsx`, `src/components/{Footer,PageMetadata,PublicExperience}.jsx`, `src/pages/{Home,PublicVehicles,ServiceLanding}.jsx`, `src/services/{seo,servicePages}.js`, `tests/seo.test.js`.

Backend: `app.js`, `tests/security.test.js`. Root: this guide.

## Official references

- [Spaceship nameserver configuration](https://www.spaceship.com/knowledgebase/connect-domain-custom-nameservers/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare old Pages domain redirect](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/)
- [Cloudflare www redirect](https://developers.cloudflare.com/pages/how-to/www-redirect/)
- [Cloudflare static route and 404 behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Render environment variables](https://render.com/docs/configure-environment-variables)
- [Google Search Console properties and verification](https://support.google.com/webmasters/answer/34592?hl=en)
