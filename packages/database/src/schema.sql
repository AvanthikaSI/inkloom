-- =========================================================================
-- INKLOOM AI ENTERPRISE SUPABASE POSTGRESQL SCHEMA
-- Execute this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rhwltjulokryhfwomsxa/sql/new
-- =========================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('creator', 'reviewer', 'brand_manager', 'executive', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Brand Policy Guidelines
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT DEFAULT 'org_inkloom_01',
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tone_voice', 'messaging', 'visual', 'accessibility', 'legal')),
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Approved Benchmark Facts
CREATE TABLE IF NOT EXISTS approved_facts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT DEFAULT 'org_inkloom_01',
    claim_topic TEXT NOT NULL,
    approved_statement TEXT NOT NULL,
    source_citation TEXT NOT NULL,
    verification_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Terminology & Banned Words Rules
CREATE TABLE IF NOT EXISTS terminology_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT DEFAULT 'org_inkloom_01',
    term_pattern TEXT NOT NULL,
    preferred_term TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('banned', 'trademark_capitalization', 'preferred_synonym')),
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Visual Brand Kits
CREATE TABLE IF NOT EXISTS visual_brand_kits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT DEFAULT 'org_inkloom_01',
    kit_name TEXT NOT NULL,
    primary_colors JSONB NOT NULL DEFAULT '["#0F172A", "#3B82F6", "#FFFFFF"]'::jsonb,
    secondary_colors JSONB NOT NULL DEFAULT '["#64748B", "#F8FAFC", "#10B981"]'::jsonb,
    min_contrast_ratio NUMERIC DEFAULT 4.5,
    approved_fonts JSONB NOT NULL DEFAULT '["Inter", "Geist Sans", "JetBrains Mono"]'::jsonb,
    logo_assets JSONB NOT NULL DEFAULT '["/assets/inkloom-logo.svg"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Content Drafts & Assets
CREATE TABLE IF NOT EXISTS content_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT DEFAULT 'org_inkloom_01',
    author_id TEXT,
    author_name TEXT,
    title TEXT NOT NULL,
    content_format TEXT NOT NULL DEFAULT 'text_copy',
    raw_text TEXT,
    asset_file_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Reports
CREATE TABLE IF NOT EXISTS audit_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content_id TEXT NOT NULL,
    content_title TEXT,
    raw_text TEXT,
    overall_compliance_score INTEGER NOT NULL,
    tone_score INTEGER DEFAULT 100,
    factual_score INTEGER DEFAULT 100,
    claim_score INTEGER DEFAULT 100,
    visual_score INTEGER DEFAULT 100,
    accessibility_score INTEGER DEFAULT 100,
    risk_level TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Violations & Diagnostic Findings
CREATE TABLE IF NOT EXISTS audit_violations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    audit_report_id TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    violating_excerpt TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    character_range JSONB,
    explanation TEXT NOT NULL,
    rule_citation TEXT NOT NULL,
    suggested_rewrite TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Review Collaboration Threads & Comments
CREATE TABLE IF NOT EXISTS review_threads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content_id TEXT NOT NULL,
    violation_id TEXT,
    author_id TEXT,
    author_name TEXT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Immutable Compliance Audit Trail
CREATE TABLE IF NOT EXISTS compliance_audit_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content_id TEXT NOT NULL,
    actor_id TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Guideline Ambiguity Friction Metrics
CREATE TABLE IF NOT EXISTS guideline_ambiguity_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT DEFAULT 'org_inkloom_01',
    guideline_id TEXT NOT NULL,
    guideline_title TEXT,
    category TEXT,
    times_flagged INTEGER DEFAULT 0,
    times_overridden INTEGER DEFAULT 0,
    times_accepted INTEGER DEFAULT 0,
    ambiguity_friction_index NUMERIC DEFAULT 0.0,
    recommendation TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AI Copilot Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    active_draft JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AI Copilot Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    active_agent TEXT,
    tool_executions JSONB,
    structured_findings JSONB,
    attachment JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DISABLE ROW LEVEL SECURITY (RLS) FOR DIRECT MULTI-TENANT ACCESS
-- =========================================================================
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS brand_guidelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS approved_facts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terminology_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visual_brand_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS compliance_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guideline_ambiguity_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;

-- Grant broad API access to anon and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;


-- =========================================================================
-- SEED INITIAL BRAND GOVERNANCE KNOWLEDGE BASE
-- =========================================================================
INSERT INTO brand_guidelines (id, org_id, title, category, content, version, is_active)
VALUES
  ('bg_tone_01', 'org_inkloom_01', 'Authoritative yet Accessible Tone', 'tone_voice', 'Inkloom voice is clear, confident, and deeply technical yet approachable. Avoid sensationalist clickbait, hype words (e.g. "game-changer", "revolutionary", "magic"), and patronizing jargon. Speak directly to engineers and business leaders with measured respect.', 1, true),
  ('bg_legal_01', 'org_inkloom_01', 'Substantiation of Marketing Claims', 'legal', 'All superlative claims such as "the fastest", "the #1 platform", "100% infallible", or "unbeatable" are strictly prohibited unless accompanied by certified third-party benchmark citations. Every numerical performance metric must reference an approved company benchmark test.', 2, true),
  ('bg_visual_01', 'org_inkloom_01', 'Brand Palette & Contrast Compliance', 'visual', 'All brand graphics and web layouts must maintain minimum WCAG 2.1 AA contrast ratio (4.5:1 for standard body text, 3:1 for headers). Use Midnight Navy (#0F172A) for high-contrast typography against White (#FFFFFF) or Canvas (#F8FAFC). Electric Blue (#3B82F6) is reserved for interactive accents.', 1, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approved_facts (id, org_id, claim_topic, approved_statement, source_citation, verification_date, is_active)
VALUES
  ('fact_latency_01', 'org_inkloom_01', 'Inference Latency', 'Inkloom AI completes multi-agent governance audits in under 3.2 seconds on average.', 'Internal Engineering Benchmark Report Q3 2026, Table 4.1', '2026-09-15', true),
  ('fact_uptime_01', 'org_inkloom_01', 'Platform SLA', 'Inkloom Enterprise SLA provides a guaranteed 99.95% service availability.', 'Inkloom Master Services Agreement, Section 9 (SLA Schedule)', '2026-08-01', true),
  ('fact_compliance_01', 'org_inkloom_01', 'Compliance Certifications', 'Inkloom AI is certified SOC 2 Type II and GDPR compliant.', 'Audit Certificate AICPA 2026-0771', '2026-07-20', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO terminology_rules (id, org_id, term_pattern, preferred_term, rule_type, explanation)
VALUES
  ('term_cheap', 'org_inkloom_01', 'cheap', 'cost-effective or accessible', 'banned', 'The word "cheap" conveys low quality and undermines brand premium perception. Use "cost-effective", "efficient", or "accessible".'),
  ('term_magic', 'org_inkloom_01', 'magic', 'algorithmic or automated', 'banned', 'Avoid framing AI features as "magic". Inkloom emphasizes explainable, transparent engineering.'),
  ('term_game_changer', 'org_inkloom_01', 'game-changer', 'high-impact innovation', 'banned', 'Overused marketing cliché. Explain the concrete technical improvement instead.'),
  ('term_name_spelling', 'org_inkloom_01', 'InkLoom', 'Inkloom AI', 'trademark_capitalization', 'Official brand capitalization is "Inkloom AI", not "InkLoom" or "inkloom".')
ON CONFLICT (id) DO NOTHING;
