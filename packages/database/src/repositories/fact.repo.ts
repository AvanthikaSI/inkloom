import { ApprovedFact } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

export class FactRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<ApprovedFact[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('approved_facts').select('*').eq('org_id', orgId);
      if (!error && data && data.length > 0) return data as ApprovedFact[];
    }
    return Array.from(inMemoryDb.facts.values()).filter(f => f.orgId === orgId && f.isActive);
  }

  public static async create(fact: Omit<ApprovedFact, 'id' | 'createdAt'>): Promise<ApprovedFact> {
    const id = `fact_${Date.now()}`;
    const newFact: ApprovedFact = {
      ...fact,
      id,
      createdAt: new Date().toISOString()
    };
    inMemoryDb.facts.set(id, newFact);
    return newFact;
  }
}
