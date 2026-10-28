import { BrandAuditStateType } from '../state.js';
import { ViolationItem } from '@inkloom/shared';
import { GuidelineIndexer } from '@inkloom/vector-store';
import { getGroqChatModel, limitPromptText } from '../groq-client.js';

export async function toneNode(state: BrandAuditStateType): Promise<Partial<BrandAuditStateType>> {
  const text = state.rawText;
  const violations: ViolationItem[] = [];

  // Query vector store for relevant tone & voice guidelines
  const relevantGuidelines = await GuidelineIndexer.findRelevantGuidelines(text, 2);
  const guidelineContext = relevantGuidelines.map(g => g.document.text).join('\n');

  const groq = getGroqChatModel();

  if (groq) {
    try {
      const prompt = `You are the Inkloom AI Tone & Voice Governance Agent.
Analyze the following marketing content for tone drift, sensationalism, hyperbolic claims, and lack of professional authority.
Brand Guidelines Context:
${guidelineContext}

Content to Review:
"${limitPromptText(text)}"

If there are tone violations, return a JSON array containing objects with:
- "violatingExcerpt": the exact text snippet
- "explanation": why it violates tone guidelines
- "suggestedRewrite": a constructive rewrite preserving author's intent
- "ruleCitation": citation from the guideline

Only respond with the JSON array, or [] if completely compliant.`;

      const response = await groq.invoke(prompt);
      const content = String(response.content).trim();
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
        for (const item of parsed) {
          violations.push({
            id: `viol_tone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            category: 'tone',
            severity: 'moderate',
            violatingExcerpt: item.violatingExcerpt || 'Tone mismatch',
            explanation: item.explanation || 'Tone is inconsistent with brand voice.',
            ruleCitation: item.ruleCitation || 'Brand Guideline: Tone & Voice',
            suggestedRewrite: item.suggestedRewrite || 'Professional alternative',
            status: 'open'
          });
        }
      }
    } catch (e) {
      console.warn('Groq tone analysis fallback:', e);
    }
  }

  // Fallback / deterministic semantic tone check (detects hyperbolic phrases)
  if (violations.length === 0) {
    const hyperbolicPatterns = [
      { pattern: /revolutionary/i, excerpt: 'revolutionary', suggestion: 'innovative or modern', explanation: 'Sensationalist buzzword that reduces technical credibility.' },
      { pattern: /magic/i, excerpt: 'magic', suggestion: 'algorithmic or automated', explanation: 'AI capabilities should be described with transparent engineering terms rather than magical framing.' },
      { pattern: /game-changer/i, excerpt: 'game-changer', suggestion: 'significant advancement', explanation: 'Overused promotional cliché that drifts away from measured executive voice.' }
    ];

    for (const hp of hyperbolicPatterns) {
      if (hp.pattern.test(text)) {
        violations.push({
          id: `viol_tone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: 'tone',
          severity: 'moderate',
          violatingExcerpt: hp.excerpt,
          explanation: hp.explanation,
          ruleCitation: 'Brand Guideline: Section 1.2 — Authoritative Voice',
          suggestedRewrite: hp.suggestion,
          status: 'open'
        });
      }
    }
  }

  return { toneViolations: violations };
}
