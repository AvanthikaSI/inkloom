import { ContentItem, ContentStatus } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';

export class ContentRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<ContentItem[]> {
    return Array.from(inMemoryDb.contentItems.values()).filter(c => c.orgId === orgId);
  }

  public static async getById(id: string): Promise<ContentItem | null> {
    return inMemoryDb.contentItems.get(id) || null;
  }

  public static async create(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem> {
    const id = `content_${Date.now()}`;
    const newItem: ContentItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryDb.contentItems.set(id, newItem);
    inMemoryDb.persist();
    return newItem;
  }

  public static async update(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const existing = inMemoryDb.contentItems.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    inMemoryDb.contentItems.set(id, updated);
    inMemoryDb.persist();
    return updated;
  }

  public static async updateStatus(id: string, status: ContentStatus): Promise<ContentItem | null> {
    return this.update(id, { status });
  }
}
