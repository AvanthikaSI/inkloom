import { ApprovedFact } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toFact(row: any): ApprovedFact {
  return {
    id: row.id,
    orgId: row.org_id || row.orgId,
    claimTopic: row.claim_topic || row.claimTopic,
    approvedStatement: row.approved_statement || row.approvedStatement,
    sourceCitation: row.source_citation || row.sourceCitation,
    verificationDate: row.verification_date || row.verificationDate,
    isActive: row.is_active ?? row.isActive ?? true,
    createdAt: row.created_at || row.createdAt
  };
}

export class FactRepository {
  public static async getAll(orgId: string = 'org_inkloom_01'): Promise<ApprovedFact[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('approved_facts').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          const filtered = data.filter((row: any) => !orgId || (row.org_id || row.orgId) === orgId || !row.org_id);
          return (filtered.length > 0 ? filtered : data).map(toFact);
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
    }
    const all = Array.from(inMemoryDb.facts.values());
    const filtered = all.filter(f => (!orgId || f.orgId === orgId || !f.orgId) && f.isActive !== false);
    return filtered.length > 0 ? filtered : all.filter(f => f.isActive !== false);
  }

  public static async create(fact: Omit<ApprovedFact, 'id' | 'createdAt'>): Promise<ApprovedFact> {
    const id = `fact_${Date.now()}`;
    const newFact: ApprovedFact = {
      ...fact,
      id,
      createdAt: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('approved_facts').insert({
          id,
          org_id: fact.orgId,
          claim_topic: fact.claimTopic,
          approved_statement: fact.approvedStatement,
          source_citation: fact.sourceCitation,
          verification_date: fact.verificationDate,
          is_active: fact.isActive ?? true
        }).select().single();
        if (!error && data) {
          const item = toFact(data);
          inMemoryDb.facts.set(id, item);
          inMemoryDb.persist();
          return item;
        }
      } catch (err) {
        console.warn('Supabase insert failed, using fallback store:', err);
      }
    }

    inMemoryDb.facts.set(id, newFact);
    inMemoryDb.persist();
    return newFact;
  }
}
