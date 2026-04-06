create table if not exists member_transactions (
  id bigserial primary key,
  telegram_user_id text not null,
  member_code text not null,
  declared_role text check (declared_role in ('supporter', 'elector')),
  tx_hash text not null unique,
  blockchain text not null default 'ton',
  asset text not null,
  amount_asset numeric(20,8) not null,
  amount_eur numeric(12,2) not null,
  wallet_address_from text,
  wallet_address_to text not null,
  treasury_wallet_address text not null,
  tx_comment text,
  tx_timestamp timestamptz not null,
  calendar_year integer not null,
  is_valid boolean not null default false,
  validation_reason text,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_transactions_telegram_user_id
  on member_transactions (telegram_user_id);

create index if not exists idx_member_transactions_member_code
  on member_transactions (member_code);

create index if not exists idx_member_transactions_calendar_year
  on member_transactions (calendar_year);

create index if not exists idx_member_transactions_is_valid
  on member_transactions (is_valid);

create index if not exists idx_member_transactions_tx_timestamp
  on member_transactions (tx_timestamp);

-- Composite index for the most common query pattern: valid transactions per user per year
create index if not exists idx_member_transactions_user_year_valid
  on member_transactions (telegram_user_id, calendar_year, is_valid);
