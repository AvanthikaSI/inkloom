import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';
import { TerminologyRepository } from '@inkloom/database';

export async function linterNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const text = state.rawText;
  const rules = await TerminologyRepository.getAll(state.orgId || 'org_inkloom_01');
  const violations: ViolationItem[] = [];

  for (const rule of rules) {
    if (!rule.termPattern) continue;
    const pattern = new RegExp(`\\b${escapeRegex(rule.termPattern)}\\b`, 'gi');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const excerpt = match[0];
      const start = match.index;
      const end = start + excerpt.length;

      // If preferred term is specified and text already exactly matches the preferred term, skip
      if (rule.preferredTerm) {
        const preferredLen = rule.preferredTerm.length;
        const surrounding = text.substring(start, start + preferredLen);
        if (surrounding.toLowerCase() === rule.preferredTerm.toLowerCase() && surrounding === rule.preferredTerm) {
          continue;
        }
      }

      violations.push({
        id: `viol_term_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'terminology',
        severity: rule.ruleType === 'banned' ? 'moderate' : 'minor',
        violatingExcerpt: excerpt,
        characterRange: [start, end],
        explanation: rule.explanation || `The term "${excerpt}" violates brand lexicon guidance.`,
        ruleCitation: `Brand Lexicon Rule: "${rule.termPattern}"`,
        suggestedRewrite: rule.preferredTerm || 'approved alternative',
        status: 'open'
      });
    }
  }

  return { linterViolations: violations };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
