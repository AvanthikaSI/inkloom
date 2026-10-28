import { StateGraph, START, END } from '@langchain/langgraph';
import { BrandAuditAnnotation, BrandAuditStateType } from './state.js';
import { linterNode } from './nodes/linter-node.js';
import { toneNode } from './nodes/tone-node.js';
import { factNode } from './nodes/fact-node.js';
import { visionNode } from './nodes/vision-node.js';
import { synthesizerNode } from './nodes/synthesizer-node.js';
import { riskScorerNode } from './nodes/risk-scorer-node.js';

export function createBrandAuditGraph() {
  const workflow = new StateGraph(BrandAuditAnnotation)
    .addNode('linter', linterNode)
    .addNode('tone', toneNode)
    .addNode('fact', factNode)
    .addNode('vision', visionNode)
    .addNode('synthesizer', synthesizerNode)
    .addNode('riskScorer', riskScorerNode)

    // Pipeline flow: Start -> Linter -> Tone -> Fact -> Vision -> Synthesizer -> RiskScorer -> End
    .addEdge(START, 'linter')
    .addEdge('linter', 'tone')
    .addEdge('tone', 'fact')
    .addEdge('fact', 'vision')
    .addEdge('vision', 'synthesizer')
    .addEdge('synthesizer', 'riskScorer')
    .addEdge('riskScorer', END);

  return workflow.compile();
}

export const brandAuditGraph = createBrandAuditGraph();
