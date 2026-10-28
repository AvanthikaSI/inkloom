export * from './validation-tool.js';
export * from './guidelines-tool.js';
export * from './facts-tool.js';
export * from './terminology-tool.js';
export * from './claim-verifier-tool.js';
export * from './wcag-contrast-tool.js';
export * from './audit-content-tool.js';
export * from './surgical-patch-tool.js';
export * from './ambiguity-metrics-tool.js';

import { validateContentTool } from './validation-tool.js';
import { queryGuidelinesTool } from './guidelines-tool.js';
import { queryFactsTool } from './facts-tool.js';
import { checkTerminologyTool } from './terminology-tool.js';
import { verifyClaimSubstantiationTool } from './claim-verifier-tool.js';
import { checkContrastWCAGTool } from './wcag-contrast-tool.js';
import { auditContentTool } from './audit-content-tool.js';
import { applySurgicalPatchTool } from './surgical-patch-tool.js';
import { getAmbiguityMetricsTool } from './ambiguity-metrics-tool.js';

export const allAgentTools = [
  validateContentTool,
  queryGuidelinesTool,
  queryFactsTool,
  checkTerminologyTool,
  verifyClaimSubstantiationTool,
  checkContrastWCAGTool,
  auditContentTool,
  applySurgicalPatchTool,
  getAmbiguityMetricsTool
];
