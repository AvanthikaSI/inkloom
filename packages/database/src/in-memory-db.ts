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
import os from 'node:os';

/**
 * Enterprise In-Memory Database Store for Inkloom AI.
 * Mirrors Supabase PostgreSQL schema with atomic CRUD operations.
 */
class InMemoryDatabase {
  private readonly persistenceFile = process.env.INKLOOM_DATA_FILE
    ? path.resolve(process.env.INKLOOM_DATA_FILE)
    : (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) ? path.resolve(os.tmpdir(), 'inkloom-db.json') : path.resolve(process.cwd(), 'data', 'inkloom-db.json');
  public users: Map<string, UserProfile> = new Map();
  public guidelines: Map<string, BrandGuideline> = new Map();
  public facts: Map<string, ApprovedFact> = new Map();
  public terminology: Map<string, TerminologyRule> = new Map();
  public brandKits: Map<string, VisualBrandKit> = new Map();
  public contentItems: Map<string, ContentItem> = new Map();
  public auditReports: Map<string, AuditReport> = new Map();
  public allAuditReports: Map<string, AuditReport> = new Map();
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
      allAuditReports: Array.from(this.allAuditReports.values()),
      reviewComments: Array.from(this.reviewComments.entries()),
      auditLogs: Array.from(this.auditLogs.entries()),
      ambiguityMetrics: Array.from(this.ambiguityMetrics.values()),
      chatSessions: Array.from(this.chatSessions.values())
    };

    try {
      fs.mkdirSync(path.dirname(this.persistenceFile), { recursive: true });
      const temporaryFile = `${this.persistenceFile}.tmp`;
      fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(temporaryFile, this.persistenceFile);
    } catch (err) {
      console.warn('[Inkloom DB] Persistence skipped in read-only environment:', err?.message || err);
    }
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
      this.restoreMap(this.allAuditReports, state.allAuditReports, 'id');
      if (this.allAuditReports.size === 0 && this.auditReports.size > 0) {
        for (const report of Array.from(this.auditReports.values())) {
          this.allAuditReports.set(report.id || `rep_${Date.now()}`, report);
        }
      }

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
    // User profiles for persona switching in navigation
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
      },
      {
        id: 'usr_executive_01',
        orgId: 'org_inkloom_01',
        email: 'david.exec@inkloom.ai',
        fullName: 'David Zhao',
        role: 'executive',
        createdAt: new Date().toISOString()
      }
    ];
    for (const u of defaultUsers) this.users.set(u.id, u);
    // Strict zero-data seeding: all guidelines, facts, lexicon, content, and reports must come from users only
  }
}

export const inMemoryDb = new InMemoryDatabase();
