/**
 * Inkloom AI Shared Domain Models & Types
 */

export type UserRole = 'creator' | 'reviewer' | 'brand_manager' | 'admin';

export type ContentFormat = 'text_copy' | 'document_pdf' | 'document_docx' | 'image_creative';

export type ContentStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published';

export type ViolationCategory = 
  | 'tone' 
  | 'terminology' 
  | 'factual_inaccuracy' 
  | 'unsupported_claim' 
  | 'visual_inconsistency' 
  | 'accessibility';

export type SeverityLevel = 'critical' | 'moderate' | 'minor';

export type RiskTier = 'pass' | 'warning' | 'critical_blocker';

export interface UserProfile {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface BrandGuideline {
  id: string;
  orgId: string;
  title: string;
  category: 'tone_voice' | 'messaging' | 'visual' | 'accessibility' | 'legal';
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApprovedFact {
  id: string;
  orgId: string;
  claimTopic: string;
  approvedStatement: string;
  sourceCitation: string;
  verificationDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface TerminologyRule {
  id: string;
  orgId: string;
  termPattern: string; // The forbidden term (e.g., 'cheap', 'foolproof')
  preferredTerm: string; // Approved replacement (e.g., 'cost-effective', 'intuitive')
  ruleType: 'banned' | 'trademark_capitalization' | 'preferred_synonym';
  explanation: string;
  createdAt: string;
}

export interface VisualBrandKit {
  id: string;
  orgId: string;
  kitName: string;
  primaryColors: string[]; // e.g. ['#0F172A', '#3B82F6']
  secondaryColors: string[];
  minContrastRatio: number; // default 4.5
  approvedFonts: string[];
  logoAssets: string[];
  createdAt: string;
}

export interface ContentItem {
  id: string;
  orgId: string;
  authorId: string;
  authorName?: string;
  title: string;
  contentFormat: ContentFormat;
  rawText: string;
  assetFileUrl?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ViolationItem {
  id: string;
  category: ViolationCategory;
  severity: SeverityLevel;
  violatingExcerpt: string;
  lineStart?: number;
  lineEnd?: number;
  characterRange?: [number, number];
  explanation: string;
  ruleCitation: string;
  guidelineId?: string;
  suggestedRewrite: string;
  status: 'open' | 'accepted' | 'rejected' | 'modified';
}

export interface AuditReport {
  id: string;
  contentId: string;
  overallComplianceScore: number; // 0 - 100
  toneScore: number;
  factualScore: number;
  claimScore: number;
  visualScore: number;
  accessibilityScore: number;
  riskTier: RiskTier;
  violations: ViolationItem[];
  executionTimeMs: number;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  contentId: string;
  violationId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  commentText: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  contentId: string;
  actorId: string;
  actorName: string;
  action:
    | 'submitted_review'
    | 'changes_requested'
    | 'applied_suggestion'
    | 'approved_content'
    | 'overridden_warning'
    | 'published';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GuidelineAmbiguityMetric {
  guidelineId: string;
  guidelineTitle: string;
  category: string;
  timesFlagged: number;
  timesOverridden: number;
  timesAccepted: number;
  ambiguityFrictionIndex: number; // 0.0 - 1.0 (higher means more confusing/contentious)
  recommendation?: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  size: number;
}

export interface ChatDraftContext {
  contentId: string;
  title?: string;
  text?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: ChatAttachment;
  activeAgent?: string;
  toolExecutions?: unknown[];
  structuredFindings?: unknown[];
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  activeDraft?: ChatDraftContext;
  messages: ChatMessage[];
}
