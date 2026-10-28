import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';
import { TerminologyRepository } from '@inkloom/database';

export async function linterNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const text = state.rawText;
  const rules = await TerminologyRepository.getAll(state.orgId);
  const violations: ViolationItem[] = [];

  for (const rule of rules) {
    const pattern = new RegExp(`\\b${escapeRegex(rule.termPattern)}\\b`, 'gi');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const excerpt = match[0];
      const start = match.index;
      const end = start + excerpt.length;

      violations.push({
        id: `viol_term_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: 'terminology',
        severity: rule.ruleType === 'banned' ? 'moderate' : 'minor',
        violatingExcerpt: excerpt,
        characterRange: [start, end],
        explanation: rule.explanation,
        ruleCitation: `Brand Lexicon Rule: "${rule.termPattern}"`,
        suggestedRewrite: rule.preferredTerm,
        status: 'open'
      });
    }
  }

  return { linterViolations: violations };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
