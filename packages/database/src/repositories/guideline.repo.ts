import { BrandGuideline } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

export class GuidelineRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<BrandGuideline[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('brand_guidelines').select('*').eq('org_id', orgId);
      if (!error && data && data.length > 0) return data as BrandGuideline[];
    }
    return Array.from(inMemoryDb.guidelines.values()).filter(g => g.orgId === orgId && g.isActive);
  }

  public static async getById(id: string): Promise<BrandGuideline | null> {
    return inMemoryDb.guidelines.get(id) || null;
  }

  public static async create(guideline: Omit<BrandGuideline, 'id' | 'createdAt'>): Promise<BrandGuideline> {
    const id = `bg_${Date.now()}`;
    const newGuideline: BrandGuideline = {
      ...guideline,
      id,
      createdAt: new Date().toISOString()
    };
    inMemoryDb.guidelines.set(id, newGuideline);
    return newGuideline;
  }
}
