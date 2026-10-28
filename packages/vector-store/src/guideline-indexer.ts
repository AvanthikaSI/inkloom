import { globalChromaStore } from './chroma-client.js';
import { BrandGuideline } from '@inkloom/shared';

const GUIDELINES_COLLECTION = 'inkloom_guidelines';

export class GuidelineIndexer {
  public static async indexGuidelines(guidelines: BrandGuideline[]): Promise<void> {
    const docs = guidelines.map(g => ({
      id: g.id,
      text: `${g.title} [Category: ${g.category}]: ${g.content}`,
      metadata: {
        id: g.id,
        title: g.title,
        category: g.category,
        version: g.version
      }
    }));

    await globalChromaStore.addDocuments(GUIDELINES_COLLECTION, docs);
  }

  public static async findRelevantGuidelines(query: string, topK: number = 3) {
    return globalChromaStore.querySimilarity(GUIDELINES_COLLECTION, query, topK);
  }
}
