import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { TerminologyRepository } from '@inkloom/database';

export const checkTerminologyTool = tool(
  async ({ text }) => {
    try {
      const rules = await TerminologyRepository.getAll();
      const violations: any[] = [];

      for (const rule of rules) {
        const regex = new RegExp(`\\b${escapeRegex(rule.termPattern)}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          violations.push({
            patternMatched: rule.termPattern,
            actualOccurrence: match[0],
            characterIndex: match.index,
            preferredTerm: rule.preferredTerm,
            ruleType: rule.ruleType,
            explanation: rule.explanation
          });
        }
      }

      return JSON.stringify({
        compliant: violations.length === 0,
        totalViolations: violations.length,
        violations,
        recommendation: violations.length === 0
          ? 'No forbidden terms or trademark casing issues found.'
          : `Found ${violations.length} terminology issues. Replace matched terms with approved brand alternatives.`
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, compliant: false, violations: [] });
    }
  },
  {
    name: 'check_brand_terminology',
    description: 'Scans marketing copy against the official prohibited lexicon and trademark naming guidelines (e.g., catching "cheap", "foolproof", or improper capitalization of "InkLoom").',
    schema: z.object({
      text: z.string().describe('The text to scan for banned words or incorrect trademark usage.')
    })
  }
);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
