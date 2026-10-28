import { Annotation } from '@langchain/langgraph';
import { ViolationItem, RiskTier } from '@inkloom/shared';

export interface VisualMetadataInput {
  dominantColors: Array<{ hex: string; percentage: number }>;
  contrastChecks: Array<{ foreground: string; background: string; contrast_ratio: number; status: string }>;
  dimensions?: { width: number; height: number };
}

export const BrandAuditAnnotation = Annotation.Root({
  orgId: Annotation<string>(),
  contentId: Annotation<string>(),
  rawText: Annotation<string>(),
  visualData: Annotation<VisualMetadataInput | undefined>(),
  
  // Agent violation outputs
  linterViolations: Annotation<ViolationItem[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  toneViolations: Annotation<ViolationItem[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  factViolations: Annotation<ViolationItem[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  visualViolations: Annotation<ViolationItem[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),

  // Final consolidated report
  allViolations: Annotation<ViolationItem[]>({
    reducer: (_, update) => update,
    default: () => []
  }),
  overallScore: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 100
  }),
  riskTier: Annotation<RiskTier>({
    reducer: (_, update) => update,
    default: () => 'pass'
  }),
  categoryScores: Annotation<Record<string, number>>({
    reducer: (_, update) => update,
    default: () => ({})
  })
});

export type BrandAuditStateType = typeof BrandAuditAnnotation.State;
