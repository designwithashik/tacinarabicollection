# tacinarabicollection

Mobile-first e-commerce storefront with WhatsApp checkout and a Supabase-backed admin panel.

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase requirements

- Table: `products`
  - recommended columns: `id`, `name`, `price`, `image_url`, `created_at`
- Storage bucket: `product-images` (public)

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Deploy directly to Vercel. Make sure the two `NEXT_PUBLIC_SUPABASE_*` variables are set in the Vercel project settings.
