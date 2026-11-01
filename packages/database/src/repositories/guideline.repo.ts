import { BrandGuideline } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toGuideline(row: any): BrandGuideline {
  return {
    id: row.id,
    orgId: row.org_id || row.orgId,
    title: row.title,
    category: row.category,
    content: row.content,
    version: row.version || 1,
    isActive: row.is_active ?? row.isActive ?? true,
    createdAt: row.created_at || row.createdAt
  };
}

export class GuidelineRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<BrandGuideline[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('brand_guidelines').select('*').eq('org_id', orgId);
        if (!error && Array.isArray(data)) return data.map(toGuideline);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
    }
    return Array.from(inMemoryDb.guidelines.values()).filter(g => g.orgId === orgId && g.isActive);
  }

  public static async getById(id: string): Promise<BrandGuideline | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('brand_guidelines').select('*').eq('id', id).single();
        if (!error && data) return toGuideline(data);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
    }
    return inMemoryDb.guidelines.get(id) || null;
  }

  public static async create(guideline: Omit<BrandGuideline, 'id' | 'createdAt'>): Promise<BrandGuideline> {
    const id = `bg_${Date.now()}`;
    const newGuideline: BrandGuideline = {
      ...guideline,
      id,
      createdAt: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('brand_guidelines').insert({
          id,
          org_id: guideline.orgId,
          title: guideline.title,
          category: guideline.category,
          content: guideline.content,
          version: guideline.version || 1,
          is_active: guideline.isActive ?? true
        }).select().single();
        if (!error && data) {
          const item = toGuideline(data);
          inMemoryDb.guidelines.set(id, item);
          inMemoryDb.persist();
          return item;
        }
      } catch (err) {
        console.warn('Supabase insert failed, using fallback store:', err);
      }
    }

    inMemoryDb.guidelines.set(id, newGuideline);
    inMemoryDb.persist();
    return newGuideline;
  }
}
