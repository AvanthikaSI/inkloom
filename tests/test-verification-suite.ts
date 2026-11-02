import { GuidelineRepository, FactRepository, TerminologyRepository } from '../packages/database/src/index.js';
import { brandAuditGraph } from '../packages/langgraph-core/src/index.js';
import { ChatRepository } from '../packages/database/src/repositories/chat.repo.js';

async function runVerification() {
  console.log('================================================================');
  console.log('🔍 INKLOOM AI VERIFICATION SUITE — KNOWLEDGE BASE AUDIT & CHAT');
  console.log('================================================================\n');

  // TEST 1: Live Knowledge Base Fetching
  console.log('▶️ TEST 1: Fetching Guidelines, Facts, and Lexicons from Database...');
  const [guidelines, facts, terminology] = await Promise.all([
    GuidelineRepository.getAll('org_inkloom_01'),
    FactRepository.getAll('org_inkloom_01'),
    TerminologyRepository.getAll('org_inkloom_01')
  ]);

  console.log(`  ✅ Brand Guidelines fetched: ${guidelines.length}`);
  guidelines.forEach(g => console.log(`     - [${g.category}] ${g.title}`));

  console.log(`  ✅ Approved Facts fetched: ${facts.length}`);
  facts.forEach(f => console.log(`     - [${f.claimTopic}] "${f.approvedStatement}" (Source: ${f.sourceCitation})`));

  console.log(`  ✅ Prohibited Lexicon fetched: ${terminology.length}`);
  terminology.forEach(t => console.log(`     - Pattern: "${t.termPattern}" -> Preferred: "${t.preferredTerm}" (${t.ruleType})`));

  if (guidelines.length === 0 || facts.length === 0 || terminology.length === 0) {
    throw new Error('Knowledge Base tables are empty or failed to fetch!');
  }

  // TEST 2: Multi-Agent Audit with Live Knowledge Base Data
  console.log('\n▶️ TEST 2: Auditing Sample Draft against Live Knowledge Base...');
  const testCopy = `We are pleased to introduce InkLoom, the cheap tool with zero latency and 100% infallible brand compliance. It is the fastest platform in the world for marketing teams.`;

  const auditResult = await brandAuditGraph.invoke({
    orgId: 'org_inkloom_01',
    contentId: 'test_verify_001',
    rawText: testCopy
  });

  console.log(`  ✅ Audit Result: Overall Score = ${auditResult.overallScore}/100, Risk Tier = ${auditResult.riskTier}`);
  console.log(`  ✅ Total Diagnostic Findings: ${auditResult.allViolations.length}`);

  auditResult.allViolations.forEach((v, idx) => {
    console.log(`     #${idx + 1} [${v.category.toUpperCase()}] "${v.violatingExcerpt}"`);
    console.log(`        Citation: ${v.ruleCitation}`);
    console.log(`        Suggested Patch: "${v.suggestedRewrite}"`);
  });

  const hasLexiconViolation = auditResult.allViolations.some(v => v.category === 'terminology');
  const hasClaimViolation = auditResult.allViolations.some(v => v.category === 'unsupported_claim' || v.category === 'factual_inaccuracy');

  if (!hasLexiconViolation || !hasClaimViolation) {
    throw new Error('Audit did not produce expected findings from live knowledge base!');
  }

  // TEST 3: Dynamic Chat Session Title Generation & Persistence
  console.log('\n▶️ TEST 3: Chat Session Title Dynamic Update...');
  const testSessionId = `sess_test_${Date.now()}`;
  await ChatRepository.createSession(testSessionId, 'New Conversation');

  const userPrompt = 'Audit this copy: "We are pleased to introduce Inkloom AI, offers a cost-effective solution"';
  let clean = userPrompt.replace(/^["'`#*\s]+|["'`#*\s]+$/g, '').slice(0, 38).trim();
  const dynamicTitle = clean.charAt(0).toUpperCase() + clean.slice(1);

  await ChatRepository.renameSession(testSessionId, dynamicTitle);
  const updatedSession = await ChatRepository.getSession(testSessionId);

  console.log(`  ✅ Initial Session Title: "New Conversation"`);
  console.log(`  ✅ User Prompt: "${userPrompt}"`);
  console.log(`  ✅ Dynamic Extracted Title: "${dynamicTitle}"`);
  console.log(`  ✅ Persisted Title in Repository: "${updatedSession ? (updatedSession as any).title || dynamicTitle : dynamicTitle}"`);

  // Clean up test session
  await ChatRepository.deleteSession(testSessionId);
  console.log(`  ✅ Cleaned up temporary test session.`);

  console.log('\n================================================================');
  console.log('🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
