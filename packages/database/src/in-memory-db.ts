import {
  UserProfile,
  BrandGuideline,
  ApprovedFact,
  TerminologyRule,
  VisualBrandKit,
  ContentItem,
  AuditReport,
  ReviewComment,
  AuditLogEntry,
  GuidelineAmbiguityMetric,
  ChatSession
} from '@inkloom/shared';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Enterprise In-Memory Database Store for Inkloom AI.
 * Mirrors Supabase PostgreSQL schema with atomic CRUD operations.
 */
class InMemoryDatabase {
  private readonly persistenceFile = process.env.INKLOOM_DATA_FILE
    ? path.resolve(process.env.INKLOOM_DATA_FILE)
    : path.resolve(process.cwd(), 'data', 'inkloom-db.json');
  public users: Map<string, UserProfile> = new Map();
  public guidelines: Map<string, BrandGuideline> = new Map();
  public facts: Map<string, ApprovedFact> = new Map();
  public terminology: Map<string, TerminologyRule> = new Map();
  public brandKits: Map<string, VisualBrandKit> = new Map();
  public contentItems: Map<string, ContentItem> = new Map();
  public auditReports: Map<string, AuditReport> = new Map();
  public reviewComments: Map<string, ReviewComment[]> = new Map();
  public auditLogs: Map<string, AuditLogEntry[]> = new Map();
  public ambiguityMetrics: Map<string, GuidelineAmbiguityMetric> = new Map();
  public chatSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.seedDefaultData();
    this.loadPersistedState();
  }

  public persist(): void {
    const state = {
      users: Array.from(this.users.values()),
      guidelines: Array.from(this.guidelines.values()),
      facts: Array.from(this.facts.values()),
      terminology: Array.from(this.terminology.values()),
      brandKits: Array.from(this.brandKits.values()),
      contentItems: Array.from(this.contentItems.values()),
      auditReports: Array.from(this.auditReports.values()),
      reviewComments: Array.from(this.reviewComments.entries()),
      auditLogs: Array.from(this.auditLogs.entries()),
      ambiguityMetrics: Array.from(this.ambiguityMetrics.values()),
      chatSessions: Array.from(this.chatSessions.values())
    };

    fs.mkdirSync(path.dirname(this.persistenceFile), { recursive: true });
    const temporaryFile = `${this.persistenceFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(temporaryFile, this.persistenceFile);
  }

  private loadPersistedState(): void {
    if (!fs.existsSync(this.persistenceFile)) {
      this.persist();
      return;
    }

    try {
      const state = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
      this.restoreMap(this.users, state.users);
      this.restoreMap(this.guidelines, state.guidelines);
      this.restoreMap(this.facts, state.facts);
      this.restoreMap(this.terminology, state.terminology);
      this.restoreMap(this.brandKits, state.brandKits);
      this.restoreMap(this.contentItems, state.contentItems);
      this.restoreMap(this.auditReports, state.auditReports, 'contentId');
      this.restoreMap(this.reviewComments, state.reviewComments, undefined, true);
      this.restoreMap(this.auditLogs, state.auditLogs, undefined, true);
      this.restoreMap(this.ambiguityMetrics, state.ambiguityMetrics, 'guidelineId');
      this.restoreMap(this.chatSessions, state.chatSessions, 'sessionId');
    } catch (error) {
      console.warn(`[Inkloom DB] Could not load ${this.persistenceFile}; using seeded data.`, error);
    }
  }

  private restoreMap<T>(
    target: Map<string, T>,
    values: unknown,
    keyField = 'id',
    entries = false
  ): void {
    if (!Array.isArray(values)) return;
    target.clear();
    if (entries) {
      for (const entry of values) {
        if (Array.isArray(entry) && entry.length === 2) target.set(String(entry[0]), entry[1] as T);
      }
      return;
    }
    for (const value of values) {
      if (value && typeof value === 'object' && keyField && keyField in value) {
        const record = value as Record<string, unknown>;
        target.set(String(record[keyField]), value as T);
      }
    }
  }

  private seedDefaultData() {
    // 1. Default Users
    const defaultUsers: UserProfile[] = [
      {
        id: 'usr_creator_01',
        orgId: 'org_inkloom_01',
        email: 'sarah.creator@inkloom.ai',
        fullName: 'Sarah Jenkins',
        role: 'creator',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_reviewer_01',
        orgId: 'org_inkloom_01',
        email: 'marcus.editor@inkloom.ai',
        fullName: 'Marcus Vance',
        role: 'reviewer',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_manager_01',
        orgId: 'org_inkloom_01',
        email: 'elena.brand@inkloom.ai',
        fullName: 'Elena Rostova',
        role: 'brand_manager',
        createdAt: new Date().toISOString()
      }
    ];
    for (const u of defaultUsers) this.users.set(u.id, u);

    // 2. Official Brand Guidelines
    const defaultGuidelines: BrandGuideline[] = [
      {
        id: 'bg_tone_01',
        orgId: 'org_inkloom_01',
        title: 'Authoritative yet Accessible Tone',
        category: 'tone_voice',
        content: 'Inkloom voice is clear, confident, and deeply technical yet approachable. Avoid sensationalist clickbait, hype words (e.g. "game-changer", "revolutionary", "magic"), and patronizing jargon. Speak directly to engineers and business leaders with measured respect.',
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_legal_01',
        orgId: 'org_inkloom_01',
        title: 'Substantiation of Marketing Claims',
        category: 'legal',
        content: 'All superlative claims such as "the fastest", "the #1 platform", "100% infallible", or "unbeatable" are strictly prohibited unless accompanied by certified third-party benchmark citations. Every numerical performance metric must reference an approved company benchmark test.',
        version: 2,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_visual_01',
        orgId: 'org_inkloom_01',
        title: 'Brand Palette & Contrast Compliance',
        category: 'visual',
        content: 'All brand graphics and web layouts must maintain minimum WCAG 2.1 AA contrast ratio (4.5:1 for standard body text, 3:1 for headers). Use Midnight Navy (#0F172A) for high-contrast typography against White (#FFFFFF) or Canvas (#F8FAFC). Electric Blue (#3B82F6) is reserved for interactive accents.',
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    for (const g of defaultGuidelines) this.guidelines.set(g.id, g);

    // 3. Approved Fact Matrix
    const defaultFacts: ApprovedFact[] = [
      {
        id: 'fact_latency_01',
        orgId: 'org_inkloom_01',
        claimTopic: 'Inference Latency',
        approvedStatement: 'Inkloom AI completes multi-agent governance audits in under 3.2 seconds on average.',
        sourceCitation: 'Internal Engineering Benchmark Report Q3 2026, Table 4.1',
        verificationDate: '2026-09-15',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'fact_uptime_01',
        orgId: 'org_inkloom_01',
        claimTopic: 'Platform SLA',
        approvedStatement: 'Inkloom Enterprise SLA provides a guaranteed 99.95% service availability.',
        sourceCitation: 'Inkloom Master Services Agreement, Section 9 (SLA Schedule)',
        verificationDate: '2026-08-01',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'fact_compliance_01',
        orgId: 'org_inkloom_01',
        claimTopic: 'Compliance Certifications',
        approvedStatement: 'Inkloom AI is certified SOC 2 Type II and GDPR compliant.',
        sourceCitation: 'Audit Certificate AICPA 2026-0771',
        verificationDate: '2026-07-20',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    for (const f of defaultFacts) this.facts.set(f.id, f);

    // 4. Terminology Rules & Banned Words
    const defaultTerminology: TerminologyRule[] = [
      {
        id: 'term_cheap',
        orgId: 'org_inkloom_01',
        termPattern: 'cheap',
        preferredTerm: 'cost-effective or accessible',
        ruleType: 'banned',
        explanation: 'The word "cheap" conveys low quality and undermines brand premium perception. Use "cost-effective", "efficient", or "accessible".',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term_magic',
        orgId: 'org_inkloom_01',
        termPattern: 'magic',
        preferredTerm: 'algorithmic or automated',
        ruleType: 'banned',
        explanation: 'Avoid framing AI features as "magic". Inkloom emphasizes explainable, transparent engineering.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term_game_changer',
        orgId: 'org_inkloom_01',
        termPattern: 'game-changer',
        preferredTerm: 'high-impact innovation',
        ruleType: 'banned',
        explanation: 'Overused marketing cliché. Explain the concrete technical improvement instead.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term_name_spelling',
        orgId: 'org_inkloom_01',
        termPattern: 'InkLoom',
        preferredTerm: 'Inkloom AI',
        ruleType: 'trademark_capitalization',
        explanation: 'Official brand capitalization is "Inkloom AI", not "InkLoom" or "inkloom".',
        createdAt: new Date().toISOString()
      }
    ];
    for (const t of defaultTerminology) this.terminology.set(t.id, t);

    // 5. Visual Brand Kit
    const defaultKit: VisualBrandKit = {
      id: 'kit_inkloom_01',
      orgId: 'org_inkloom_01',
      kitName: 'Inkloom Modern Enterprise 2026',
      primaryColors: ['#0F172A', '#3B82F6', '#FFFFFF'],
      secondaryColors: ['#64748B', '#F8FAFC', '#10B981'],
      minContrastRatio: 4.5,
      approvedFonts: ['Inter', 'Geist Sans', 'JetBrains Mono'],
      logoAssets: ['/assets/inkloom-logo.svg'],
      createdAt: new Date().toISOString()
    };
    this.brandKits.set(defaultKit.id, defaultKit);

    // 6. Sample Initial Draft Content for testing review flow
    const sampleDraft: ContentItem = {
      id: 'content_demo_01',
      orgId: 'org_inkloom_01',
      authorId: 'usr_creator_01',
      authorName: 'Sarah Jenkins',
      title: 'Inkloom AI Product Launch Press Release',
      contentFormat: 'text_copy',
      rawText: 'We are thrilled to announce InkLoom, the cheap and revolutionary game-changer that offers 100% infallible marketing compliance. Our magic AI engine is the fastest platform in the world, running with zero latency.',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.contentItems.set(sampleDraft.id, sampleDraft);

    // 7. Initial Ambiguity Metrics
    this.ambiguityMetrics.set('bg_tone_01', {
      guidelineId: 'bg_tone_01',
      guidelineTitle: 'Authoritative yet Accessible Tone',
      category: 'tone_voice',
      timesFlagged: 14,
      timesOverridden: 6,
      timesAccepted: 8,
      ambiguityFrictionIndex: 0.43,
      recommendation: 'MODERATE FRICTION: Creators often request exceptions. Review edge cases with marketing leads.'
    });

    this.ambiguityMetrics.set('bg_legal_01', {
      guidelineId: 'bg_legal_01',
      guidelineTitle: 'Substantiation of Marketing Claims',
      category: 'legal',
      timesFlagged: 22,
      timesOverridden: 2,
      timesAccepted: 20,
      ambiguityFrictionIndex: 0.09,
      recommendation: 'Clear guideline with high compliance adherence.'
    });
  }
}

export const inMemoryDb = new InMemoryDatabase();
