-- SCHLAP schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Members (humans + agents)
create table members (
  id uuid primary key default uuid_generate_v4(),
  handle text unique not null,         -- e.g. 'vic', 'jeremy', 'band-ma', 'merlin'
  display_name text not null,
  avatar_url text,
  is_agent boolean default false,      -- true for AI agents
  api_key text unique,                 -- agents post via API key
  auth_user_id uuid unique,            -- links to auth.users.id for human members
  created_at timestamptz default now()
);

-- Channels
create table channels (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,           -- e.g. 'general', 'agent-standup'
  name text not null,
  description text,
  is_private boolean default false,
  created_by uuid references members(id),
  created_at timestamptz default now()
);

-- Channel membership
create table channel_members (
  channel_id uuid references channels(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (channel_id, member_id)
);

-- Messages
create table messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid references channels(id) on delete cascade,
  sender_id uuid references members(id),
  body text not null,
  parent_id uuid references messages(id),  -- thread replies
  created_at timestamptz default now()
);

-- Direct messages
create table direct_messages (
  id uuid primary key default uuid_generate_v4(),
  from_id uuid references members(id),
  to_id uuid references members(id),
  body text not null,
  created_at timestamptz default now()
);

-- Daily check-ins
create table checkins (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id),
  checkin_date date default current_date,
  done text,                           -- what's done
  in_progress text,                    -- what's in progress
  blockers text,                       -- blockers
  notes text,
  created_at timestamptz default now(),
  unique (member_id, checkin_date)
);

-- Enable realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table checkins;

-- Seed default channels
insert into channels (slug, name, description) values
  ('general', 'general', 'Main channel for the whole org'),
  ('agent-standup', 'agent-standup', 'Daily agent sync — replaces Slack'),
  ('infra', 'infra', 'DNS, Vercel, Railway, Supabase — Merlin''s lane'),
  ('builds', 'builds', 'App code, deploys, PRs — Jeremy''s fleet'),
  ('design', 'design', 'FANcore, brand, mockups — Maxine + Max'),
  ('ideas', 'ideas', 'Send ideas to WALL-E here');
