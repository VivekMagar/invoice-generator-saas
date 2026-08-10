// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser client (used in components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Server-side admin client (never expose to browser)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────
// INVOICE HELPERS
// ─────────────────────────────────────────────

export async function getUserInvoices(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getInvoiceById(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function saveInvoice(invoice: object) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInvoice(id: string, updates: object) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function countInvoicesThisMonth(userId: string) {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
  if (error) throw error
  return count ?? 0
}

// ─────────────────────────────────────────────
// USER PROFILE HELPERS
// ─────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateUserPlan(
  userId: string,
  plan: 'free' | 'pro' | 'business',
  stripeCustomerId?: string
) {
  const { error } = await supabase
    .from('profiles')
    .update({ plan, stripe_customer_id: stripeCustomerId })
    .eq('id', userId)
  if (error) throw error
}

/*
══════════════════════════════════════════════════════
  SUPABASE SQL SCHEMA
  Paste this into: Supabase Dashboard → SQL Editor → Run
══════════════════════════════════════════════════════

-- 1. Enable UUID generation
create extension if not exists "uuid-ossp";

-- 2. Profiles table (one row per user, auto-created on signup)
create table profiles (
  id              uuid references auth.users on delete cascade primary key,
  full_name       text,
  plan            text default 'free' check (plan in ('free','pro','business')),
  stripe_customer_id text,
  created_at      timestamp with time zone default now()
);

-- 3. Auto-create a profile whenever a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 4. Invoices table
create table invoices (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  invoice_number  text not null,
  status          text default 'draft' check (status in ('draft','sent','paid','overdue')),
  from_name       text,
  from_email      text,
  from_address    text,
  client_name     text,
  client_email    text,
  client_address  text,
  issue_date      date,
  due_date        date,
  items           jsonb default '[]',
  subtotal        numeric(10,2) default 0,
  vat_rate        numeric(5,2)  default 19,
  vat_amount      numeric(10,2) default 0,
  total           numeric(10,2) default 0,
  notes           text,
  currency        text default 'EUR',
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

-- 5. Auto-update updated_at on every change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on invoices
  for each row execute procedure update_updated_at();

-- 6. Row Level Security — users only see their own data
alter table invoices enable row level security;
alter table profiles enable row level security;

create policy "Users manage own invoices"
  on invoices for all using (auth.uid() = user_id);

create policy "Users manage own profile"
  on profiles for all using (auth.uid() = id);

-- 7. Useful indexes
create index idx_invoices_user_id   on invoices(user_id);
create index idx_invoices_status    on invoices(status);
create index idx_invoices_due_date  on invoices(due_date);
*/
