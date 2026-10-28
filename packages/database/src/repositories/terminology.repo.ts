import { TerminologyRule } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

export class TerminologyRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<TerminologyRule[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('terminology_rules').select('*').eq('org_id', orgId);
      if (!error && data && data.length > 0) return data as TerminologyRule[];
    }
    return Array.from(inMemoryDb.terminology.values()).filter(t => t.orgId === orgId);
  }

  public static async create(rule: Omit<TerminologyRule, 'id' | 'createdAt'>): Promise<TerminologyRule> {
    const id = `term_${Date.now()}`;
    const newRule: TerminologyRule = {
      ...rule,
      id,
      createdAt: new Date().toISOString()
    };
    inMemoryDb.terminology.set(id, newRule);
    return newRule;
  }
}
