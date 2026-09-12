-- Norvilah Cakes -- backend phase 1 schema
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor ->
-- New query -> paste this whole file -> Run) on a fresh project.
-- It is written to be safe to re-run: every CREATE uses IF NOT EXISTS
-- and every policy is dropped before being recreated.
--
-- What this does NOT do yet:
--   - It does not touch the Next.js app. The site keeps reading from
--     data/products.ts etc. until that's wired up as its own step.
--   - It does not create a homepage-content or media-library table.
--     Those are real but smaller pieces, better added once the admin
--     screens that use them are actually being built.
--   - It does not create the admin dashboard UI, the account pages,
--     or any auth screens. This is the data layer those will read
--     from and write to.
--
-- After running this, the ONE manual step outside of SQL: create your
-- own admin login by signing up normally on the site once auth is
-- wired up, then run:
--   update public.profiles set role = 'admin' where email = 'you@example.com';

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. PROFILES
-- One row per person, keyed to Supabase's built-in auth.users.
-- Created automatically the moment someone signs up (see trigger
-- below), so the app never has to manage this table directly.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  location text,
  how_heard text,               -- "How did you hear about Norvilah?"
  preferences text[] default '{}',  -- e.g. {"Cakes","Parfaits"}
  about text,                    -- short "about me" on their profile
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up through
-- Supabase Auth, pulling name/phone/etc. out of the signup form's
-- metadata (the Next.js signup call passes these as `options.data`).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, location, how_heard, preferences)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'location',
    new.raw_user_meta_data ->> 'how_heard',
    coalesce(
      (select array_agg(value) from jsonb_array_elements_text(new.raw_user_meta_data -> 'preferences')),
      '{}'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 2. CATEGORIES
-- =========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  blurb text,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 3. PRODUCTS
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  description text,
  ingredients text[] default '{}',
  benefits text[] default '{}',   -- "Good to Know" -- never medical claims
  image_url text,
  price_naira integer not null,   -- base price, or lowest variant price
  active boolean not null default true,   -- OFF = hidden from the site, not deleted
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,            -- "6 inch", "Box of 6"
  price_naira integer not null,
  sort_order int not null default 0
);

-- =========================================================
-- 4. DELIVERY LOCATIONS
-- =========================================================
create table if not exists public.delivery_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_naira integer not null,
  active boolean not null default true,
  sort_order int not null default 0
);

-- =========================================================
-- 5. ORDERS
-- =========================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,   -- e.g. NV00123, generate in app code
  customer_id uuid references public.profiles (id) on delete set null,
  channel text not null default 'website' check (channel in ('website', 'whatsapp')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_location_id uuid references public.delivery_locations (id) on delete set null,
  delivery_address text,
  subtotal_naira integer not null default 0,
  delivery_fee_naira integer not null default 0,
  total_naira integer not null default 0,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'awaiting_confirmation', 'paid')),
  receipt_url text,     -- customer-uploaded proof of payment (Supabase Storage URL)
  customer_name text,
  notes text,           -- additional info / special delivery details from the customer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- snapshots so an order still reads correctly even if the product is
  -- later renamed or its price changes
  product_name text not null,
  variant_label text,
  unit_price_naira integer not null,
  quantity integer not null default 1,
  line_total_naira integer not null
);

-- =========================================================
-- 6. FAQS
-- =========================================================
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  sort_order int not null default 0
);

-- =========================================================
-- 7. EVENT / CATERING INQUIRIES
-- Separate from orders -- "I need catering for 80 people" is not a
-- cart checkout.
-- =========================================================
create table if not exists public.event_inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  occasion text,          -- birthday / date-night / party / corporate-event / ...
  event_date date,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

-- =========================================================
-- 8. CONVERSATIONS + MESSAGES
-- The in-account chat. Optionally tied to an inquiry or an order so
-- the conversation carries context.
-- =========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  related_inquiry_id uuid references public.event_inquiries (id) on delete set null,
  related_order_id uuid references public.orders (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'admin')),
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 9. SETTINGS
-- One-row table (id is always `true`, so a second row is impossible)
-- holding site-wide toggles the admin controls -- e.g. whether the
-- website's own checkout is accepting orders right now, and whether
-- the WhatsApp order channel is turned on, so the business can run
-- either or both.
-- =========================================================
create table if not exists public.settings (
  id boolean primary key default true,
  website_ordering_enabled boolean not null default true,
  whatsapp_ordering_enabled boolean not null default true,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

-- =========================================================
-- 10. ROW LEVEL SECURITY
-- Public catalogue data (categories/products/faqs/delivery) is
-- readable by anyone, writable only by admins. Personal data (orders,
-- inquiries, conversations) is readable/writable only by its owner or
-- an admin.
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.delivery_locations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.faqs enable row level security;
alter table public.event_inquiries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.settings enable row level security;

-- profiles: everyone can read their own row and update it; admins see all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- categories / products / product_variants / delivery_locations / faqs:
-- public read of active rows, admins read+write everything
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (active or public.is_admin());
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (active or public.is_admin());
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
  for select using (true);
drop policy if exists "variants_admin_write" on public.product_variants;
create policy "variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "delivery_public_read" on public.delivery_locations;
create policy "delivery_public_read" on public.delivery_locations
  for select using (active or public.is_admin());
drop policy if exists "delivery_admin_write" on public.delivery_locations;
create policy "delivery_admin_write" on public.delivery_locations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs_public_read" on public.faqs;
create policy "faqs_public_read" on public.faqs
  for select using (active or public.is_admin());
drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());

-- orders / order_items: customers see + create their own, admins see + manage all
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (customer_id = auth.uid());
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

drop policy if exists "order_items_select_via_order" on public.order_items;
create policy "order_items_select_via_order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "order_items_insert_via_order" on public.order_items;
create policy "order_items_insert_via_order" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

-- event_inquiries: a signed-in customer can create + read their own;
-- admins see + manage all
drop policy if exists "inquiries_select_own_or_admin" on public.event_inquiries;
create policy "inquiries_select_own_or_admin" on public.event_inquiries
  for select using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "inquiries_insert_own" on public.event_inquiries;
create policy "inquiries_insert_own" on public.event_inquiries
  for insert with check (customer_id = auth.uid() or public.is_admin());
drop policy if exists "inquiries_update_admin" on public.event_inquiries;
create policy "inquiries_update_admin" on public.event_inquiries
  for update using (public.is_admin());

-- conversations / messages: customer sees + uses their own; admin sees + uses all
drop policy if exists "conversations_select_own_or_admin" on public.conversations;
create policy "conversations_select_own_or_admin" on public.conversations
  for select using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations
  for insert with check (customer_id = auth.uid() or public.is_admin());
drop policy if exists "conversations_update_own_or_admin" on public.conversations;
create policy "conversations_update_own_or_admin" on public.conversations
  for update using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "messages_select_via_conversation" on public.messages;
create policy "messages_select_via_conversation" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.customer_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "messages_insert_via_conversation" on public.messages;
create policy "messages_insert_via_conversation" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.customer_id = auth.uid() or public.is_admin())
    )
  );

-- settings: anyone can read (the site needs to know which order
-- channels are live before showing checkout options), only admins
-- can change it
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select using (true);
drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- 11. SEED DATA
-- Mirrors what's currently hardcoded in data/categories.ts and
-- data/products.ts, so the database starts in sync with the live
-- site. Prices are still the placeholders flagged there.
-- =========================================================
insert into public.categories (slug, name, blurb, image_url, sort_order) values
  ('cakes', 'Cakes', 'Celebration cakes, layered and finished by hand.', '/products/cakes.jpg', 1),
  ('cupcakes', 'Cupcakes', 'Single treats or boxed for sharing.', '/products/cupcakes.jpg', 2),
  ('parfaits', 'Parfaits', 'Layered fruit, cream and crunch.', '/products/parfaits.jpg', 3),
  ('waffles', 'Waffles', 'Warm, golden, made to order.', '/products/waffles.jpg', 4),
  ('meat-pies', 'Meat Pies', 'Flaky pastry, savoury filling.', '/products/meat-pies.jpg', 5),
  ('banana-bread', 'Banana Bread', 'Moist, dense, and just sweet enough.', '/products/banana-bread.jpg', 6),
  ('milky-yoghurt', 'Milky Yoghurt', 'Cool, creamy, and refreshing.', '/products/milky-yoghurt.jpg', 7),
  ('greek-yoghurt', 'Greek Yoghurt', 'Thick, tangy, and protein-rich.', '/products/greek-yoghurt.jpg', 8),
  ('small-chops', 'Small Chops', 'A mixed tray for sharing.', '/products/small-chops.jpg', 9),
  ('granola', 'Granola', 'Toasted, honeyed, and crunchy.', '/products/granola.jpg', 10),
  ('coconut-bread', 'Coconut Bread', 'Soft, moist, and delicately coconut.', '/products/coconut-bread.jpg', 11)
on conflict (slug) do nothing;

insert into public.products (slug, name, category_id, description, ingredients, benefits, image_url, price_naira, featured) values
  ('celebration-cake', 'Celebration Cake', (select id from public.categories where slug = 'cakes'),
    'Moist, rich and beautifully crafted for birthdays, celebrations or simply treating yourself.',
    array['Flour','Eggs','Butter','Milk','Sugar'],
    array['A delightful treat made for special moments and everyday celebrations.'],
    '/products/cakes.jpg', 25000, true),
  ('cupcake', 'Cupcake', (select id from public.categories where slug = 'cupcakes'),
    'Soft, fluffy cupcakes finished with creamy frosting and made for little moments of happiness.',
    array['Flour','Eggs','Milk','Butter','Sugar','Frosting'],
    array['A convenient individual treat that''s perfect for sharing or enjoying on your own.'],
    '/products/cupcakes.jpg', 1200, false),
  ('strawberry-parfait', 'Strawberry Parfait', (select id from public.categories where slug = 'parfaits'),
    'Creamy yoghurt layered with fresh fruit, crunchy toppings and delicious goodness in every spoonful.',
    '{}', '{}', '/products/parfaits.jpg', 3500, true),
  ('mixed-berry-parfait', 'Mixed Berry Parfait', (select id from public.categories where slug = 'parfaits'),
    'Creamy yoghurt layered with fresh fruit, crunchy toppings and delicious goodness in every spoonful.',
    '{}', '{}', '/products/parfaits.jpg', 4000, false),
  ('greek-yoghurt-parfait', 'Greek Yoghurt Parfait', (select id from public.categories where slug = 'parfaits'),
    'Creamy yoghurt layered with fresh fruit, crunchy toppings and delicious goodness in every spoonful.',
    '{}', '{}', '/products/parfaits.jpg', 4500, false),
  ('waffles', 'Waffles, Plate of 3', (select id from public.categories where slug = 'waffles'),
    'Crisp on the outside, soft and fluffy inside, made for a delicious little treat.',
    array['Flour','Eggs','Milk','Butter','Vanilla'],
    array['A satisfying source of energy with a comforting, freshly made taste.'],
    '/products/waffles.jpg', 4000, true),
  ('meat-pie', 'Meat Pie', (select id from public.categories where slug = 'meat-pies'),
    'Flaky pastry with a savoury, well-seasoned filling.', '{}', '{}', '/products/meat-pies.jpg', 1000, false),
  ('banana-bread', 'Banana Bread Loaf', (select id from public.categories where slug = 'banana-bread'),
    'Moist banana bread, dense and just sweet enough.', '{}', '{}', '/products/banana-bread.jpg', 6500, false),
  ('milky-yoghurt', 'Milky Yoghurt, 500ml', (select id from public.categories where slug = 'milky-yoghurt'),
    'Smooth, creamy and refreshing, made for an easy everyday indulgence.',
    array['Yoghurt','Milk','Natural sweeteners'],
    array['A dairy-based option that provides protein and calcium.'],
    '/products/milky-yoghurt.jpg', 2500, false),
  ('greek-yoghurt', 'Greek Yoghurt, 500ml', (select id from public.categories where slug = 'greek-yoghurt'),
    'Thick, tangy Greek yoghurt, made in house.', '{}', '{}', '/products/greek-yoghurt.jpg', 3000, false),
  ('granola', 'Granola, 250g', (select id from public.categories where slug = 'granola'),
    'Toasted, honeyed granola, great over yoghurt or parfait.', '{}', '{}', '/products/granola.jpg', 5500, false),
  ('small-chops', 'Small Chops Tray', (select id from public.categories where slug = 'small-chops'),
    'A mixed tray of savoury small chops, perfect for events.', '{}', '{}', '/products/small-chops.jpg', 15000, false),
  ('coconut-bread', 'Coconut Bread Loaf', (select id from public.categories where slug = 'coconut-bread'),
    'Soft, moist and delicately flavoured with coconut. A simple treat that''s hard to resist.',
    array['Flour','Coconut','Eggs','Milk','Butter'],
    array['Contains coconut and provides a satisfying, energy-rich snack.'],
    '/products/coconut-bread.jpg', 6500, false)
on conflict (slug) do nothing;

insert into public.product_variants (product_id, label, price_naira, sort_order) values
  ((select id from public.products where slug = 'celebration-cake'), '6 inch', 25000, 1),
  ((select id from public.products where slug = 'celebration-cake'), '8 inch', 38000, 2),
  ((select id from public.products where slug = 'celebration-cake'), '10 inch', 55000, 3),
  ((select id from public.products where slug = 'cupcake'), 'Single', 1200, 1),
  ((select id from public.products where slug = 'cupcake'), 'Box of 6', 7000, 2),
  ((select id from public.products where slug = 'cupcake'), 'Box of 12', 13000, 3),
  ((select id from public.products where slug = 'meat-pie'), 'Single', 1000, 1),
  ((select id from public.products where slug = 'meat-pie'), 'Box of 6', 5500, 2)
on conflict do nothing;

insert into public.settings (id) values (true)
on conflict do nothing;

insert into public.delivery_locations (name, fee_naira, sort_order) values
  ('Egbeda', 2200, 1),
  ('Ikotun', 2700, 2),
  ('Ijegun', 3000, 3)
on conflict do nothing;

insert into public.faqs (question, answer, sort_order) values
  ('How far in advance should I place an order?', 'We recommend ordering at least 48 hours ahead for most treats, and a week or more for celebration cakes and large event orders.', 1),
  ('Where do you deliver?', 'We deliver across Lagos. Egbeda is ₦2,200, Ikotun is ₦2,700, and Ijegun is ₦3,000. Other areas are available on request.', 2),
  ('Do you cater for events?', 'Yes. We cater for birthdays, parties and corporate events, with custom menus and quantities built around your event.', 3),
  ('What payment methods do you accept?', 'We currently accept bank transfer, with more payment options coming as the site grows.', 4),
  ('Can I make a custom order?', 'Yes. Message us on WhatsApp with what you have in mind, and we will work out the details together.', 5),
  ('Can I pick up my order?', 'Yes, pickup is available. We will share the address and a pickup time once your order is confirmed.', 6)
on conflict do nothing;

-- =========================================================
-- 12. RECEIPTS STORAGE
-- A private bucket for the payment receipt a customer uploads when
-- checking out on the website. Each file lives at
-- "<customer_id>/<order_number>.<ext>" so the RLS policies below can
-- tell whose file is whose from the path alone.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_owner_read" on storage.objects;
create policy "receipts_owner_read" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

drop policy if exists "receipts_owner_upload" on storage.objects;
create policy "receipts_owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- 13. PRODUCT IMAGES STORAGE
-- A public bucket admins upload to when replacing a product's photo
-- from Admin > Products. Public so the storefront can render the
-- photo directly from its URL; only admins can add/replace/remove files.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- =========================================================
-- 14. AVATARS STORAGE
-- A public bucket any signed-in user (customer or admin) can upload
-- their own profile photo to, at "<user_id>/<filename>" so RLS can
-- tell whose file is whose from the path alone.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- 15. SAVED ADDRESSES
-- A customer's own address book, used at checkout so repeat orders
-- don't need retyping. Independent of delivery_locations (the fee
-- zones) -- this is the street address itself.
-- =========================================================
create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.saved_addresses enable row level security;

drop policy if exists "saved_addresses_owner_all" on public.saved_addresses;
create policy "saved_addresses_owner_all" on public.saved_addresses
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- =========================================================
-- 16. FAVOURITES
-- A customer's saved/wishlisted products, keyed by product slug (not
-- the products table id) so a favourite still makes sense even for
-- the static catalogue products that only exist in data/products.ts.
-- =========================================================
create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_slug text not null,
  created_at timestamptz not null default now(),
  unique (customer_id, product_slug)
);

alter table public.favourites enable row level security;

drop policy if exists "favourites_owner_all" on public.favourites;
create policy "favourites_owner_all" on public.favourites
  for all using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

-- =========================================================
-- 17. MESSAGES: MARK AS READ
-- The messages table had no update policy, so a customer or admin
-- opening a thread could never mark the other side's messages read
-- (needed for the unread-count notification bell).
-- =========================================================
drop policy if exists "messages_update_via_conversation" on public.messages;
create policy "messages_update_via_conversation" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.customer_id = auth.uid() or public.is_admin())
    )
  );

-- =========================================================
-- 18. ORDERS + INQUIRIES: "NEW" / VIEWED TRACKING
-- Lets the admin list pages show a red "New" badge on a row until an
-- admin opens it, same idea as the messages unread badge.
-- =========================================================
alter table public.orders add column if not exists viewed_at timestamptz;
alter table public.event_inquiries add column if not exists viewed_at timestamptz;

-- =========================================================
-- 19. ANNOUNCEMENTS (BROADCASTS)
-- A short-lived popup the admin can publish (title, description, an
-- optional image, and a window of time to show it) that greets anyone
-- who visits the site while it's active -- e.g. a sale, a holiday
-- schedule change, a new product launch.
-- =========================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

drop policy if exists "announcements_public_read" on public.announcements;
create policy "announcements_public_read" on public.announcements
  for select using (true);

drop policy if exists "announcements_admin_write" on public.announcements;
create policy "announcements_admin_write" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('announcement-images', 'announcement-images', true)
on conflict (id) do nothing;

drop policy if exists "announcement_images_public_read" on storage.objects;
create policy "announcement_images_public_read" on storage.objects
  for select using (bucket_id = 'announcement-images');

drop policy if exists "announcement_images_admin_write" on storage.objects;
create policy "announcement_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'announcement-images' and public.is_admin());

drop policy if exists "announcement_images_admin_update" on storage.objects;
create policy "announcement_images_admin_update" on storage.objects
  for update using (bucket_id = 'announcement-images' and public.is_admin());

drop policy if exists "announcement_images_admin_delete" on storage.objects;
create policy "announcement_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'announcement-images' and public.is_admin());

-- =========================================================
-- 20. PRODUCT SALES
-- Admin can flag a product on_sale and set a single discount
-- percentage; the storefront calculates the discounted price from it
-- at render time (base price and every variant), so there's only one
-- number to keep in sync per product.
-- =========================================================
alter table public.products add column if not exists on_sale boolean not null default false;
alter table public.products add column if not exists discount_percent integer;

-- =========================================================
-- 21. WEBSITE PAYMENT METHOD
-- One admin-controlled switch decides how ALL website orders pay --
-- either the existing bank-transfer-and-upload-a-receipt flow, or
-- Paystack card payment -- rather than showing customers both options
-- side by side, which just invites confusion over which to pick.
-- WhatsApp orders are unaffected either way.
-- =========================================================
alter table public.settings add column if not exists website_payment_method text
  not null default 'bank_transfer'
  check (website_payment_method in ('bank_transfer', 'paystack'));

-- The address EmailJS admin alerts (new order / new inquiry) are sent
-- to. EmailJS templates read this via a {{to_email}} variable in the
-- template's own "To Email" field -- it doesn't work as a fixed
-- address typed into the template, since that can't be set from code.
alter table public.settings add column if not exists notification_email text;

-- =========================================================
-- 22. ORDER PAYMENT METHOD
-- channel (website/whatsapp) says which door the order came through;
-- payment_method says how it was actually paid, since a website order
-- can now be either a manual bank transfer or a Paystack card charge.
-- =========================================================
alter table public.orders add column if not exists payment_method text
  not null default 'bank_transfer'
  check (payment_method in ('bank_transfer', 'card'));

-- =========================================================
-- 23. PRODUCT DISPLAY ORDER
-- Lets admin drag products into whatever order they should appear on
-- the menu, same idea as categories.sort_order.
-- =========================================================
alter table public.products add column if not exists sort_order integer not null default 0;

-- =========================================================
-- 24. TESTIMONIALS
-- Admin-managed reviews shown in the "Cravings approved" section on
-- the landing page -- previously a hardcoded placeholder list with no
-- admin control at all.
-- =========================================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials
  for select using (active or public.is_admin());
drop policy if exists "testimonials_admin_write" on public.testimonials;
create policy "testimonials_admin_write" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- 25. FIRST-LOGIN ONBOARDING TOUR
-- Tracks whether a customer has already seen the welcome walkthrough
-- on their account page, so it only shows once.
-- =========================================================
alter table public.profiles add column if not exists has_seen_onboarding boolean not null default false;

-- =========================================================
-- 26. NEW SIGN-UP NOTIFICATIONS (ADMIN)
-- Same "unviewed" pattern already used for orders and inquiries.
-- Backfill existing accounts as already-viewed so this doesn't flood
-- the admin bell with every account ever created the moment it ships --
-- only genuinely new sign-ups from here on show up as unread.
-- =========================================================
alter table public.profiles add column if not exists viewed_at timestamptz;
update public.profiles set viewed_at = created_at where viewed_at is null;

-- =========================================================
-- 27. PRICE LISTS
-- The landing-page "Norvilah Catalog" -- deliberately independent of
-- products/categories (its own image, its own line items) so a price
-- list can exist for anything Norvilah sells even if it doesn't match
-- a real ordering category one-to-one.
-- =========================================================
create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tagline text,
  image_url text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- One row per price line on a card. group_label clusters related lines
-- under a small subheading (e.g. "Mini Banana Bread" vs "Medium Banana
-- Bread") -- leave null for a flat list like Parfait sizes. contents is
-- the optional "what's included" detail for pack-style items (Small
-- Chops) -- leave null for a plain size/price line; the storefront only
-- shows the expandable "+" when it's actually filled in.
create table if not exists public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  group_label text,
  label text not null,
  price_naira integer not null,
  contents text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.price_lists enable row level security;
alter table public.price_list_items enable row level security;

drop policy if exists "price_lists_public_read" on public.price_lists;
create policy "price_lists_public_read" on public.price_lists
  for select using (active or public.is_admin());
drop policy if exists "price_lists_admin_write" on public.price_lists;
create policy "price_lists_admin_write" on public.price_lists
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "price_list_items_public_read" on public.price_list_items;
create policy "price_list_items_public_read" on public.price_list_items
  for select using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_id and (pl.active or public.is_admin())
    )
  );
drop policy if exists "price_list_items_admin_write" on public.price_list_items;
create policy "price_list_items_admin_write" on public.price_list_items
  for all using (public.is_admin()) with check (public.is_admin());
