-- ════════════════════════════════════════════════════════════════════════════
-- Kai Exchange — Supabase schema
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to run once on a fresh project. (Re-running will error on existing
-- objects; that's expected.)
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type workshop_status   as enum ('pending','approved','rejected','cancelled','completed');
create type application_status as enum ('pending','approved','rejected','waitlisted');
create type skill_level        as enum ('beginner','intermediate','advanced','all');

-- ── Workshops ────────────────────────────────────────────────────────────────
create table workshops (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  host_name        text not null,
  host_institution text,
  host_bio         text,
  host_email       text,
  title            text not null,
  description      text not null,
  category         text not null,
  starts_at        timestamptz not null,
  duration_min     int not null default 60,
  skill            skill_level not null default 'all',
  max_attendees    int not null default 30,
  status           workshop_status not null default 'pending',
  meet_link        text,
  resources        jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  reviewed_at      timestamptz
);

create index workshops_status_idx on workshops (status, starts_at);

-- ── Applications ─────────────────────────────────────────────────────────────
create table applications (
  id              uuid primary key default gen_random_uuid(),
  workshop_id     uuid not null references workshops(id) on delete cascade,
  applicant_name  text not null,
  applicant_email text not null,
  institution     text,
  experience      skill_level not null default 'beginner',
  motivation      text,
  status          application_status not null default 'pending',
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

create index applications_workshop_idx on applications (workshop_id, status);

-- ── Seats-remaining view ─────────────────────────────────────────────────────
create or replace view workshop_seats as
select
  w.id,
  w.max_attendees,
  w.max_attendees - count(a.*) filter (where a.status = 'approved') as seats_remaining
from workshops w
left join applications a on a.workshop_id = w.id
group by w.id;

-- ── Row-Level Security ───────────────────────────────────────────────────────
-- The app talks to the database with the SERVICE ROLE key from the server only,
-- which bypasses RLS. These policies are defence-in-depth: even if the anon key
-- were ever exposed, the public could only read approved workshops and insert
-- pending rows — never approve anything or read applications.
alter table workshops    enable row level security;
alter table applications enable row level security;

create policy "public reads approved workshops"
  on workshops for select
  to anon, authenticated
  using (status = 'approved');

create policy "public submits pending workshops"
  on workshops for insert
  to anon, authenticated
  with check (status = 'pending');

create policy "public submits pending applications"
  on applications for insert
  to anon, authenticated
  with check (status = 'pending');

-- (No anon select/update policy on applications, and no anon update on
--  workshops — only the server's service-role key can review/approve.)

-- ════════════════════════════════════════════════════════════════════════════
-- OPTIONAL — seed four approved demo workshops so the Exchange isn't empty the
-- moment you connect the database. Delete these rows anytime. Skip this block
-- if you'd rather start empty.
-- ════════════════════════════════════════════════════════════════════════════
insert into workshops (slug, host_name, host_institution, host_bio, title, description, category, starts_at, duration_min, skill, max_attendees, status)
values
  ('demo-metagenomic-assembly', 'Demo Host', 'Kai Labs', 'Example workshop included to show how a session looks.',
   'Metagenomic Assembly from Scratch with MEGAHIT',
   'A hands-on walkthrough of co-assembling short-read metagenomes with MEGAHIT — from read QC through contig evaluation. Bring a laptop; example data provided.',
   'Metagenomics', now() + interval '7 days', 90, 'beginner', 40, 'approved'),
  ('demo-antismash-bgc', 'Demo Host', 'Kai Labs', 'Example workshop included to show how a session looks.',
   'Mining Biosynthetic Gene Clusters with antiSMASH',
   'Learn to run antiSMASH on bacterial genomes, read the output, and rank biosynthetic gene clusters by novelty against MIBiG. Ideal for natural-product discovery.',
   'Drug Discovery', now() + interval '12 days', 75, 'intermediate', 30, 'approved'),
  ('demo-qiime2-16s', 'Demo Host', 'Kai Labs', 'Example workshop included to show how a session looks.',
   '16S Amplicon Analysis in QIIME2',
   'From raw reads to diversity metrics: denoising with DADA2, taxonomy assignment, and alpha/beta diversity — the full QIIME2 microbiome pipeline.',
   'Genomics', now() + interval '18 days', 120, 'beginner', 50, 'approved');
