import { TerminologyRule } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toRule(row: any): TerminologyRule {
  return {
    id: row.id,
    orgId: row.org_id || row.orgId,
    termPattern: row.term_pattern || row.termPattern,
    preferredTerm: row.preferred_term || row.preferredTerm,
    ruleType: row.rule_type || row.ruleType,
    explanation: row.explanation,
    createdAt: row.created_at || row.createdAt
  };
}

export class TerminologyRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<TerminologyRule[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('terminology_rules').select('*').eq('org_id', orgId);
        if (!error && Array.isArray(data)) return data.map(toRule);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
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

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('terminology_rules').insert({
          id,
          org_id: rule.orgId,
          term_pattern: rule.termPattern,
          preferred_term: rule.preferredTerm,
          rule_type: rule.ruleType,
          explanation: rule.explanation
        }).select().single();
        if (!error && data) {
          const item = toRule(data);
          inMemoryDb.terminology.set(id, item);
          inMemoryDb.persist();
          return item;
        }
      } catch (err) {
        console.warn('Supabase insert failed, using fallback store:', err);
      }
    }

    inMemoryDb.terminology.set(id, newRule);
    inMemoryDb.persist();
    return newRule;
  }
}
