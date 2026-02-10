# tacinarabicollection

Mobile-first e-commerce storefront with WhatsApp checkout, client-side cart
persistence, and an optional admin panel for inventory and orders.

## Refinement phases
Use these phases to evaluate and improve changes without losing UX features:

1. **Baseline**: Verify the app runs and the core flows work (add to cart,
   checkout, WhatsApp redirect).
2. **UX polish**: Check animations, skeleton loaders, and micro-interactions
   (hero chips, cart bump, toast notifications).
3. **Content density**: Confirm hero copy, trust blocks, and footer content are
   balanced for mobile readability.
4. **Admin tooling**: Validate admin inventory edits and order logging if you
   enable those routes.
5. **Performance**: Run `next build` and verify images, fonts, and CSS load as
   expected in production.

## Environment setup for persistent admin inventory

Create `.env.local` (and mirror these in Vercel project settings):

```bash
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_rest_token
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

If you need to compare sides before choosing, use:

```bash
git checkout --theirs path/to/file   # incoming changes
git checkout --ours path/to/file     # current branch changes
```

Then reopen the file to confirm the final output includes your animations and
UX enhancements.
