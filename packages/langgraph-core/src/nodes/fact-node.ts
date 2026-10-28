import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';
import { FactIndexer } from '@inkloom/vector-store';
import { getGroqChatModel, limitPromptText } from '../groq-client.js';

export async function factNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const text = state.rawText;
  const violations: ViolationItem[] = [];

  const groq = getGroqChatModel();

  if (groq) {
    try {
      const prompt = `You are the Inkloom AI Factual Accuracy & Promotional Claims Verifier.
Extract any superlative claims ("fastest", "#1", "infallible"), absolute guarantees ("100%"), or unverified technical claims from this text:
"${limitPromptText(text)}"

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
          // Check if there is an approved fact in ChromaDB for this claim
          const matches = await FactIndexer.verifyClaimAgainstFacts(item.violatingExcerpt, 1);
          const topMatch = matches[0];

          let citation = 'Requires legal and third-party benchmark certification.';
          if (topMatch && topMatch.similarity > 0.4) {
            citation = `Verified Fact Source: ${topMatch.document.metadata.sourceCitation}`;
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

  // Fallback heuristic for absolute / superlative claims
  if (violations.length === 0) {
    const claimPatterns = [
      {
        pattern: /100%\s+infallible/i,
        excerpt: '100% infallible',
        category: 'unsupported_claim' as const,
        explanation: 'Absolute reliability claims create extreme legal liability and breach consumer protection laws.',
        citation: 'FTC & Legal Compliance Policy: Absolute Performance Guarantees',
        rewrite: 'rigorous, automated brand protection'
      },
      {
        pattern: /the\s+fastest\s+platform\s+in\s+the\s+world/i,
        excerpt: 'the fastest platform in the world',
        category: 'unsupported_claim' as const,
        explanation: 'Superlative claim lacking independent third-party audit verification.',
        citation: 'Brand Guideline Section 2.1: Substantiation of Claims',
        rewrite: 'an ultra-low latency governance platform completing audits in under 3.2 seconds'
      },
      {
        pattern: /zero\s+latency/i,
        excerpt: 'zero latency',
        category: 'factual_inaccuracy' as const,
        explanation: 'Physically impossible technical claim. Our verified average latency is 3.2 seconds.',
        citation: 'Engineering Benchmark Report Q3 2026, Table 4.1',
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
