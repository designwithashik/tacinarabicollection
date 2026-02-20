# tacinarabicollection

Mobile-first e-commerce storefront with WhatsApp checkout and a Supabase-backed admin inventory.

## Environment setup

Create `.env.local` (and mirror these in Vercel Project Settings):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

- Platform: **Vercel**
- Build command: `npm run build`
- Start command: `npm run start`

## Notes

- Product catalog data is read from the Supabase `products` table.
- Admin image uploads use Supabase Storage bucket: `product-images`.
