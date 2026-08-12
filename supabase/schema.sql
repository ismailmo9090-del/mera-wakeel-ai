-- Enable pgvector extension first
create extension if not exists vector;

-- 1. Profiles Table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  user_type text not null check (user_type in ('citizen', 'lawyer')),
  preferred_language text default 'hindi' check (preferred_language in ('hindi', 'english', 'hinglish')),
  city text,
  state text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Lawyers Table
create table if not exists lawyers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  specialty text[] default '{}',
  years_experience int default 0,
  bar_council_number text,
  is_verified boolean default false,
  bio text,
  consultation_fee_range text,
  rating_avg numeric(3,2) default 0,
  total_cases_handled int default 0,
  available boolean default true,
  profile_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Cases Table
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references profiles(id) on delete cascade,
  title text,
  category text check (category in ('property', 'tenant', 'family', 'consumer', 'labour', 'other')),
  status text default 'ongoing' check (status in ('ongoing', 'assessed', 'closed', 'lawyer_connected')),
  ai_verdict text check (ai_verdict in ('user_correct', 'user_incorrect', 'needs_more_info')),
  ai_summary text,
  confidence_score numeric(3,2),
  assigned_lawyer_id uuid references lawyers(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Messages Table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'ai')),
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'voice', 'document_reference')),
  created_at timestamptz default now()
);

-- 5. Documents Table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  file_url text not null,
  document_type text check (document_type in ('stamp_paper', 'will', 'registry', 'sale_deed', 'power_of_attorney', 'affidavit', 'contract', 'court_notice', 'lease_agreement', 'legal_notice', 'other', 'unknown')),
  ai_extracted_text text,
  ai_analysis text,
  is_verified_valid boolean,
  uploaded_at timestamptz default now()
);

-- 6. Case Evidence Table
create table if not exists case_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  evidence_description text not null,
  is_available boolean default false,
  priority text default 'helpful' check (priority in ('critical', 'helpful', 'optional'))
);

-- 7. Lawyer Connections Table
create table if not exists lawyer_connections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  citizen_id uuid not null references profiles(id) on delete cascade,
  lawyer_id uuid not null references lawyers(id) on delete cascade,
  status text default 'requested' check (status in ('requested', 'accepted', 'rejected', 'completed')),
  requested_at timestamptz default now()
);

-- 8. Reviews Table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references lawyers(id) on delete cascade,
  citizen_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now()
);

-- 9. Legal Knowledge Base Table
create table if not exists legal_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  act_name text not null,
  section_number text,
  content text not null,
  embedding vector(1536),
  category text check (category in ('property', 'tenant', 'family', 'consumer', 'labour', 'other'))
);

-- 10. Case Facts Table (Structured Memory per case)
create table if not exists case_facts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  fact_key text not null,
  fact_value text not null,
  updated_at timestamptz default now(),
  unique(case_id, fact_key)
);

-- 11. Profile Facts Table (Structured Memory per user/citizen across cases)
create table if not exists profile_facts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  fact_key text not null,
  fact_value text not null,
  updated_at timestamptz default now(),
  unique(profile_id, fact_key)
);

-- 12. Direct Messages Table (Chat between Citizen & Lawyer when request is accepted)
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references lawyer_connections(id) on delete cascade,
  sender_id text not null,
  sender_type text not null check (sender_type in ('lawyer', 'citizen')),
  content text not null,
  sent_at timestamptz default now()
);

-- Indexes on Foreign Key columns for performance
create index if not exists idx_lawyers_profile_id on lawyers(profile_id);
create index if not exists idx_cases_citizen_id on cases(citizen_id);
create index if not exists idx_cases_assigned_lawyer on cases(assigned_lawyer_id);
create index if not exists idx_messages_case_id on messages(case_id);
create index if not exists idx_documents_case_id on documents(case_id);
create index if not exists idx_case_evidence_case_id on case_evidence(case_id);
create index if not exists idx_lawyer_connections_case_id on lawyer_connections(case_id);
create index if not exists idx_lawyer_connections_citizen_id on lawyer_connections(citizen_id);
create index if not exists idx_lawyer_connections_lawyer_id on lawyer_connections(lawyer_id);
create index if not exists idx_reviews_lawyer_id on reviews(lawyer_id);
create index if not exists idx_reviews_citizen_id on reviews(citizen_id);
create index if not exists idx_case_facts_case_id on case_facts(case_id);
create index if not exists idx_profile_facts_profile_id on profile_facts(profile_id);
create index if not exists idx_direct_messages_connection_id on direct_messages(connection_id);
create index if not exists idx_direct_messages_sent_at on direct_messages(sent_at);

-- Enable Row Level Security (RLS) on all tables
alter table profiles enable row level security;
alter table lawyers enable row level security;
alter table cases enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;
alter table case_evidence enable row level security;
alter table lawyer_connections enable row level security;
alter table reviews enable row level security;
alter table legal_knowledge_base enable row level security;
alter table case_facts enable row level security;
alter table profile_facts enable row level security;
alter table direct_messages enable row level security;

-- RLS Policies

-- profiles policies
create policy "Users can select own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- lawyers policies
create policy "Anyone can select lawyers" on lawyers
  for select using (true);

create policy "Lawyer owner can insert" on lawyers
  for insert with check (auth.uid() = profile_id);

create policy "Lawyer owner can update" on lawyers
  for update using (auth.uid() = profile_id);

-- cases policies
create policy "Citizens can select own cases" on cases
  for select using (auth.uid() = citizen_id);

create policy "Citizens can insert own cases" on cases
  for insert with check (auth.uid() = citizen_id);

create policy "Citizens can update own cases" on cases
  for update using (auth.uid() = citizen_id);

-- messages policies
create policy "Case messages select" on messages
  for select using (
    exists (
      select 1 from cases
      where cases.id = messages.case_id
      and cases.citizen_id = auth.uid()
    )
  );

create policy "Case messages insert" on messages
  for insert with check (
    exists (
      select 1 from cases
      where cases.id = messages.case_id
      and cases.citizen_id = auth.uid()
    )
  );

-- documents policies
create policy "Case documents select" on documents
  for select using (
    exists (
      select 1 from cases
      where cases.id = documents.case_id
      and cases.citizen_id = auth.uid()
    )
  );

create policy "Case documents insert" on documents
  for insert with check (
    exists (
      select 1 from cases
      where cases.id = documents.case_id
      and cases.citizen_id = auth.uid()
    )
  );

create policy "Case documents update" on documents
  for update using (
    exists (
      select 1 from cases
      where cases.id = documents.case_id
      and cases.citizen_id = auth.uid()
    )
  );

-- case_evidence policies
create policy "Case evidence select" on case_evidence
  for select using (
    exists (
      select 1 from cases
      where cases.id = case_evidence.case_id
      and cases.citizen_id = auth.uid()
    )
  );

create policy "Case evidence insert" on case_evidence
  for insert with check (
    exists (
      select 1 from cases
      where cases.id = case_evidence.case_id
      and cases.citizen_id = auth.uid()
    )
  );

-- lawyer_connections policies
create policy "Lawyer connections select" on lawyer_connections
  for select using (
    auth.uid() = citizen_id or exists (
      select 1 from lawyers
      where lawyers.id = lawyer_connections.lawyer_id
      and lawyers.profile_id = auth.uid()
    )
  );

create policy "Lawyer connections insert" on lawyer_connections
  for insert with check (auth.uid() = citizen_id);

-- reviews policies
create policy "Anyone can select reviews" on reviews
  for select using (true);

create policy "Citizens can insert reviews" on reviews
  for insert with check (auth.uid() = citizen_id);

-- legal_knowledge_base policies
create policy "Anyone can select legal knowledge base" on legal_knowledge_base
  for select using (true);

-- case_facts policies
create policy "Case facts select" on case_facts
  for select using (
    exists (
      select 1 from cases
      where cases.id = case_facts.case_id
      and cases.citizen_id = auth.uid()
    )
  );

create policy "Case facts insert" on case_facts
  for insert with check (
    exists (
      select 1 from cases
      where cases.id = case_facts.case_id
      and cases.citizen_id = auth.uid()
    )
  );

create policy "Case facts update" on case_facts
  for update using (
    exists (
      select 1 from cases
      where cases.id = case_facts.case_id
      and cases.citizen_id = auth.uid()
    )
  );

-- profile_facts policies
create policy "Profile facts select" on profile_facts
  for select using (auth.uid() = profile_id);

create policy "Profile facts insert" on profile_facts
  for insert with check (auth.uid() = profile_id);

create policy "Profile facts update" on profile_facts
  for update using (auth.uid() = profile_id);

