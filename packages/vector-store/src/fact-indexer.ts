import { globalChromaStore } from './chroma-client.js';
import { ApprovedFact } from '@inkloom/shared';

const FACTS_COLLECTION = 'inkloom_facts';

export class FactIndexer {
  public static async indexFacts(facts: ApprovedFact[]): Promise<void> {
    const docs = facts.map(f => ({
      id: f.id,
      text: `Topic: ${f.claimTopic} - Approved Fact: ${f.approvedStatement} (Source: ${f.sourceCitation})`,
      metadata: {
        id: f.id,
        claimTopic: f.claimTopic,
        sourceCitation: f.sourceCitation,
        verificationDate: f.verificationDate
      }
    }));

    await globalChromaStore.addDocuments(FACTS_COLLECTION, docs);
  }

  public static async verifyClaimAgainstFacts(claimText: string, topK: number = 3) {
    return globalChromaStore.querySimilarity(FACTS_COLLECTION, claimText, topK);
  }
}
