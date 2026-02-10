# QA Report – Tacin Arabi Collection

Date: 2026-02-10

## Scope covered
- Baseline functional flow validation on production URL (`https://tacinarabicollection.vercel.app/`).
- UX checks for animations, skeleton behavior, and micro-interactions.
- Mobile readability/content density review (hero, trust section, footer).
- Admin tooling smoke checks (`/admin/inventory`, `/admin/orders`).
- Production readiness check via `next build`.

## Results summary

### 1) Baseline flows (add to cart, checkout, WhatsApp redirect)
**Status: PASS**
- Product can be added to cart after selecting a size.
- Cart drawer opens and checkout sheet opens.
- Checkout form accepts Name/Phone/Address and COD CTA is enabled.
- COD submit redirects to WhatsApp web endpoint (`https://api.whatsapp.com/send/...`) with prefilled order payload.

### 2) UX polish (animations, skeleton loaders, micro-interactions)
**Status: PASS (observed) / PARTIAL (timing-sensitive visual details)**
- Toast notification appears after add-to-cart.
- Cart entry/checkout sheet transitions behave correctly.
- Skeleton shimmer exists in code and renders during initial loading delay.
- Cart bump animation class is conditionally applied when cart count increases.

Notes:
- Hero chip hover and floating WhatsApp pulse are present in styling/markup.
- Some micro-interactions are subtle and best validated with manual visual pass on real devices.

### 3) Content density/mobile readability (hero/trust/footer)
**Status: PASS with minor copy-density caution**
- Hero has concise headline and support copy.
- Trust/“How ordering works” blocks are segmented and scannable.
- Footer is balanced with contact + assurance text and social references.

Suggestion:
- On very small devices, consider shortening one of the trust paragraphs by ~10–15% to reduce vertical fatigue.

### 4) Admin tooling (inventory + orders)
**Status: PARTIAL PASS**
- `/admin/inventory` route is accessible and renders inventory management UI.
- `/admin/orders` route is accessible and renders filter controls + empty state.
- Order logging is implemented client-side via `localStorage` (`tacin-orders`) after WhatsApp redirect trigger.

Caveat:
- Because order storage is local-browser scoped, admin order visibility depends on using the same browser/profile and origin where checkout occurred.

### 5) Performance / production build check
**Status: WARNING (environment/network-dependent failure)**
- `npm run build` fails in this environment due to Google Font fetch (`Inter`, `Playfair Display`) during `next/font` build step.
- This is not a code compile error in application logic; it is an external font fetch failure from `fonts.googleapis.com` at build time.

Recommendation:
- For deterministic CI builds, self-host fonts or include a fallback strategy that does not require live Google fetch during build.

## Executed checks
- `npm run build` (fails: Google font fetch from `next/font`).
- `npm run lint` (not completed: interactive Next.js ESLint initialization prompt in this environment).
- Playwright browser automation against production URL to validate:
  - hero and ordering sections,
  - add-to-cart + toast,
  - cart → checkout,
  - WhatsApp redirect URL,
  - admin inventory/orders route access.

## Artifacts
- Mobile screenshot artifact from browser automation:
  - `browser:/tmp/codex_browser_invocations/7ad05848f79af281/artifacts/artifacts/qa-mobile.png`
