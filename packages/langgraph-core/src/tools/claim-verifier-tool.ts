import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { FactIndexer } from '@inkloom/vector-store';
import { FactRepository } from '@inkloom/database';

export const verifyClaimSubstantiationTool = tool(
  async ({ claimStatement }) => {
    try {
      const trimmed = claimStatement.trim();
      const matches = await FactIndexer.verifyClaimAgainstFacts(trimmed, 2);
      const topMatch = matches[0];

      // Check for absolute superlatives or guaranteed zero/100% claims
      const isSuperlative = /\b(fastest|best|#1|world['’]?s\s+first|unbeatable|infallible|100%|zero\s+latency)\b/i.test(trimmed);

      let verified = false;
      let citation = 'Requires independent third-party audit certification or verified company benchmark.';
      let confidence = 0.0;

      if (topMatch && topMatch.similarity > 0.45) {
        verified = true;
        citation = topMatch.document.metadata.sourceCitation;
        confidence = Math.round(topMatch.similarity * 100) / 100;
      }

      return JSON.stringify({
        claimStatement: trimmed,
        isSuperlative,
        verified,
        substantiationCitation: citation,
        similarityConfidence: confidence,
        status: verified ? 'SUBSTANTIATED' : (isSuperlative ? 'CRITICAL_UNSUPPORTED_PROMOTIONAL_CLAIM' : 'UNVERIFIED_STATEMENT'),
        riskLevel: isSuperlative && !verified ? 'critical_blocker' : (verified ? 'pass' : 'warning'),
        suggestedGuidance: verified
          ? 'Claim is substantiated by approved company records.'
          : 'Rephrase superlatives or provide a certified third-party benchmark citation.'
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, verified: false, status: 'ERROR' });
    }
  },
  {
    name: 'verify_promotional_claim',
    description: 'Verifies whether a marketing claim, performance metric, or superlative (e.g., "fastest", "100% infallible", "zero latency") is backed by verified benchmark facts.',
    schema: z.object({
      claimStatement: z.string().describe('The specific marketing statement or claim sentence to substantiate.')
    })
  }
);
