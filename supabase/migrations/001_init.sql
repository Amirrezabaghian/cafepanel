-- ═══════════════════════════════════════════════════════════════════
-- کافه‌پنل — Supabase Database Schema
-- فقط این فایل رو در SQL Editor سوپابیس اجرا کن
-- ═══════════════════════════════════════════════════════════════════

-- ── کاربران ─────────────────────────────────────────────────────────
create table if not exists users (
  id        bigserial primary key,
  name      text not null,
  username  text not null unique,
  password  text not null,
  role      text not null default 'باریستا'
);

-- ── مواد اولیه ──────────────────────────────────────────────────────
create table if not exists ingredients (
  id          bigserial primary key,
  name        text not null,
  category    text not null default 'سایر',
  unit_pair   text not null default 'کیلوگرم/گرم',
  mac_unit    text not null default 'کیلوگرم',
  mic_unit    text not null default 'گرم',
  rate        numeric not null default 1000,
  recipe_unit text not null default 'گرم',
  stock       numeric not null default 0,
  max_stock   numeric not null default 0,
  avg_cost    numeric not null default 0
);

-- ── آیتم‌های منو ─────────────────────────────────────────────────────
create table if not exists menu_items (
  id       bigserial primary key,
  name     text not null,
  category text not null default 'قهوه',
  margin   numeric not null default 0,
  price    numeric not null default 0
);

-- ── رسپی ────────────────────────────────────────────────────────────
create table if not exists recipes (
  id  bigserial primary key,
  mid bigint not null references menu_items(id) on delete cascade,
  iid bigint not null references ingredients(id) on delete cascade,
  qty numeric not null default 0,
  unique(mid, iid)
);

-- ── مشتریان ─────────────────────────────────────────────────────────
create table if not exists customers (
  id      bigserial primary key,
  name    text not null,
  phone   text default '',
  code    text default '',
  note    text default '',
  is_walk boolean not null default false
);

-- ── فاکتورهای خرید (مواد اولیه) ────────────────────────────────────
create table if not exists invoices (
  id    bigserial primary key,
  date  text not null,
  uid   bigint,
  cid   bigint,
  note  text default '',
  items jsonb not null default '[]',
  total numeric not null default 0,
  img   text,
  elog  jsonb not null default '[]'
);

-- ── فاکتورهای فروش ──────────────────────────────────────────────────
create table if not exists sale_invoices (
  id           bigserial primary key,
  num          text not null,
  date         text not null,
  time         text not null default '',
  cust_id      bigint,
  cust_name    text not null default '',
  pager        text default '',
  items        jsonb not null default '[]',
  sub_total    numeric not null default 0,
  discount_pct numeric not null default 0,
  discount_amt numeric not null default 0,
  tax_pct      numeric not null default 9,
  tax_amt      numeric not null default 0,
  total        numeric not null default 0,
  note         text default '',
  paid         boolean not null default true,
  status       text not null default 'paid'
);

-- ── هزینه‌های ثابت ───────────────────────────────────────────────────
create table if not exists overheads (
  id     bigserial primary key,
  name   text not null,
  amount numeric not null default 0,
  period text not null default 'monthly'
);

-- ── حساب‌های بانکی ───────────────────────────────────────────────────
create table if not exists cards (
  id    bigserial primary key,
  name  text not null,
  num   text not null default '',
  bal   numeric not null default 0,
  color text not null default '#2563EB'
);

-- ── لاگ موجودی ──────────────────────────────────────────────────────
create table if not exists stock_logs (
  id      bigserial primary key,
  date    text not null,
  type    text not null,
  label   text not null,
  changes jsonb not null default '[]'
);

-- ── تنظیمات ─────────────────────────────────────────────────────────
create table if not exists settings (
  key   text primary key,
  value text not null default ''
);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security — همه جداول عمومی (برای این پروژه ساده)
-- ═══════════════════════════════════════════════════════════════════
alter table users        enable row level security;
alter table ingredients  enable row level security;
alter table menu_items   enable row level security;
alter table recipes      enable row level security;
alter table customers    enable row level security;
alter table invoices     enable row level security;
alter table sale_invoices enable row level security;
alter table overheads    enable row level security;
alter table cards        enable row level security;
alter table stock_logs   enable row level security;
alter table settings     enable row level security;

-- Policy: anon key می‌تونه همه چیز بخونه و بنویسه (دسترسی داخلی)
do $$
declare
  t text;
begin
  foreach t in array array[
    'users','ingredients','menu_items','recipes','customers',
    'invoices','sale_invoices','overheads','cards','stock_logs','settings'
  ]
  loop
    execute format('
      create policy if not exists "allow_all_%s" on %I
      for all to anon, authenticated using (true) with check (true);
    ', t, t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- Seed data — داده‌های اولیه
-- ═══════════════════════════════════════════════════════════════════
insert into users (name, username, password, role) values
  ('مدیر سیستم', 'admin', '1234', 'مدیر'),
  ('زهرا کریمی',  'zahrak', '1234', 'باریستا')
on conflict (username) do nothing;

insert into ingredients (id, name, category, unit_pair, mac_unit, mic_unit, rate, recipe_unit, stock, max_stock, avg_cost) values
  (1, 'قهوه اسپرسو',  'دانه قهوه',      'کیلوگرم/گرم',    'کیلوگرم', 'گرم',       1000, 'گرم',       2500,  3000,  8.5),
  (2, 'شیر',           'لبنیات',          'لیتر/میلی‌لیتر', 'لیتر',    'میلی‌لیتر', 1000, 'میلی‌لیتر', 12000, 20000, 0.18),
  (3, 'شکر',           'شکر و شیرینی',   'کیلوگرم/گرم',    'کیلوگرم', 'گرم',       1000, 'گرم',       5000,  8000,  1.2),
  (4, 'خامه',          'لبنیات',          'لیتر/میلی‌لیتر', 'لیتر',    'میلی‌لیتر', 1000, 'میلی‌لیتر', 3000,  5000,  0.45),
  (5, 'شکلات تلخ',     'شکر و شیرینی',   'کیلوگرم/گرم',    'کیلوگرم', 'گرم',       1000, 'گرم',       800,   2000,  15.0)
on conflict (id) do nothing;

insert into menu_items (id, name, category, margin, price) values
  (1, 'اسپرسو',   'قهوه', 60, 35000),
  (2, 'لاته',     'قهوه', 55, 55000),
  (3, 'موکا',     'قهوه', 50, 65000)
on conflict (id) do nothing;

insert into recipes (mid, iid, qty) values
  (1, 1, 18),
  (2, 1, 18), (2, 2, 200), (2, 3, 10),
  (3, 1, 18), (3, 2, 150), (3, 5, 20)
on conflict (mid, iid) do nothing;

insert into customers (id, name, phone, code, note, is_walk) values
  (1, 'مشتری گذری', '', 'WALK', '', true)
on conflict (id) do nothing;

insert into overheads (name, amount, period) values
  ('اجاره محل',       12000000, 'monthly'),
  ('حقوق کارمندان',   25000000, 'monthly'),
  ('برق و آب و گاز',  2500000,  'monthly')
on conflict do nothing;

insert into cards (name, num, bal, color) values
  ('بانک ملت',     '6104-3378-****-2810', 45000000, '#2563EB'),
  ('بانک پاسارگاد','5022-2910-****-7741', 18500000, '#7C3AED')
on conflict do nothing;

insert into settings (key, value) values
  ('taxPct',        '9'),
  ('invoicePrefix', 'INV'),
  ('invCounter',    '1'),
  ('cafeNameFa',    'کافه من'),
  ('cafeNameEn',    'My Cafe'),
  ('address',       ''),
  ('estOrders',     '80')
on conflict (key) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- تمام! حالا به داشبورد Supabase برگرد
-- ═══════════════════════════════════════════════════════════════════
