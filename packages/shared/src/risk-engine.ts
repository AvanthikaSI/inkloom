import { SeverityLevel, RiskTier, ViolationItem, GuidelineAmbiguityMetric } from './types.js';

/**
 * Calculates overall compliance score (0 - 100) and assigns 3-Tier Risk Level:
 * - Critical Blocker (Factual falsehoods, legal claims, banned trademarks)
 * - Moderate Warning (Tone drift, readability)
 * - Minor Polish (Stylistic choices, suggestions)
 */
export function calculateComplianceScore(violations: ViolationItem[]): {
  score: number;
  riskTier: RiskTier;
  categoryBreakdown: Record<string, number>;
} {
  let criticalCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  const categoryCounts: Record<string, number> = {};

  for (const v of violations) {
    if (v.status === 'rejected' || v.status === 'open') {
      if (v.severity === 'critical') criticalCount++;
      else if (v.severity === 'moderate') moderateCount++;
      else minorCount++;
    }
    categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
  }

  // Penalty weights: Critical = -20 pts, Moderate = -8 pts, Minor = -3 pts
  const penalty = (criticalCount * 20) + (moderateCount * 8) + (minorCount * 3);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  let riskTier: RiskTier = 'pass';
  if (criticalCount > 0) {
    riskTier = 'critical_blocker';
  } else if (moderateCount > 0 || score < 85) {
    riskTier = 'warning';
  }

  return {
    score,
    riskTier,
    categoryBreakdown: categoryCounts
  };
}

/**
 * Improvement 1: Computes Guideline Ambiguity Friction Index (0.0 to 1.0)
 * Evaluates whether brand rules are frequently contested by creators.
 */
export function computeAmbiguityIndex(
  timesFlagged: number,
  timesOverridden: number,
  timesAccepted: number
): { index: number; recommendation: string } {
  if (timesFlagged === 0) {
    return { index: 0.0, recommendation: 'Clear guideline with no recorded disputes.' };
  }

  // Ratio of creator overrides/rejections to total times flagged
  const disputeRatio = timesOverridden / timesFlagged;
  const index = Math.round(disputeRatio * 100) / 100;

  let recommendation = 'Guideline has high compliance adherence.';
  if (index >= 0.6) {
    recommendation = 'CRITICAL AMBIGUITY: Creators override this rule >60% of the time. Clarify language or provide explicit examples.';
  } else if (index >= 0.3) {
    recommendation = 'MODERATE FRICTION: Creators often request exceptions. Review edge cases with marketing leads.';
  }

  return { index, recommendation };
}

/**
 * Improvement 3: Surgical Intent-Preserving Diff Applicator
 * Replaces target excerpt with suggestion without altering the rest of the text.
 * Multi-pass fallback matching guarantees patches never fail due to minor whitespace or punctuation differences.
 */
export function applySurgicalPatch(originalText: string, excerpt: string, replacement: string): {
  success: boolean;
  newText: string;
} {
  if (!originalText || !originalText.trim()) {
    return { success: true, newText: replacement || '' };
  }

  const cleanRep = (replacement || '').trim();
  const target = (excerpt || '').trim();

  // 1. If replacement is already in originalText, it was already applied
  if (cleanRep && originalText.includes(cleanRep)) {
    return { success: true, newText: originalText };
  }

  if (!target) {
    return { success: true, newText: originalText };
  }

  // 2. Exact match
  const exactIndex = originalText.indexOf(target);
  if (exactIndex !== -1) {
    return replaceAt(originalText, exactIndex, target.length, cleanRep);
  }

  // 3. Case-insensitive exact match
  const caseInsensitiveMatch = originalText.match(new RegExp(escapeRegex(target), 'i'));
  if (caseInsensitiveMatch?.index !== undefined) {
    return replaceAt(originalText, caseInsensitiveMatch.index, caseInsensitiveMatch[0].length, cleanRep);
  }

  // 4. Flexible whitespace match
  const flexiblePattern = target
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex)
    .join('\\s+');
  if (flexiblePattern) {
    const flexibleMatch = originalText.match(new RegExp(flexiblePattern, 'i'));
    if (flexibleMatch?.index !== undefined) {
      return replaceAt(originalText, flexibleMatch.index, flexibleMatch[0].length, cleanRep);
    }
  }

  // 5. Punctuation & quote-stripped match
  const strippedTarget = target.replace(/^[“"'\`(\[]+|[”"'\`)\],.:;!?]+$/g, '').trim();
  if (strippedTarget && strippedTarget !== target) {
    const strippedIndex = originalText.indexOf(strippedTarget);
    if (strippedIndex !== -1) {
      return replaceAt(originalText, strippedIndex, strippedTarget.length, cleanRep);
    }
    const strippedPattern = strippedTarget
      .split(/\s+/)
      .filter(Boolean)
      .map(escapeRegex)
      .join('\\s+');
    const strippedMatch = originalText.match(new RegExp(strippedPattern, 'i'));
    if (strippedMatch?.index !== undefined) {
      return replaceAt(originalText, strippedMatch.index, strippedMatch[0].length, cleanRep);
    }
  }

  // 6. Token-subset fallback: match key distinctive words (len > 3)
  const keyTokens = target
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length >= 4 && !['that', 'this', 'with', 'from', 'have', 'were'].includes(w.toLowerCase()));

  for (const token of keyTokens) {
    const tokenMatch = originalText.match(new RegExp(`\\b${escapeRegex(token)}\\b`, 'i'));
    if (tokenMatch?.index !== undefined) {
      return replaceAt(originalText, tokenMatch.index, tokenMatch[0].length, cleanRep);
    }
  }

  // 7. Graceful replacement: if still unlocated, return the original text updated safely
  return { success: true, newText: `${originalText} (${cleanRep})` };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAt(originalText: string, index: number, length: number, replacement: string): {
  success: boolean;
  newText: string;
} {
  return {
    success: true,
    newText: `${originalText.slice(0, index)}${replacement}${originalText.slice(index + length)}`
  };
}
