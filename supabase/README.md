# Norvilah Cakes -- Supabase backend, phase 1

This folder has the database schema for the backend. It does **not**
change anything on the live site yet -- the Next.js app still reads
from `data/products.ts` etc. until the next step wires it up to read
from this database instead.

## What to do with `schema.sql`

1. Go to [supabase.com](https://supabase.com), create a free project
   (pick any name/region, e.g. `norvilah-cakes`).
2. In the project, open **SQL Editor** in the left sidebar -> **New query**.
3. Paste the entire contents of `schema.sql` and click **Run**.
4. That's it. It creates every table (profiles, categories, products,
   orders, inquiries, conversations/messages, etc.), sets up the
   security rules so customers only ever see their own orders and
   messages, and seeds the catalogue with what's already live on the
   site.

It's safe to run more than once -- every `create` is written to skip
quietly if it already exists.

## Making yourself an admin

There's no separate admin signup. Once the site's own sign-up form is
wired to this database (the next piece of work), sign up on the site
normally with your own email, then run this once in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## What I'll need from you to wire the app to this database

Back in the Supabase dashboard, under **Project Settings -> API**,
there are two values the Next.js app needs:

- **Project URL**
- **`anon` public API key**

Send me those two (they're safe to share -- they only grant what the
row-level-security rules above allow, nothing more) and I'll connect
sign-up/login and start building the account and admin screens
against this schema.

## What's intentionally not in here yet

- A homepage-content table (for a lightweight CMS over the hero text,
  etc.) and a media-library table -- straightforward additions, added
  once the admin screens that use them exist.
- Anything about payments -- orders track `payment_status` and an
  uploaded receipt URL for now, matching the "upload your receipt,
  admin marks received" flow described, not a live payment gateway.
