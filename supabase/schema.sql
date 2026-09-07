create extension if not exists pgcrypto;

create table if not exists profiles (
  id text primary key,
  name text not null,
  email text unique not null,
  role text not null default 'user',
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id text primary key,
  title text not null,
  location text not null,
  city text not null,
  priceValue integer not null default 0,
  currency text not null default 'EGP',
  rating numeric default 4.8,
  reviews integer default 0,
  image text,
  details jsonb not null default '[]'::jsonb,
  description text,
  amenities jsonb not null default '[]'::jsonb,
  ownerId text references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id text primary key,
  propertyId text not null references properties(id) on delete cascade,
  userId text references profiles(id),
  title text not null,
  location text,
  image text,
  checkIn text,
  checkOut text,
  guests integer default 1,
  total integer default 0,
  currency text default 'EGP',
  status text default 'confirmed',
  reference text,
  paymentMethod text default 'card',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  userId text not null references profiles(id) on delete cascade,
  propertyId text not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (userId, propertyId)
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  propertyId text not null references properties(id) on delete cascade,
  sender text not null default 'user',
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists payment_attempts (
  id uuid primary key default gen_random_uuid(),
  bookingId text,
  provider text not null default 'demo',
  status text not null default 'pending',
  amount integer default 0,
  currency text default 'EGP',
  paymentMethod text default 'card',
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
drop trigger if exists properties_set_updated_at on properties;
drop trigger if exists bookings_set_updated_at on bookings;
drop trigger if exists payment_attempts_set_updated_at on payment_attempts;

create trigger profiles_set_updated_at
before update on profiles
for each row
execute function set_updated_at();

create trigger properties_set_updated_at
before update on properties
for each row
execute function set_updated_at();

create trigger bookings_set_updated_at
before update on bookings
for each row
execute function set_updated_at();

create trigger payment_attempts_set_updated_at
before update on payment_attempts
for each row
execute function set_updated_at();

create index if not exists idx_properties_city on properties(city);
create index if not exists idx_properties_owner on properties(ownerId);
create index if not exists idx_bookings_user on bookings(userId);
create index if not exists idx_bookings_property on bookings(propertyId);
create index if not exists idx_chat_property on chat_messages(propertyId);

alter table profiles enable row level security;
alter table properties enable row level security;
alter table bookings enable row level security;
alter table favorites enable row level security;
alter table chat_messages enable row level security;
alter table payment_attempts enable row level security;

-- Secure Production Policies
create policy "profiles_select_public" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() is not null and id = auth.uid()::text);
create policy "profiles_update_own" on profiles for update using (auth.uid() is not null and id = auth.uid()::text) with check (auth.uid() is not null and id = auth.uid()::text);

create policy "properties_select_public" on properties for select using (true);
create policy "properties_insert_owner" on properties for insert with check (auth.uid() is not null and (ownerId = auth.uid()::text or ownerId is null));
create policy "properties_update_owner" on properties for update using (auth.uid() is not null and ownerId = auth.uid()::text) with check (auth.uid() is not null and ownerId = auth.uid()::text);
create policy "properties_delete_owner" on properties for delete using (auth.uid() is not null and ownerId = auth.uid()::text);

create policy "bookings_select_participant_only" on bookings for select using (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (select 1 from properties where properties.id = bookings.propertyId and properties.ownerId = auth.uid()::text)
  )
);
create policy "bookings_insert_own" on bookings for insert with check (
  auth.uid() is not null and (userId = auth.uid()::text or userId is null)
);
create policy "bookings_update_participant_only" on bookings for update using (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (select 1 from properties where properties.id = bookings.propertyId and properties.ownerId = auth.uid()::text)
  )
) with check (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (select 1 from properties where properties.id = bookings.propertyId and properties.ownerId = auth.uid()::text)
  )
);
create policy "bookings_delete_own_or_owner" on bookings for delete using (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (select 1 from properties where properties.id = bookings.propertyId and properties.ownerId = auth.uid()::text)
  )
);

create policy "favorites_select_own" on favorites for select using (auth.uid() is not null and userId = auth.uid()::text);
create policy "favorites_insert_own" on favorites for insert with check (auth.uid() is not null and userId = auth.uid()::text);
create policy "favorites_delete_own" on favorites for delete using (auth.uid() is not null and userId = auth.uid()::text);

create policy "chat_select_authenticated" on chat_messages for select using (auth.uid() is not null);
create policy "chat_insert_authenticated" on chat_messages for insert with check (auth.uid() is not null);

create policy "payments_select_own" on payment_attempts for select using (
  auth.uid() is not null and exists (
    select 1 from bookings where bookings.id = payment_attempts.bookingId and bookings.userId = auth.uid()::text
  )
);
create policy "payments_insert_authenticated" on payment_attempts for insert with check (auth.uid() is not null);

insert into profiles (id, name, email, role)
values
  ('owner-demo', 'مالك تجريبي', 'owner@stitch.com', 'owner'),
  ('demo-user', 'مستخدم تجريبي', 'user@stitch.com', 'user')
on conflict (id) do nothing;

insert into properties (
  id, title, location, city, priceValue, currency, rating, reviews, image, details, description, amenities, ownerId
)
values
  (
    'alex-vista',
    'شقة فيستا الإسكندرية',
    'المنتزه، الإسكندرية',
    'الإسكندرية',
    4200,
    'EGP',
    4.9,
    142,
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    '[]'::jsonb,
    'شقة عصرية بجوار الساحل، مناسبة للعائلات والرحلات الطويلة في مدينة الإسكندرية.',
    '[]'::jsonb,
    'owner-demo'
  ),
  (
    'cairo-lounge',
    'جناح القاهرة الهادئ',
    'مدينة نصر، القاهرة',
    'القاهرة',
    3600,
    'EGP',
    4.7,
    98,
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    '[]'::jsonb,
    'جناح فاخر في قلب القاهرة مع ديكور أنيق ومساحة واسعة للراحة والهدوء.',
    '[]'::jsonb,
    'owner-demo'
  ),
  (
    'giza-sky',
    'شقة جيزة سكاي',
    'الشيخ زايد، الجيزة',
    'الجيزة',
    3900,
    'EGP',
    4.8,
    120,
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    '[]'::jsonb,
    'شقة أنيقة في الجيزة، مناسبة للرحلات العائلية أو الإقامات الطويلة.',
    '[]'::jsonb,
    'owner-demo'
  )
on conflict (id) do nothing;

insert into bookings (
  id, propertyId, userId, title, location, image, checkIn, checkOut, guests, total, currency, status, reference, paymentMethod
)
values (
  'booking-1',
  'alex-vista',
  'demo-user',
  'شقة فيستا الإسكندرية',
  'المنتزه، الإسكندرية',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  '2026-10-15',
  '2026-10-20',
  2,
  21000,
  'EGP',
  'confirmed',
  '#REF-11001',
  'card'
)
on conflict (id) do nothing;

-- Production note:
-- These policies are intentionally open for local/demo setup.
-- For a live app, tighten access by role and ownership before deployment.
