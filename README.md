# tacinarabicollection

Mobile-first e-commerce storefront with WhatsApp checkout, client-side order
persistence, and an admin inventory panel backed by server-side KV.

## Runtime architecture (current)

- **Products**: persisted on the server in KV and exposed through Next.js API
  routes.
  - Admin inventory uses `GET/POST/PUT/DELETE /api/admin/products...`
  - Landing/storefront uses `GET /api/products`
- **Orders**: intentionally client-side only in browser `localStorage` under
  key `tacin-orders`.
  - No Worker order pipeline.
  - No centralized server persistence for orders.
- **Media uploads**: ImageKit direct upload with auth parameters from
  `/api/auth/imagekit`.

## Refinement phases
Use these phases to evaluate and improve changes without losing UX features:

1. **Baseline**: Verify the app runs and the core flows work (add to cart,
   checkout, WhatsApp redirect).
2. **UX polish**: Check animations, skeleton loaders, and micro-interactions
   (hero chips, cart bump, toast notifications).
3. **Content density**: Confirm hero copy, trust blocks, and footer content are
   balanced for mobile readability.
4. **Admin tooling**: Validate admin inventory edits and local order logging.
5. **Performance**: Run `next build` and verify images, fonts, and CSS load as
   expected in production.

## Environment setup

Create `.env.local` (and mirror these in your host provider settings):

```bash
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Notes:

- ImageKit uploads require server-side auth parameters from
  `/api/auth/imagekit`.
- Keep `IMAGEKIT_PRIVATE_KEY` server-only.

## How to resolve conflicts without losing animations
Conflicts usually happen when multiple branches edit the same lines. To keep the
enhanced UX/animation version, prefer the "ours/current" side for these files:

- `app/globals.css` (animation keyframes and focus-visible styles)
- `app/page.tsx` (hero chips, skeleton loaders, cart bump animation, offline
  banner)
- `components/ProductCard.tsx` (status badges and consistent card sizing)
- `app/layout.tsx` (SEO metadata, theme color, and icons)

### Safe conflict resolution checklist
1. **Inspect conflicts**: `git status` and open the conflicted file.
2. **Pick the enhanced variant**: keep the codex/feature-rich blocks for the
   files listed above.
3. **Remove conflict markers** and save the file.
4. **Search for leftovers**: `rg -n "<<<<<<<|=======|>>>>>>>"`.
5. **Test locally**: `npm install` then `npm run dev` or `npm run build`.
