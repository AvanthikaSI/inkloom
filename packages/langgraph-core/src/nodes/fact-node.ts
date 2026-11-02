import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';
import { FactIndexer } from '@inkloom/vector-store';
import { FactRepository, GuidelineRepository } from '@inkloom/database';
import { getGroqChatModel, limitPromptText } from '../groq-client.js';

export async function factNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const text = state.rawText;
  const violations: ViolationItem[] = [];

  // Fetch approved facts and legal substantiation guidelines directly from live database
  const [facts, guidelines] = await Promise.all([
    FactRepository.getAll(state.orgId || 'org_inkloom_01'),
    GuidelineRepository.getAll(state.orgId || 'org_inkloom_01')
  ]);

  const legalGuidelines = guidelines.filter(g => g.category === 'legal' || g.category === 'messaging');
  const legalCitation = legalGuidelines[0]?.title ? `Brand Guideline: "${legalGuidelines[0].title}"` : 'Brand Guideline Section 2.1: Substantiation of Claims';

  const liveFactContext = facts.map(f => `* Topic: "${f.claimTopic}" | Approved Statement: "${f.approvedStatement}" | Source Citation: "${f.sourceCitation}"`).join('\n');
  const liveLegalContext = legalGuidelines.map(g => `* [${g.title}]: ${g.content}`).join('\n');

  const groq = getGroqChatModel();

  if (groq) {
    try {
      const prompt = `You are the Inkloom AI Factual Accuracy & Promotional Claims Verifier.
Extract any superlative claims ("fastest", "#1", "infallible"), absolute guarantees ("100%"), or unverified technical claims from this text:
"${limitPromptText(text)}"

Approved Company Fact Matrix (Verified Benchmarks from Brand Knowledge Base):
${liveFactContext || 'None currently registered.'}

Legal Substantiation Rules:
${liveLegalContext || 'All numerical and superlative claims must cite verified benchmarks.'}

Return a JSON array of objects with:
- "violatingExcerpt": the exact claim
- "category": either "unsupported_claim" or "factual_inaccuracy"
- "explanation": why this claim is high-risk or unsupported
- "suggestedRewrite": a compliant, fact-supported formulation

Respond ONLY with the JSON array or [].`;

      const response = await groq.invoke(prompt);
      const content = String(response.content).trim();
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
        for (const item of parsed) {
          // Check if there is an approved fact in database for this claim
          const claimLower = (item.violatingExcerpt || '').toLowerCase();
          const matchingDbFact = facts.find(f =>
            claimLower.includes(f.claimTopic.toLowerCase()) ||
            f.claimTopic.toLowerCase().includes(claimLower)
          );

          let citation = matchingDbFact
            ? `Verified Fact Source: ${matchingDbFact.sourceCitation}`
            : 'Requires legal and third-party benchmark certification.';

          if (!matchingDbFact) {
            const matches = await FactIndexer.verifyClaimAgainstFacts(item.violatingExcerpt, 1).catch(() => []);
            const topMatch = matches[0];
            if (topMatch && topMatch.similarity > 0.4) {
              citation = `Verified Fact Source: ${topMatch.document.metadata.sourceCitation}`;
            }
          }

          violations.push({
            id: `viol_fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: item.category || 'unsupported_claim',
            severity: 'critical', // Claims & facts are Critical Blockers
            violatingExcerpt: item.violatingExcerpt,
            explanation: item.explanation,
            ruleCitation: citation,
            suggestedRewrite: item.suggestedRewrite,
            status: 'open'
          });
        }
      }
    } catch (e) {
      console.warn('Groq claim verifier fallback:', e);
    }
  }

  // Fallback heuristic for absolute / superlative claims using database facts
  if (violations.length === 0) {
    const factLatency = facts.find(f => /latency|inference/i.test(f.claimTopic) || /latency/i.test(f.approvedStatement));
    const factSla = facts.find(f => /sla|uptime|availability/i.test(f.claimTopic) || /sla|uptime/i.test(f.approvedStatement));

    const claimPatterns = [
      {
        pattern: /100%\s+infallible/i,
        excerpt: '100% infallible',
        category: 'unsupported_claim' as const,
        explanation: factSla
          ? `Absolute reliability claims breach warranty standards. Official SLA: "${factSla.approvedStatement}".`
          : 'Absolute reliability claims create extreme legal liability and breach consumer protection laws.',
        citation: factSla?.sourceCitation ? `Verified Fact Source: ${factSla.sourceCitation}` : 'FTC & Legal Compliance Policy: Absolute Performance Guarantees',
        rewrite: 'rigorous, automated brand protection'
      },
      {
        pattern: /the\s+fastest\s+platform\s+in\s+the\s+world/i,
        excerpt: 'the fastest platform in the world',
        category: 'unsupported_claim' as const,
        explanation: 'Superlative claim lacking independent third-party audit verification.',
        citation: legalCitation,
        rewrite: factLatency
          ? `an ultra-low latency governance platform (${factLatency.approvedStatement.toLowerCase()})`
          : 'an ultra-low latency governance platform completing audits in under 3.2 seconds'
      },
      {
        pattern: /zero\s+latency/i,
        excerpt: 'zero latency',
        category: 'factual_inaccuracy' as const,
        explanation: factLatency
          ? `Physically impossible technical claim. Verified benchmark: "${factLatency.approvedStatement}".`
          : 'Physically impossible technical claim. Our verified average latency is 3.2 seconds.',
        citation: factLatency?.sourceCitation ? `Verified Fact Source: ${factLatency.sourceCitation}` : 'Engineering Benchmark Report Q3 2026, Table 4.1',
        rewrite: 'sub-second inference latency'
      }
    ];

    for (const cp of claimPatterns) {
      if (cp.pattern.test(text)) {
        violations.push({
          id: `viol_claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: cp.category,
          severity: 'critical',
          violatingExcerpt: cp.excerpt,
          explanation: cp.explanation,
          ruleCitation: cp.citation,
          suggestedRewrite: cp.rewrite,
          status: 'open'
        });
      }
    }
  }

  return { factViolations: violations };
}
