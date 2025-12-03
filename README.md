# Beracah Cafe

## Lalamove delivery setup

The storefront now runs on Next.js and ships a local API route under `app/api/lalamove/[action]/route.ts`. Set the following environment variables (e.g., in `.env`) before running so the client, server, and Delivery proxy all have what they need:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_LALAMOVE_FUNCTION_URL=/api/lalamove
LALAMOVE_API_KEY=pk_xxx
LALAMOVE_API_SECRET=sk_xxx
```

`NEXT_PUBLIC_LALAMOVE_FUNCTION_URL` can also point at your deployed Supabase Edge Function if you prefer `supabase/functions/lalamove`—just make sure the proxy URL still exposes `/quote` and `/order`. The server-only `LALAMOVE_*` secrets stay hidden from the browser. Delivery metadata and store settings stay editable via the Site Settings view in the admin dashboard.
