-- INKLOOM AI SUPABASE POSTGRESQL SCHEMA

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('creator', 'reviewer', 'brand_manager', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tone_voice', 'messaging', 'visual', 'accessibility', 'legal')),
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approved_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    claim_topic TEXT NOT NULL,
    approved_statement TEXT NOT NULL,
    source_citation TEXT NOT NULL,
    verification_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terminology_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    term_pattern TEXT NOT NULL,
    preferred_term TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('banned', 'trademark_capitalization', 'preferred_synonym')),
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visual_brand_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    kit_name TEXT NOT NULL,
    primary_colors JSONB NOT NULL,
    secondary_colors JSONB NOT NULL,
    min_contrast_ratio NUMERIC DEFAULT 4.5,
    approved_fonts JSONB NOT NULL,
    logo_assets JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    content_format TEXT NOT NULL CHECK (content_format IN ('text_copy', 'document_pdf', 'document_docx', 'image_creative')),
    raw_text TEXT,
    asset_file_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    overall_compliance_score INTEGER NOT NULL,
    tone_score INTEGER,
    factual_score INTEGER,
    claim_score INTEGER,
    visual_score INTEGER,
    accessibility_score INTEGER,
    risk_level TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_report_id UUID REFERENCES audit_reports(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    violating_excerpt TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    explanation TEXT NOT NULL,
    rule_citation TEXT NOT NULL,
    suggested_rewrite TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    violation_id UUID REFERENCES audit_violations(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guideline_ambiguity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    guideline_id UUID REFERENCES brand_guidelines(id) ON DELETE CASCADE,
    times_flagged INTEGER DEFAULT 0,
    times_overridden INTEGER DEFAULT 0,
    times_accepted INTEGER DEFAULT 0,
    ambiguity_friction_index NUMERIC DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
