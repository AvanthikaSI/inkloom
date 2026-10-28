/**
 * Comprehensive End-to-End Integration Test Suite for Inkloom AI
 * Verifies:
 * 1. Vector Store (ChromaDB client & cosine similarity)
 * 2. Python Bridge (Image palette, contrast ratio calculation)
 * 3. LangGraph Multi-Agent Pipeline (Linter, Tone, Fact, Vision, Synthesizer, RiskScorer)
 * 4. 3-Tier Risk Gating
 * 5. Surgical Intent-Preserving Patch Application
 * 6. Ambiguity Friction Index calculation
 */

import { GuidelineRepository, FactRepository, TerminologyRepository, ContentRepository } from '@inkloom/database';
import { GuidelineIndexer, FactIndexer } from '@inkloom/vector-store';
import { brandAuditGraph } from '@inkloom/langgraph-core';
import { PythonBridgeService } from '../apps/server/src/services/python-bridge.service.js';
import { calculateComplianceScore, applySurgicalPatch, computeAmbiguityIndex } from '@inkloom/shared';

async function runTests() {
  console.log('====================================================');
  console.log('   INKLOOM AI — END-TO-END VERIFICATION SUITE       ');
  console.log('====================================================\n');

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

  // TEST 1: Database Seed Verification
  const guidelines = await GuidelineRepository.getAll();
  const facts = await FactRepository.getAll();
  const rules = await TerminologyRepository.getAll();
  assert(guidelines.length >= 3, 'Seed Database: Guidelines loaded');
  assert(facts.length >= 3, 'Seed Database: Approved Facts loaded');
  assert(rules.length >= 4, 'Seed Database: Terminology rules loaded');

  // TEST 2: Vector Store Indexing & Retrieval
  await GuidelineIndexer.indexGuidelines(guidelines);
  await FactIndexer.indexFacts(facts);
  const factResults = await FactIndexer.verifyClaimAgainstFacts('latency benchmark', 2);
  assert(factResults.length > 0 && factResults[0].similarity > 0.1, 'Vector Store: Semantic Fact Retrieval functional');

  // TEST 3: Python Worker Bridge & WCAG Calculation
  const contrastRes = await PythonBridgeService.checkContrast('#0F172A', '#FFFFFF');
  assert(contrastRes.success && contrastRes.data.contrast_ratio >= 15.0, 'Python Bridge: WCAG Contrast calculation functional');

  // TEST 4: LangGraph Multi-Agent Pipeline Execution
  const sampleCopy = 'We are thrilled to announce InkLoom, the cheap and revolutionary game-changer that offers 100% infallible marketing compliance. Our magic AI engine is the fastest platform in the world, running with zero latency.';
  
  console.log('\nRunning LangGraph multi-agent pipeline on sample copy...');
  const auditState = await brandAuditGraph.invoke({
    orgId: 'org_inkloom_01',
    contentId: 'test_content_01',
    rawText: sampleCopy,
    visualData: {
      dominantColors: [{ hex: '#FF0055', percentage: 60 }],
      contrastChecks: [{ foreground: '#CCCCCC', background: '#FFFFFF', contrast_ratio: 1.6, status: 'FAIL' }]
    }
  });

  assert(auditState.allViolations.length >= 4, `LangGraph: Detected ${auditState.allViolations.length} multi-agent violations`);
  assert(auditState.riskTier === 'critical_blocker', 'Risk Gating: Correctly flagged as Critical Blocker due to unsupported claims');
  assert(auditState.overallScore < 50, `Risk Scoring: Compliance score penalized appropriately (${auditState.overallScore}/100)`);

  // Verify categories detected
  const categories = auditState.allViolations.map((v: any) => v.category);
  assert(categories.includes('terminology'), 'Multi-Agent: Terminology linter detected banned terms');
  assert(categories.includes('unsupported_claim') || categories.includes('factual_inaccuracy'), 'Multi-Agent: Claim verifier detected false claims');
  assert(categories.includes('accessibility') || categories.includes('visual_inconsistency'), 'Multi-Agent: Vision agent detected visual/contrast issues');

  // TEST 5: Improvement 3 — Surgical Intent-Preserving Patch Application
  const original = 'We offer 100% infallible marketing compliance.';
  const patch = applySurgicalPatch(original, '100% infallible', 'rigorous, automated');
  assert(patch.success && patch.newText === 'We offer rigorous, automated marketing compliance.', 'Improvement 3: Surgical diff patch successfully applied');

  // TEST 6: Improvement 1 — Guideline Ambiguity Friction Index
  const ambig = computeAmbiguityIndex(20, 15, 5); // 15 overrides out of 20 flags = 75% override
  assert(ambig.index === 0.75 && ambig.recommendation.includes('CRITICAL AMBIGUITY'), 'Improvement 1: Ambiguity friction calculated and alerted');

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed} / ${total} tests passed.`);
  console.log('----------------------------------------------------');

  if (passed === total) {
    console.log('🎉 ALL BACKEND, MULTI-AGENT, VECTOR & PYTHON WORKER TESTS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
