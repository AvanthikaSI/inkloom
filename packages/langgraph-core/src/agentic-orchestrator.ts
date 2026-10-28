import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { createGroqChatModel, hasGroqKey, getGroqModelName, limitPromptText } from './groq-client.js';
import { allAgentTools } from './tools/index.js';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatDraftContext } from '@inkloom/shared';

export interface ToolExecutionRecord {
  toolName: string;
  input: any;
  outputSummary: string;
  timestamp: string;
  status: 'running' | 'success' | 'error';
}

export interface StructuredFinding {
  category: string;
  severity: 'critical' | 'moderate' | 'minor' | 'info';
  title: string;
  details: string;
  evidenceCitation?: string;
  recommendation?: string;
}

export const AgenticChatAnnotation = Annotation.Root({
  sessionId: Annotation<string>(),
  userMessage: Annotation<string>(),
  conversationHistory: Annotation<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  activeDraft: Annotation<ChatDraftContext | undefined>({
    reducer: (_, update) => update,
    default: () => undefined
  }),

  // Orchestrator & Specialized Agent State
  activeAgent: Annotation<string>({
    reducer: (_, update) => update,
    default: () => 'Orchestrator Agent'
  }),
  executionPlan: Annotation<string[]>({
    reducer: (_, update) => update,
    default: () => []
  }),
  stepCount: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0
  }),
  maxSteps: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 5
  }),

  // Tool Execution State
  pendingToolName: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null
  }),
  pendingToolArgs: Annotation<any>({
    reducer: (_, update) => update,
    default: () => null
  }),
  toolExecutions: Annotation<ToolExecutionRecord[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  lastToolOutput: Annotation<any>({
    reducer: (_, update) => update,
    default: () => null
  }),

  // Completion & Findings
  isComplete: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false
  }),
  needsClarification: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false
  }),
  clarificationPrompt: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined
  }),
  structuredFindings: Annotation<StructuredFinding[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  evidence: Annotation<string[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => []
  }),
  finalResponse: Annotation<string>({
    reducer: (_, update) => update,
    default: () => ''
  }),
  error: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined
  })
});

export type AgenticChatStateType = typeof AgenticChatAnnotation.State;

/**
 * Node 1: Request Validator
 */
export async function validateRequestNode(state: AgenticChatStateType): Promise<Partial<AgenticChatStateType>> {
  const query = state.userMessage ? state.userMessage.trim() : '';

  if (!query) {
    return {
      needsClarification: true,
      clarificationPrompt: 'Please specify the marketing copy, brand guideline, claim, or visual standard you would like to analyze.',
      finalResponse: 'Please provide a valid question, marketing statement, or content to review.',
      isComplete: true
    };
  }

  // Check if Groq API key is present
  if (!hasGroqKey()) {
    return {
      activeAgent: 'System Guardian',
      finalResponse: '⚠️ **Groq API Key Required**: Please configure `GROQ_API_KEY` in your `.env` file to enable live agentic reasoning with Groq (Model: `' + getGroqModelName() + '`).',
      isComplete: true
    };
  }

  return {
    needsClarification: false,
    stepCount: 0
  };
}

/**
 * Node 2: Orchestrator Planner
 */
export async function orchestratorPlannerNode(state: AgenticChatStateType): Promise<Partial<AgenticChatStateType>> {
  if (state.isComplete) return {};

  const query = state.userMessage;
  const groq = createGroqChatModel(0.1);

  if (!groq) {
    return {
      finalResponse: 'Unable to initialize Groq model. Check GROQ_API_KEY.',
      isComplete: true
    };
  }

  // Bind tools to Groq model for native function calling
  const groqWithTools = groq.bindTools(allAgentTools);

  const systemPrompt = `You are the Inkloom AI Master Brand-Governance Orchestrator.
Your goal is to safeguard enterprise brand identity by reviewing content across Tone, Terminology, Factual Claims, Visual Assets, and WCAG Accessibility.
Analyze the user's request and choose the most suitable specialized agent role:
1. "Brand Policy Investigator": for tone of voice, terminology, banned words, and style rules.
2. "Factual Claim Verifier": for verifying superlatives, benchmarks, uptime SLAs, and citations.
3. "Design & A11y Analyst": for WCAG color contrast, luminance, and palette compliance.
4. "Governance Audit Agent": for comprehensive document audits, surgical diff patching, and guideline friction analysis.

Select and call the appropriate registered LangChain tool to gather genuine evidence. If you already have sufficient observations to answer comprehensively, formulate the final grounded response.

Active draft context: ${state.activeDraft ? `contentId=${state.activeDraft.contentId}; title=${state.activeDraft.title || 'Untitled'}; text=${limitPromptText(state.activeDraft.text || '', 8000)}` : 'No draft is currently selected.'}

When the user asks to apply, accept, or implement a prior recommendation and an active draft is available, call apply_surgical_patch using that contentId and the exact relevant excerpt/replacement. Do not ask for a contentId that is already present in Active draft context.`;

  try {
    const history = state.conversationHistory.slice(-4).map(h => 
      h.role === 'user' ? new HumanMessage(limitPromptText(h.content, 4000)) : new AIMessage(limitPromptText(h.content, 4000))
    );

    const response = await groqWithTools.invoke([
      new SystemMessage(systemPrompt),
      ...history,
      new HumanMessage(limitPromptText(query, 8000))
    ]);

    // Check if tool call requested
    if (response.tool_calls && response.tool_calls.length > 0) {
      const call = response.tool_calls[0];
      let agentRole = 'Governance Audit Agent';
      if (call.name.includes('guideline') || call.name.includes('terminology')) agentRole = 'Brand Policy Investigator';
      else if (call.name.includes('claim') || call.name.includes('fact')) agentRole = 'Factual Claim Verifier';
      else if (call.name.includes('contrast')) agentRole = 'Design & A11y Analyst';

      return {
        activeAgent: agentRole,
        pendingToolName: call.name,
        pendingToolArgs: call.args,
        stepCount: (state.stepCount || 0) + 1
      };
    }

    // Direct response without further tools
    return {
      activeAgent: 'Governance Synthesis Agent',
      finalResponse: String(response.content || ''),
      isComplete: true
    };
  } catch (err: any) {
    console.error('[Orchestrator] Error:', err);
    return {
      error: err.message,
      finalResponse: `Error during agent orchestration: ${err.message}`,
      isComplete: true
    };
  }
}

/**
 * Node 3: Tool Execution Node
 */
export async function toolExecutorNode(state: AgenticChatStateType): Promise<Partial<AgenticChatStateType>> {
  const toolName = state.pendingToolName;
  const toolArgs = state.pendingToolArgs;

  if (!toolName) {
    return { isComplete: true };
  }

  const tool = allAgentTools.find(t => t.name === toolName);
  if (!tool) {
    return {
      pendingToolName: null,
      error: `Tool ${toolName} not found.`,
      isComplete: true
    };
  }

  const startTime = new Date().toISOString();
  try {
    const result = await (tool as any).invoke(toolArgs);
    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

    // Generate concise summary for UI transparency
    let summary = `Executed ${toolName}`;
    if (toolName === 'check_brand_terminology') {
      summary = `Scanned text: ${parsedResult.totalViolations || 0} prohibited terms detected.`;
    } else if (toolName === 'verify_promotional_claim') {
      summary = `Claim status: ${parsedResult.status} (Verified: ${parsedResult.verified})`;
    } else if (toolName === 'check_wcag_contrast') {
      summary = `Contrast ${parsedResult.contrastRatio} — Status: ${parsedResult.complianceStatus}`;
    } else if (toolName === 'run_brand_governance_audit') {
      summary = `Audit completed: Score ${parsedResult.overallComplianceScore}/100, Tier: ${parsedResult.riskTier}`;
    } else if (toolName === 'query_brand_guidelines') {
      summary = `Retrieved ${parsedResult.totalMatches || 0} guidelines from knowledge base.`;
    }

    const executionRecord: ToolExecutionRecord = {
      toolName,
      input: toolArgs,
      outputSummary: summary,
      timestamp: startTime,
      status: 'success'
    };

    return {
      pendingToolName: null,
      pendingToolArgs: null,
      lastToolOutput: parsedResult,
      toolExecutions: [executionRecord]
    };
  } catch (err: any) {
    const errorRecord: ToolExecutionRecord = {
      toolName,
      input: toolArgs,
      outputSummary: `Execution failed: ${err.message}`,
      timestamp: startTime,
      status: 'error'
    };

    return {
      pendingToolName: null,
      pendingToolArgs: null,
      error: err.message,
      toolExecutions: [errorRecord]
    };
  }
}

/**
 * Node 4: Evaluator Node
 */
export async function evaluatorNode(state: AgenticChatStateType): Promise<Partial<AgenticChatStateType>> {
  if (state.isComplete) return {};

  const stepCount = state.stepCount || 0;
  const maxSteps = state.maxSteps || 5;

  // Loop protection
  if (stepCount >= maxSteps) {
    return {
      isComplete: true,
      activeAgent: 'Audit Reporting Agent'
    };
  }

  // If a tool output was gathered, proceed to synthesis
  if (state.lastToolOutput) {
    return {
      isComplete: true,
      activeAgent: 'Audit Reporting Agent'
    };
  }

  return { isComplete: true };
}

/**
 * Node 5: Response Synthesizer Node
 */
export async function responseSynthesizerNode(state: AgenticChatStateType): Promise<Partial<AgenticChatStateType>> {
  if (state.finalResponse && state.finalResponse.trim()) {
    return { isComplete: true };
  }

  const groq = createGroqChatModel(0.2);
  const toolExecs = state.toolExecutions || [];
  const lastOutput = state.lastToolOutput;

  if (!groq) {
    return {
      finalResponse: JSON.stringify(lastOutput, null, 2),
      isComplete: true
    };
  }

  const prompt = `You are the Inkloom AI Lead Brand-Governance Guardian.
Synthesize a comprehensive, authoritative, yet constructive response for the user's request:
"${limitPromptText(state.userMessage, 8000)}"

Tool Executed:
${JSON.stringify(toolExecs.map(e => ({ tool: e.toolName, summary: e.outputSummary })), null, 2)}

Actual Evidence & Data Gathered:
${limitPromptText(JSON.stringify(lastOutput, null, 2), 12000)}

Formatting Guidelines:
1. Provide a direct, professional verdict on brand compliance.
2. Structure your findings clearly with bullet points.
3. Cite exact brand guideline rules or source facts whenever applicable.
4. Present non-destructive, surgical rewrite suggestions that preserve the creator's voice and intent.
5. If there are violations, specify their 3-Tier risk level (Critical Blocker, Moderate Warning, or Minor Polish).`;

  try {
    const res = await groq.invoke([new HumanMessage(prompt)]);
    const responseText = String(res.content);

    // Extract structured findings for UI badges
    const findings: StructuredFinding[] = [];
    if (lastOutput) {
      if (lastOutput.violations && Array.isArray(lastOutput.violations)) {
        for (const v of lastOutput.violations) {
          findings.push({
            category: v.category || 'General',
            severity: v.severity || 'moderate',
            title: v.violatingExcerpt || 'Policy Issue',
            details: v.explanation || '',
            evidenceCitation: v.ruleCitation,
            recommendation: v.suggestedRewrite
          });
        }
      } else if (lastOutput.status === 'CRITICAL_UNSUPPORTED_PROMOTIONAL_CLAIM') {
        findings.push({
          category: 'Promotional Claim',
          severity: 'critical',
          title: lastOutput.claimStatement,
          details: 'Superlative or unverified metric lacking benchmark documentation.',
          evidenceCitation: lastOutput.substantiationCitation,
          recommendation: lastOutput.suggestedGuidance
        });
      } else if (lastOutput.contrastRatio) {
        findings.push({
          category: 'Accessibility',
          severity: lastOutput.wcagAANormalTextPass ? 'info' : 'moderate',
          title: `Contrast Ratio ${lastOutput.contrastRatio}`,
          details: lastOutput.guidance,
          recommendation: lastOutput.wcagAANormalTextPass ? 'Complies with WCAG 2.1 AA' : 'Increase color contrast to >= 4.5:1'
        });
      }
    }

    return {
      finalResponse: responseText,
      structuredFindings: findings,
      isComplete: true
    };
  } catch (err: any) {
    return {
      finalResponse: `Analysis completed based on gathered evidence:\n\n${JSON.stringify(lastOutput, null, 2)}`,
      isComplete: true
    };
  }
}

/**
 * Conditional Edge Router
 */
function routeAfterPlanner(state: AgenticChatStateType): string {
  if (state.isComplete) return 'synthesizer';
  if (state.pendingToolName) return 'toolExecutor';
  return 'synthesizer';
}

function routeAfterEvaluator(state: AgenticChatStateType): string {
  if (state.isComplete) return 'synthesizer';
  return 'planner';
}

/**
 * Compiles the Master Stateful LangGraph Workflow
 */
export function createAgenticWorkflow() {
  const workflow = new StateGraph(AgenticChatAnnotation)
    .addNode('validator', validateRequestNode)
    .addNode('planner', orchestratorPlannerNode)
    .addNode('toolExecutor', toolExecutorNode)
    .addNode('evaluator', evaluatorNode)
    .addNode('synthesizer', responseSynthesizerNode)

    .addEdge(START, 'validator')
    .addConditionalEdges('validator', (state) => state.isComplete ? END : 'planner')
    .addConditionalEdges('planner', routeAfterPlanner, {
      toolExecutor: 'toolExecutor',
      synthesizer: 'synthesizer'
    })
    .addEdge('toolExecutor', 'evaluator')
    .addConditionalEdges('evaluator', routeAfterEvaluator, {
      planner: 'planner',
      synthesizer: 'synthesizer'
    })
    .addEdge('synthesizer', END);

  return workflow.compile();
}

export const agenticWorkflow = createAgenticWorkflow();
