/**
 * Test Suite for Agentic AI Tools & LangGraph Orchestrator
 */

import {
  allAgentTools,
  validateContentTool,
  queryGuidelinesTool,
  queryFactsTool,
  checkTerminologyTool,
  verifyClaimSubstantiationTool,
  checkContrastWCAGTool,
  auditContentTool,
  applySurgicalPatchTool,
  getAmbiguityMetricsTool,
  agenticWorkflow,
  hasGroqKey
} from '@inkloom/langgraph-core';

async function runAgenticTests() {
  console.log('========================================================');
  console.log('   INKLOOM AI — AGENTIC AI & TOOLS TEST SUITE           ');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Tool Registration Verification
  assert(allAgentTools.length === 9, `Tool Registry: Registered 9 LangChain tools (found ${allAgentTools.length})`);

  // 2. Validate Content Input Tool
  const valResStr = await validateContentTool.invoke({
    content: 'Inkloom AI provides brand governance for enterprise marketing.',
    title: 'Q4 Announcement'
  });
  const valRes = JSON.parse(valResStr);
  assert(valRes.valid === true && valRes.summary.wordCount === 8, 'Tool: validate_content_input executes and parses metrics');

  // 3. Query Brand Guidelines Tool
  const guideResStr = await queryGuidelinesTool.invoke({ query: 'authoritative tone', limit: 2 });
  const guideRes = JSON.parse(guideResStr);
  assert(guideRes.totalMatches >= 1, `Tool: query_brand_guidelines returns relevant rules (${guideRes.totalMatches} matches)`);

  // 4. Query Approved Facts Tool
  const factResStr = await queryFactsTool.invoke({ statementQuery: 'latency SLA benchmark' });
  const factRes = JSON.parse(factResStr);
  assert(factRes.totalFacts >= 1 || (factRes.results && factRes.results.length >= 1), 'Tool: query_approved_facts queries verified facts');

  // 5. Check Brand Terminology Tool
  const termResStr = await checkTerminologyTool.invoke({
    text: 'Our cheap tool named InkLoom uses magic AI.'
  });
  const termRes = JSON.parse(termResStr);
  assert(termRes.compliant === false && termRes.totalViolations >= 3, `Tool: check_brand_terminology detects prohibited terms (${termRes.totalViolations} found)`);

  // 6. Verify Promotional Claim Tool
  const claimResStr = await verifyClaimSubstantiationTool.invoke({
    claimStatement: 'Inkloom is the fastest platform in the world with zero latency.'
  });
  const claimRes = JSON.parse(claimResStr);
  assert(claimRes.status === 'CRITICAL_UNSUPPORTED_PROMOTIONAL_CLAIM', 'Tool: verify_promotional_claim flags unsupported superlatives');

  // 7. Check WCAG Contrast Tool (using real Python worker)
  const contrastResStr = await checkContrastWCAGTool.invoke({
    foregroundHex: '#0F172A',
    backgroundHex: '#FFFFFF'
  });
  const contrastRes = JSON.parse(contrastResStr);
  assert(contrastRes.wcagAANormalTextPass === true, `Tool: check_wcag_contrast executes Python worker (${contrastRes.contrastRatio})`);

  // 8. Run Brand Governance Audit Tool
  const auditResStr = await auditContentTool.invoke({
    text: 'We are thrilled to announce InkLoom, the cheap tool with zero latency and 100% infallible compliance.'
  });
  const auditRes = JSON.parse(auditResStr);
  assert(auditRes.riskTier === 'critical_blocker' && auditRes.overallComplianceScore < 70, 'Tool: run_brand_governance_audit executes multi-agent audit');

  // 9. Ambiguity Metrics Tool
  const ambigResStr = await getAmbiguityMetricsTool.invoke({ minFrictionThreshold: 0.1 });
  const ambigRes = JSON.parse(ambigResStr);
  assert(ambigRes.totalAnalyzedGuidelines >= 1, 'Tool: get_guideline_ambiguity_metrics returns friction metrics');

  // 10. LangGraph Agentic Workflow Execution
  console.log('\nExecuting LangGraph Stateful Agentic Workflow...');
  const state = await agenticWorkflow.invoke({
    sessionId: 'test_agentic_session_01',
    userMessage: 'Please verify if claiming "Inkloom has zero latency and 100% infallible compliance" is allowed.',
    conversationHistory: [],
    activeAgent: 'Master Orchestrator',
    maxSteps: 5
  });

  assert(Boolean(state.finalResponse && state.finalResponse.length > 0), 'LangGraph Workflow: Produces grounded response');
  assert(state.isComplete === true, 'LangGraph Workflow: Reaches completion state gracefully');

  // 11. Empty input validation check
  const emptyState = await agenticWorkflow.invoke({
    sessionId: 'test_empty_session',
    userMessage: '   ',
    conversationHistory: [],
    activeAgent: 'Master Orchestrator',
    maxSteps: 5
  });
  assert(emptyState.needsClarification === true, 'LangGraph Workflow: Detects missing/empty input and requests clarification');

  console.log('\n--------------------------------------------------------');
  console.log(`Results: ${passed} / ${total} agentic tests passed.`);
  console.log('--------------------------------------------------------');

  if (passed === total) {
    console.log('🎉 ALL 11 AGENTIC AI, LANGCHAIN TOOLS & LANGGRAPH TESTS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAgenticTests().catch(err => {
  console.error('Fatal agentic test error:', err);
  process.exit(1);
});
