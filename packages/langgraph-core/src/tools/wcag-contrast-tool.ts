import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PythonBridgeService } from '../../../../apps/server/src/services/python-bridge.service.js';

export const checkContrastWCAGTool = tool(
  async ({ foregroundHex, backgroundHex }) => {
    try {
      const res = await PythonBridgeService.checkContrast(foregroundHex, backgroundHex);
      if (res.success && res.data) {
        return JSON.stringify({
          foreground: foregroundHex,
          background: backgroundHex,
          contrastRatio: `${res.data.contrast_ratio}:1`,
          wcagAANormalTextPass: res.data.wcag_aa_normal,
          wcagAALargeTextPass: res.data.wcag_aa_large,
          wcagAAANormalTextPass: res.data.wcag_aaa_normal,
          complianceStatus: res.data.status,
          guidance: res.data.wcag_aa_normal
            ? 'Complies with WCAG 2.1 AA contrast requirements (minimum 4.5:1).'
            : 'Fails WCAG 2.1 AA for body text. Darken foreground or lighten background to achieve at least 4.5:1.'
        });
      }

      return JSON.stringify({
        error: res.error || 'Failed to compute contrast ratio.',
        status: 'ERROR'
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message, status: 'ERROR' });
    }
  },
  {
    name: 'check_wcag_contrast',
    description: 'Calculates the exact W3C WCAG 2.1 relative luminance and contrast ratio between foreground text and background colors.',
    schema: z.object({
      foregroundHex: z.string().describe('The Hex color code for the text or foreground element (e.g., "#0F172A").'),
      backgroundHex: z.string().describe('The Hex color code for the background (e.g., "#FFFFFF").')
    })
  }
);
