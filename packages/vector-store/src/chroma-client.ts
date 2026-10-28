import { ChromaClient } from 'chromadb';

export interface VectorDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

/**
 * Lightweight local cosine similarity vector store that interfaces with ChromaDB
 * or acts as an embedded in-memory fallback.
 */
export class ChromaVectorStore {
  private client: ChromaClient | null = null;
  private memoryStore: Map<string, VectorDocument[]> = new Map();
  private isConnectedToChroma: boolean = false;

  constructor(private chromaUrl: string = 'http://localhost:8000') {
    try {
      this.client = new ChromaClient();
    } catch {
      this.client = null;
    }
  }

  public async initCollection(collectionName: string): Promise<void> {
    if (!this.memoryStore.has(collectionName)) {
      this.memoryStore.set(collectionName, []);
    }

    if (this.client && !this.isConnectedToChroma) {
      try {
        const dummyEmbeddingFunction = {
          generate: async (texts: string[]) => texts.map(t => this.computeLightweightEmbedding(t))
        };
        await this.client.getOrCreateCollection({
          name: collectionName,
          embeddingFunction: dummyEmbeddingFunction as any
        });
        this.isConnectedToChroma = true;
      } catch {
        // Fallback to local memory vector store silently
        this.isConnectedToChroma = false;
      }
    }
  }

  public async addDocuments(collectionName: string, docs: VectorDocument[]): Promise<void> {
    await this.initCollection(collectionName);
    
    // Always update internal memory index
    const list = this.memoryStore.get(collectionName) || [];
    for (const doc of docs) {
      if (!doc.embedding) {
        doc.embedding = this.computeLightweightEmbedding(doc.text);
      }
      list.push(doc);
    }
    this.memoryStore.set(collectionName, list);

    // If live Chroma instance is accessible, persist there too
    if (this.isConnectedToChroma && this.client) {
      try {
        const col = await this.client.getCollection({ name: collectionName });
        await col.add({
          ids: docs.map(d => d.id),
          documents: docs.map(d => d.text),
          metadatas: docs.map(d => d.metadata)
        });
      } catch {
        // Fallback gracefully to memory store
      }
    }
  }

  public async querySimilarity(collectionName: string, queryText: string, topK: number = 3): Promise<{
    document: VectorDocument;
    similarity: number;
  }[]> {
    await this.initCollection(collectionName);
    const list = this.memoryStore.get(collectionName) || [];
    if (list.length === 0) return [];

    const queryVec = this.computeLightweightEmbedding(queryText);

    // Compute cosine similarity for each document
    const scored = list.map(doc => {
      const docVec = doc.embedding || this.computeLightweightEmbedding(doc.text);
      const sim = this.cosineSimilarity(queryVec, docVec);
      return { document: doc, similarity: sim };
    });

    // Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * Deterministic Term-Frequency semantic vectorizer (128-dimensional embedding)
   * Runs locally in pure TypeScript with zero external downloads.
   */
  private computeLightweightEmbedding(text: string): number[] {
    const dim = 128;
    const vec = new Array(dim).fill(0);
    const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    if (tokens.length === 0) return vec;

    for (const token of tokens) {
      // Hash token into dimensions
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = (hash * 31 + token.charCodeAt(i)) & 0xffffffff;
      }
      const idx = Math.abs(hash) % dim;
      vec[idx] += 1.0;
    }

    // Normalize vector (L2 norm)
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < dim; i++) {
        vec[i] /= norm;
      }
    }

    return vec;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0.0, Math.min(1.0, dot));
  }
}

export const globalChromaStore = new ChromaVectorStore();
