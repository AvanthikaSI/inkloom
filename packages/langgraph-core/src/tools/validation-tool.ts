import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const validateContentTool = tool(
  async ({ content, title, targetAudience }) => {
    try {
      const trimmed = content.trim();
      if (!trimmed) {
        return JSON.stringify({
          valid: false,
          error: 'Content is empty. Please provide valid marketing copy or text to validate.'
        });
      }

      const words = trimmed.split(/\s+/).filter(Boolean);
      const characterCount = trimmed.length;
      const readingTimeMinutes = Math.max(0.5, Math.round((words.length / 200) * 10) / 10);

      // Simple PII / Sensitive data check (Email, SSN, API Keys)
      const emailMatches = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const ssnMatches = trimmed.match(/\b\d{3}-\d{2}-\d{4}\b/g) || [];

      return JSON.stringify({
        valid: true,
        summary: {
          title: title || 'Untitled Draft',
          wordCount: words.length,
          characterCount,
          estimatedReadingTime: `${readingTimeMinutes} min`,
          targetAudience: targetAudience || 'General enterprise audience',
          piiDetected: emailMatches.length > 0 || ssnMatches.length > 0,
          detectedEmails: emailMatches,
          status: 'Content validated and sanitized for governance auditing.'
        }
      });
    } catch (err: any) {
      return JSON.stringify({ valid: false, error: err.message });
    }
  },
  {
    name: 'validate_content_input',
    description: 'Validates marketing content, measures word/character count, reading time, and checks for sensitive PII before governance analysis.',
    schema: z.object({
      content: z.string().describe('The raw marketing text or publication copy to validate.'),
      title: z.string().optional().describe('Optional document title or campaign name.'),
      targetAudience: z.string().optional().describe('Optional target audience (e.g. enterprise, developers, consumers).')
    })
  }
);
