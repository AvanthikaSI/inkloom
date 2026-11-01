import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
}

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Seeding Brand Guidelines, Approved Fact Matrix, and Prohibited Lexicon directly into Supabase PostgreSQL...');

  // 1. Brand Guidelines
  const guidelines = [
    {
      id: 'bg_tone_01',
      org_id: 'org_inkloom_01',
      title: 'Authoritative yet Accessible Tone',
      category: 'tone_voice',
      content: 'Inkloom voice is clear, confident, and deeply technical yet approachable. Avoid sensationalist clickbait, hype words (e.g. "game-changer", "revolutionary", "magic"), and patronizing jargon. Speak directly to engineers and business leaders with measured respect.',
      version: 1,
      is_active: true
    },
    {
      id: 'bg_legal_01',
      org_id: 'org_inkloom_01',
      title: 'Substantiation of Marketing Claims',
      category: 'legal',
      content: 'All superlative claims such as "the fastest", "the #1 platform", "100% infallible", or "unbeatable" are strictly prohibited unless accompanied by certified third-party benchmark citations. Every numerical performance metric must reference an approved company benchmark test.',
      version: 2,
      is_active: true
    },
    {
      id: 'bg_visual_01',
      org_id: 'org_inkloom_01',
      title: 'Brand Palette & Contrast Compliance',
      category: 'visual',
      content: 'All brand graphics and web layouts must maintain minimum WCAG 2.1 AA contrast ratio (4.5:1 for standard body text, 3:1 for headers). Use Midnight Navy (#0F172A) for high-contrast typography against White (#FFFFFF) or Canvas (#F8FAFC). Electric Blue (#3B82F6) is reserved for interactive accents.',
      version: 1,
      is_active: true
    }
  ];

  const gRes = await supabase.from('brand_guidelines').upsert(guidelines);
  console.log('Brand Guidelines result:', gRes.error ? gRes.error.message : 'SUCCESS (3 rows seeded)');

  // 2. Approved Facts
  const facts = [
    {
      id: 'fact_latency_01',
      org_id: 'org_inkloom_01',
      claim_topic: 'Inference Latency',
      approved_statement: 'Inkloom AI completes multi-agent governance audits in under 3.2 seconds on average.',
      source_citation: 'Internal Engineering Benchmark Report Q3 2026, Table 4.1',
      verification_date: '2026-09-15',
      is_active: true
    },
    {
      id: 'fact_uptime_01',
      org_id: 'org_inkloom_01',
      claim_topic: 'Platform SLA',
      approved_statement: 'Inkloom Enterprise SLA provides a guaranteed 99.95% service availability.',
      source_citation: 'Inkloom Master Services Agreement, Section 9 (SLA Schedule)',
      verification_date: '2026-08-01',
      is_active: true
    },
    {
      id: 'fact_compliance_01',
      org_id: 'org_inkloom_01',
      claim_topic: 'Compliance Certifications',
      approved_statement: 'Inkloom AI is certified SOC 2 Type II and GDPR compliant.',
      source_citation: 'Audit Certificate AICPA 2026-0771',
      verification_date: '2026-07-20',
      is_active: true
    }
  ];

  const fRes = await supabase.from('approved_facts').upsert(facts);
  console.log('Approved Facts result:', fRes.error ? fRes.error.message : 'SUCCESS (3 rows seeded)');

  // 3. Prohibited Lexicon
  const terminology = [
    {
      id: 'term_cheap',
      org_id: 'org_inkloom_01',
      term_pattern: 'cheap',
      preferred_term: 'cost-effective or accessible',
      rule_type: 'banned',
      explanation: 'The word "cheap" conveys low quality and undermines brand premium perception. Use "cost-effective", "efficient", or "accessible".'
    },
    {
      id: 'term_magic',
      org_id: 'org_inkloom_01',
      term_pattern: 'magic',
      preferred_term: 'algorithmic or automated',
      rule_type: 'banned',
      explanation: 'Avoid framing AI features as "magic". Inkloom emphasizes explainable, transparent engineering.'
    },
    {
      id: 'term_game_changer',
      org_id: 'org_inkloom_01',
      term_pattern: 'game-changer',
      preferred_term: 'high-impact innovation',
      rule_type: 'banned',
      explanation: 'Overused marketing cliché. Explain the concrete technical improvement instead.'
    },
    {
      id: 'term_name_spelling',
      org_id: 'org_inkloom_01',
      term_pattern: 'InkLoom',
      preferred_term: 'Inkloom AI',
      rule_type: 'trademark_capitalization',
      explanation: 'Official brand capitalization is "Inkloom AI", not "InkLoom" or "inkloom".'
    }
  ];

  const tRes = await supabase.from('terminology_rules').upsert(terminology);
  console.log('Prohibited Lexicon result:', tRes.error ? tRes.error.message : 'SUCCESS (4 rows seeded)');

  console.log('\nAll core brand governance tables seeded directly in Supabase PostgreSQL!');
}

run().catch(console.error);
