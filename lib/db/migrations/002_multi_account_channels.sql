-- Migration: 002_multi_account_channels.sql
-- Enables users to connect and manage multiple accounts per social platform
-- (e.g. multiple YouTube channels, TikTok profiles, or Twitter handles).

-- 1. Drop the single-account unique constraint on (user_id, channel_type_id)
alter table user_channels
  drop constraint if exists user_channels_user_id_channel_type_id_key;

-- 2. Add multi-account unique constraint on (user_id, provider_account_id)
-- This allows multiple channels per platform as long as their platform-assigned account ID is distinct.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_channels_user_id_provider_account_id_key'
  ) then
    alter table user_channels
      add constraint user_channels_user_id_provider_account_id_key
      unique (user_id, provider_account_id);
  end if;
end $$;

-- 3. Add performance index on user_channels for fast dashboard lookups
create index if not exists idx_user_channels_user_connected
  on user_channels (user_id, is_connected);

