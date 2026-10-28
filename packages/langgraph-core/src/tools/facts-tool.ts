import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { FactRepository } from '@inkloom/database';
import { FactIndexer } from '@inkloom/vector-store';

export const queryFactsTool = tool(
  async ({ claimTopic, statementQuery }) => {
    try {
      if (statementQuery && statementQuery.trim()) {
        const matches = await FactIndexer.verifyClaimAgainstFacts(statementQuery, 3);
        if (matches.length > 0) {
          return JSON.stringify({
            source: 'verified_fact_vectors',
            query: statementQuery,
            results: matches.map(m => ({
              topic: m.document.metadata.claimTopic,
              approvedStatement: m.document.text,
              sourceCitation: m.document.metadata.sourceCitation,
              verificationDate: m.document.metadata.verificationDate,
              similarity: Math.round(m.similarity * 100) / 100
            }))
          });
        }
      }

      const all = await FactRepository.getAll();
      const filtered = claimTopic
        ? all.filter(f => f.claimTopic.toLowerCase().includes(claimTopic.toLowerCase()))
        : all;

      return JSON.stringify({
        source: 'fact_repository',
        totalFacts: filtered.length,
        facts: filtered.map(f => ({
          id: f.id,
          topic: f.claimTopic,
          approvedStatement: f.approvedStatement,
          sourceCitation: f.sourceCitation,
          verificationDate: f.verificationDate
        }))
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, facts: [] });
    }
  },
  {
    name: 'query_approved_facts',
    description: 'Retrieves verified facts, approved performance benchmarks, SLA guarantees, and compliance certifications to substantiate marketing claims.',
    schema: z.object({
      claimTopic: z.string().optional().describe('Topic keyword to filter approved facts (e.g., "latency", "uptime", "SLA", "SOC 2").'),
      statementQuery: z.string().optional().describe('The marketing statement or metric to verify against approved ground truth facts.')
    })
  }
);
