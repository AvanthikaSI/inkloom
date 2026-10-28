import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { GuidelineRepository } from '@inkloom/database';
import { GuidelineIndexer } from '@inkloom/vector-store';

export const queryGuidelinesTool = tool(
  async ({ query, category, limit }) => {
    try {
      const topK = limit || 3;
      if (query && query.trim()) {
        const matches = await GuidelineIndexer.findRelevantGuidelines(query, topK);
        if (matches.length > 0) {
          return JSON.stringify({
            source: 'semantic_vector_search',
            query,
            totalMatches: matches.length,
            guidelines: matches.map(m => ({
              id: m.document.metadata.id,
              title: m.document.metadata.title,
              category: m.document.metadata.category,
              content: m.document.text,
              similarityScore: Math.round(m.similarity * 100) / 100
            }))
          });
        }
      }

      // Fallback: list all guidelines or filter by category
      const all = await GuidelineRepository.getAll();
      const filtered = category
        ? all.filter(g => g.category.toLowerCase() === category.toLowerCase())
        : all;

      return JSON.stringify({
        source: 'database_repository',
        category: category || 'all',
        totalMatches: filtered.length,
        guidelines: filtered.slice(0, topK).map(g => ({
          id: g.id,
          title: g.title,
          category: g.category,
          content: g.content,
          version: g.version
        }))
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, guidelines: [] });
    }
  },
  {
    name: 'query_brand_guidelines',
    description: 'Searches official brand guidelines for rules regarding tone of voice, legal claims, accessibility, messaging, or visual standards.',
    schema: z.object({
      query: z.string().optional().describe('Semantic query or keywords to search brand guidelines (e.g., "superlative claims", "informal tone", "accessibility contrast").'),
      category: z.enum(['tone_voice', 'messaging', 'visual', 'accessibility', 'legal']).optional().describe('Optional category filter.'),
      limit: z.number().optional().describe('Maximum number of matching guidelines to retrieve (default: 3).')
    })
  }
);
