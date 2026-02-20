-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- USER PROFILES
-- =========================
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  address text,
  role text default 'customer' check (role in ('customer','admin','staff')),
  created_at timestamptz default now()
);

-- =========================
-- CATEGORIES
-- =========================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- =========================
-- PRODUCTS
-- =========================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  category_id uuid references categories(id),
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  stock int default 0 check (stock >= 0),
  is_active boolean default true,
  rating numeric(2,1) default 4.5,
  created_at timestamptz default now()
);

create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);

-- =========================
-- PRODUCT IMAGES (MULTI)
-- =========================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  image_url text not null
);

-- =========================
-- CARTS
-- =========================
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id)
);

create index idx_carts_user on carts(user_id);

-- =========================
-- CART ITEMS
-- =========================
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0),
  created_at timestamptz default now(),
  unique(cart_id, product_id)
);

create index idx_cart_items_cart on cart_items(cart_id);

-- =========================
-- ORDERS
-- =========================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  total_amount numeric(10,2) not null check (total_amount >= 0),

  status text default 'pending'
    check (status in (
      'pending',
      'confirmed',
      'preparing',
      'shipped',
      'delivered',
      'cancelled'
    )),

  payment_status text default 'unpaid'
    check (payment_status in ('unpaid','paid','failed','refunded')),

  razorpay_order_id text unique,
  shipping_address jsonb,
  created_at timestamptz default now()
);

create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);

-- =========================
-- ORDER ITEMS
-- =========================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

-- =========================
-- PAYMENTS
-- =========================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount numeric(10,2),
  status text,
  method text,
  created_at timestamptz default now()
);

-- =========================
-- INVENTORY LOGS
-- =========================
create table public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  change_amount int,
  reason text,
  created_at timestamptz default now()
);

-- =========================
-- REVIEWS
-- =========================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(product_id, user_id)
);

-- =========================
-- COUPONS
-- =========================
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent int check (discount_percent between 1 and 90),
  active boolean default true,
  expires_at timestamptz
);

-- =========================
-- AUTO PROFILE TRIGGER
-- =========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- ENABLE RLS
-- =========================
alter table user_profiles enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;

-- =========================
-- HELPER ADMIN CHECK
-- =========================
create or replace function is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from user_profiles
    where id = uid and role = 'admin'
  );
$$ language sql stable;

-- =========================
-- RLS POLICIES
-- =========================

-- profiles
create policy "read own profile"
on user_profiles
for select
using (auth.uid() = id or is_admin(auth.uid()));

create policy "update own profile"
on user_profiles
for update
using (auth.uid() = id or is_admin(auth.uid()));

-- carts
create policy "own cart access"
on carts
for all
using (auth.uid() = user_id or is_admin(auth.uid()));

-- cart items
create policy "own cart items"
on cart_items
for all
using (
  exists (
    select 1 from carts
    where carts.id = cart_items.cart_id
    and (carts.user_id = auth.uid() or is_admin(auth.uid()))
  )
);

-- orders
create policy "own orders"
on orders
for all
using (auth.uid() = user_id or is_admin(auth.uid()));

-- order items
create policy "order items access"
on order_items
for select
using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and (orders.user_id = auth.uid() or is_admin(auth.uid()))
  )
);

-- reviews
create policy "review own"
on reviews
for all
using (auth.uid() = user_id or is_admin(auth.uid()));
