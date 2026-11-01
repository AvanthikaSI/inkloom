import { ContentItem, ContentStatus } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toContent(row: any): ContentItem {
  return {
    id: row.id,
    orgId: row.org_id || row.orgId,
    authorId: row.author_id || row.authorId,
    authorName: row.author_name || row.authorName,
    title: row.title,
    contentFormat: row.content_format || row.contentFormat || 'text_copy',
    rawText: row.raw_text ?? row.rawText ?? '',
    assetFileUrl: row.asset_file_url || row.assetFileUrl,
    status: row.status || 'draft',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

export class ContentRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<ContentItem[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('content_items').select('*').eq('org_id', orgId).order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) return data.map(toContent);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
    }
    return Array.from(inMemoryDb.contentItems.values()).filter(c => c.orgId === orgId);
  }

  public static async getById(id: string): Promise<ContentItem | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('content_items').select('*').eq('id', id).single();
        if (!error && data) return toContent(data);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
    }
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

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('content_items').insert({
          id,
          org_id: item.orgId,
          author_id: item.authorId,
          author_name: item.authorName,
          title: item.title,
          content_format: item.contentFormat,
          raw_text: item.rawText,
          status: item.status || 'draft'
        }).select().single();
        if (!error && data) {
          const res = toContent(data);
          inMemoryDb.contentItems.set(id, res);
          inMemoryDb.persist();
          return res;
        }
      } catch (err) {
        console.warn('Supabase insert failed, using fallback store:', err);
      }
    }

    inMemoryDb.contentItems.set(id, newItem);
    inMemoryDb.persist();
    return newItem;
  }

  public static async update(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const sbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) sbUpdates.title = updates.title;
        if (updates.rawText !== undefined) sbUpdates.raw_text = updates.rawText;
        if (updates.status !== undefined) sbUpdates.status = updates.status;
        if (updates.authorName !== undefined) sbUpdates.author_name = updates.authorName;

        const { data, error } = await supabase.from('content_items').update(sbUpdates).eq('id', id).select().single();
        if (!error && data) {
          const res = toContent(data);
          inMemoryDb.contentItems.set(id, res);
          inMemoryDb.persist();
          return res;
        }
      } catch (err) {
        console.warn('Supabase update failed, using fallback store:', err);
      }
    }

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
