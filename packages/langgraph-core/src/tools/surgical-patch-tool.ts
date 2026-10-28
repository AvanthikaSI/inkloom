import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ContentRepository, AuditRepository, WorkflowRepository } from '@inkloom/database';
import { applySurgicalPatch } from '@inkloom/shared';

export const applySurgicalPatchTool = tool(
  async ({ contentId, originalExcerpt, replacementText }) => {
    try {
      const item = await ContentRepository.getById(contentId);
      if (!item) {
        return JSON.stringify({
          success: false,
          error: `Content item with ID "${contentId}" not found.`
        });
      }

      const patch = applySurgicalPatch(item.rawText, originalExcerpt, replacementText);
      if (!patch.success) {
        return JSON.stringify({
          success: false,
          error: `Excerpt "${originalExcerpt}" was not found in document text.`
        });
      }

      const updated = await ContentRepository.update(contentId, { rawText: patch.newText });
      await WorkflowRepository.logAction({
        contentId,
        actorId: 'agent_brand_copilot',
        actorName: 'Agentic Brand Guardian',
        action: 'applied_suggestion',
        metadata: { originalExcerpt, replacementText }
      });

      return JSON.stringify({
        success: true,
        contentId,
        updatedText: updated?.rawText,
        message: `Successfully applied intent-preserving patch: "${originalExcerpt}" -> "${replacementText}".`
      });
    } catch (err: any) {
      return JSON.stringify({ success: false, error: err.message });
    }
  },
  {
    name: 'apply_surgical_patch',
    description: 'Surgically replaces a violating excerpt in a draft document with an approved rewrite while preserving the author\'s original context, voice, and sentence rhythm.',
    schema: z.object({
      contentId: z.string().describe('The ID of the content document to update.'),
      originalExcerpt: z.string().describe('The exact violating excerpt to replace.'),
      replacementText: z.string().describe('The approved brand-compliant replacement text.')
    })
  }
);
