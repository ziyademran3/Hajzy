-- ====================================================================
-- HAJZY PRODUCTION ROW-LEVEL SECURITY (RLS) POLICIES
-- تطبيق سياسات الأمان وحماية البيانات لتطبيق حجزي
-- ====================================================================
-- تعليمات التطبيق:
-- افتح لوحة تحكم Supabase -> اذهب إلى SQL Editor -> الصق الكود واضغط Run.
-- ====================================================================

-- 1. تفعيل حماية RLS على جميع الجداول
alter table if exists profiles enable row level security;
alter table if exists properties enable row level security;
alter table if exists bookings enable row level security;
alter table if exists favorites enable row level security;
alter table if exists chat_messages enable row level security;
alter table if exists payment_attempts enable row level security;

-- 2. إزالة السياسات التجريبية المفتوحة القديمة (Clean up old open policies)
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
drop policy if exists "bookings_select_own" on bookings;
drop policy if exists "bookings_insert_own" on bookings;
drop policy if exists "bookings_update_own" on bookings;
drop policy if exists "bookings_delete_own" on bookings;

drop policy if exists "favorites_read_all" on favorites;
drop policy if exists "favorites_write_all" on favorites;
drop policy if exists "favorites_delete_all" on favorites;
drop policy if exists "favorites_select_own" on favorites;
drop policy if exists "favorites_insert_own" on favorites;
drop policy if exists "favorites_delete_own" on favorites;

drop policy if exists "chat_read_all" on chat_messages;
drop policy if exists "chat_insert_all" on chat_messages;

drop policy if exists "payments_read_all" on payment_attempts;
drop policy if exists "payments_write_all" on payment_attempts;
drop policy if exists "payments_update_all" on payment_attempts;

-- ====================================================================
-- 3. تطبيق السياسات الآمنة الصارمة (Strict Secure Policies)
-- ====================================================================

-- --------------------------------------------------------------------
-- أ. جدول العقارات (Properties)
-- التصفح متاح للجميع، لكن الإضافة والتعديل والحذف مقيدة لصاحب العقار فقط
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- ب. جدول الحجوزات (Bookings)
-- لا يستطيع أي شخص رؤية الحجز إلا صاحب الحجز نفسه أو مالك العقار المحجوز
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- ج. جدول الملفات الشخصية (Profiles)
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- د. جدول المفضلة (Favorites)
-- كل مستخدم يصل لمفضلته الشخصية فقط
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- هـ. جدول المحادثات (Chat Messages)
-- مقصور على المستخدمين المسجلين
-- --------------------------------------------------------------------
create policy "chat_select_authenticated"
on chat_messages for select
using (auth.uid() is not null);

create policy "chat_insert_authenticated"
on chat_messages for insert
with check (auth.uid() is not null);

-- --------------------------------------------------------------------
-- و. جدول محاولات الدفع (Payment Attempts)
-- لا يرى محاولة الدفع إلا صاحب الحجز
-- --------------------------------------------------------------------
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
