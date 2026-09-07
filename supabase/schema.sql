-- ====================================================================
-- HAJZY FULL DATABASE SETUP & PRODUCTION RLS POLICIES
-- إعداد قاعدة البيانات بالكامل وتطبيق سياسات الأمان الصارمة لتطبيق حجزي
-- ====================================================================

create extension if not exists pgcrypto;

-- 1. إنشاء الجداول الأساسية إذا لم تكن موجودة (Create Tables)
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

-- 2. دوال التحديث والمؤشرات (Triggers & Indexes)
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

create trigger profiles_set_updated_at before update on profiles for each row execute function set_updated_at();
create trigger properties_set_updated_at before update on properties for each row execute function set_updated_at();
create trigger bookings_set_updated_at before update on bookings for each row execute function set_updated_at();
create trigger payment_attempts_set_updated_at before update on payment_attempts for each row execute function set_updated_at();

create index if not exists idx_properties_city on properties(city);
create index if not exists idx_properties_owner on properties(ownerId);
create index if not exists idx_bookings_user on bookings(userId);
create index if not exists idx_bookings_property on bookings(propertyId);
create index if not exists idx_chat_property on chat_messages(propertyId);

-- 3. تفعيل حماية RLS على جميع الجداول (Enable Row Level Security)
alter table profiles enable row level security;
alter table properties enable row level security;
alter table bookings enable row level security;
alter table favorites enable row level security;
alter table chat_messages enable row level security;
alter table payment_attempts enable row level security;

-- 4. إزالة السياسات القديمة إن وجدت (Clean up old policies)
drop policy if exists "profiles_read_all" on profiles;
drop policy if exists "profiles_write_all" on profiles;
drop policy if exists "profiles_update_all" on profiles;
drop policy if exists "profiles_select_public" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;

drop policy if exists "properties_read_all" on properties;
drop policy if exists "properties_write_all" on properties;
drop policy if exists "properties_update_all" on properties;
drop policy if exists "properties_delete_all" on properties;
drop policy if exists "properties_select_public" on properties;
drop policy if exists "properties_insert_owner" on properties;
drop policy if exists "properties_update_owner" on properties;
drop policy if exists "properties_delete_owner" on properties;

drop policy if exists "bookings_read_all" on bookings;
drop policy if exists "bookings_write_all" on bookings;
drop policy if exists "bookings_update_all" on bookings;
drop policy if exists "bookings_delete_all" on bookings;
drop policy if exists "bookings_select_participant_only" on bookings;
drop policy if exists "bookings_insert_own" on bookings;
drop policy if exists "bookings_update_participant_only" on bookings;
drop policy if exists "bookings_delete_own_or_owner" on bookings;

drop policy if exists "favorites_read_all" on favorites;
drop policy if exists "favorites_write_all" on favorites;
drop policy if exists "favorites_delete_all" on favorites;
drop policy if exists "favorites_select_own" on favorites;
drop policy if exists "favorites_insert_own" on favorites;
drop policy if exists "favorites_delete_own" on favorites;

drop policy if exists "chat_read_all" on chat_messages;
drop policy if exists "chat_insert_all" on chat_messages;
drop policy if exists "chat_select_authenticated" on chat_messages;
drop policy if exists "chat_insert_authenticated" on chat_messages;

drop policy if exists "payments_read_all" on payment_attempts;
drop policy if exists "payments_write_all" on payment_attempts;
drop policy if exists "payments_update_all" on payment_attempts;
drop policy if exists "payments_select_own" on payment_attempts;
drop policy if exists "payments_insert_authenticated" on payment_attempts;

-- 5. تطبيق السياسات الآمنة الصارمة (Apply Production Policies)

-- أ. جدول العقارات (Properties): القراءة للجميع، والإضافة والتعديل والحذف مقيدة لصاحب العقار فقط
create policy "properties_select_public"
on properties for select
using (true);

create policy "properties_insert_owner"
on properties for insert
with check (
  auth.uid() is not null and (
    ownerId = auth.uid()::text or ownerId is null
  )
);

create policy "properties_update_owner"
on properties for update
using (
  auth.uid() is not null and ownerId = auth.uid()::text
)
with check (
  auth.uid() is not null and ownerId = auth.uid()::text
);

create policy "properties_delete_owner"
on properties for delete
using (
  auth.uid() is not null and ownerId = auth.uid()::text
);

-- ب. جدول الحجوزات (Bookings): لصاحب الحجز أو مالك العقار فقط
create policy "bookings_select_participant_only"
on bookings for select
using (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (
      select 1 from properties 
      where properties.id = bookings.propertyId 
      and properties.ownerId = auth.uid()::text
    )
  )
);

create policy "bookings_insert_own"
on bookings for insert
with check (
  auth.uid() is not null and (
    userId = auth.uid()::text or userId is null
  )
);

create policy "bookings_update_participant_only"
on bookings for update
using (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (
      select 1 from properties 
      where properties.id = bookings.propertyId 
      and properties.ownerId = auth.uid()::text
    )
  )
)
with check (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (
      select 1 from properties 
      where properties.id = bookings.propertyId 
      and properties.ownerId = auth.uid()::text
    )
  )
);

create policy "bookings_delete_own_or_owner"
on bookings for delete
using (
  auth.uid() is not null and (
    userId = auth.uid()::text
    or exists (
      select 1 from properties 
      where properties.id = bookings.propertyId 
      and properties.ownerId = auth.uid()::text
    )
  )
);

-- ج. جدول الملفات الشخصية (Profiles)
create policy "profiles_select_public"
on profiles for select
using (true);

create policy "profiles_insert_own"
on profiles for insert
with check (
  auth.uid() is not null and id = auth.uid()::text
);

create policy "profiles_update_own"
on profiles for update
using (
  auth.uid() is not null and id = auth.uid()::text
)
with check (
  auth.uid() is not null and id = auth.uid()::text
);

-- د. جدول المفضلة (Favorites)
create policy "favorites_select_own"
on favorites for select
using (
  auth.uid() is not null and userId = auth.uid()::text
);

create policy "favorites_insert_own"
on favorites for insert
with check (
  auth.uid() is not null and userId = auth.uid()::text
);

create policy "favorites_delete_own"
on favorites for delete
using (
  auth.uid() is not null and userId = auth.uid()::text
);

-- هـ. جدول المحادثات (Chat Messages)
create policy "chat_select_authenticated"
on chat_messages for select
using (auth.uid() is not null);

create policy "chat_insert_authenticated"
on chat_messages for insert
with check (auth.uid() is not null);

-- و. جدول محاولات الدفع (Payment Attempts)
create policy "payments_select_own"
on payment_attempts for select
using (
  auth.uid() is not null and exists (
    select 1 from bookings 
    where bookings.id = payment_attempts.bookingId 
    and bookings.userId = auth.uid()::text
  )
);

create policy "payments_insert_authenticated"
on payment_attempts for insert
with check (auth.uid() is not null);

-- 6. بيانات تجريبية أولية (Seed Data)
insert into profiles (id, name, email, role)
values
  ('owner-demo', 'مالك تجريبي', 'owner@hajzy.com', 'owner'),
  ('demo-user', 'مستخدم تجريبي', 'user@hajzy.com', 'user')
on conflict (id) do nothing;
