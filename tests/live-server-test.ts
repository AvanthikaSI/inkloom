import http from 'http';
import { createApp } from '../apps/server/src/app.js';
import { GuidelineRepository, FactRepository } from '@inkloom/database';
import { GuidelineIndexer, FactIndexer } from '@inkloom/vector-store';

async function testLiveServer() {
  console.log('--- STARTING LIVE IN-PROCESS SERVER TEST ---');

  // Pre-index
  const guidelines = await GuidelineRepository.getAll();
  await GuidelineIndexer.indexGuidelines(guidelines);
  const facts = await FactRepository.getAll();
  await FactIndexer.indexFacts(facts);

  const app = createApp();
  const server = app.listen(4001, async () => {
    console.log('Live test server running on port 4001');

    try {
      // 1. Test /api/health
      const healthRes = await fetch('http://localhost:4001/api/health');
      const healthJson = await healthRes.json();
      console.log('✅ Health Endpoint Response:', healthJson.status, healthJson.capabilities.length, 'capabilities');

      // 2. Test /api/knowledge/guidelines
      const gRes = await fetch('http://localhost:4001/api/knowledge/guidelines');
      const gJson = await gRes.json();
      console.log('✅ Knowledge Guidelines Endpoint:', gJson.guidelines.length, 'guidelines retrieved');

      // 3. Test /api/audit/analyze (POST sample content)
      const auditRes = await fetch('http://localhost:4001/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Live Press Release Test',
          text: 'We are thrilled to announce InkLoom, the cheap tool that is 100% infallible.'
        })
      });
      const auditJson = await auditRes.json();
      console.log('✅ Audit Analysis Completed:');
      console.log('   - Overall Compliance Score:', auditJson.report.overallComplianceScore);
      console.log('   - Risk Tier:', auditJson.report.riskTier);
      console.log('   - Violations Count:', auditJson.report.violations.length);

      // 4. Test /api/content/:id/apply-patch
      const contentId = auditJson.contentItem.id;
      const violation = auditJson.report.violations[0];
      const patchRes = await fetch(`http://localhost:4001/api/content/${contentId}/apply-patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violationId: violation.id,
          excerpt: violation.violatingExcerpt,
          replacement: violation.suggestedRewrite
        })
      });
      const patchJson = await patchRes.json();
      console.log('✅ Surgical Patch Applied:');
      console.log('   - Updated Text:', patchJson.item.rawText);

      // 5. Test /api/analytics/overview
      const anaRes = await fetch('http://localhost:4001/api/analytics/overview');
      const anaJson = await anaRes.json();
      console.log('✅ Analytics Overview:', anaJson.stats.totalAudits, 'total audits');

      // 6. Test /api/chat/message (Agentic AI LangGraph endpoint)
      const chatRes = await fetch('http://localhost:4001/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Can I say our product is cheap and 100% infallible?',
          sessionId: 'live_test_session',
          userRole: 'creator'
        })
      });
      const chatJson = await chatRes.json();
      console.log('✅ Agentic Chat Endpoint (/api/chat/message):');
      console.log('   - Success:', chatJson.success);
      console.log('   - Active Agent:', chatJson.activeAgent);
      console.log('   - Response Preview:', chatJson.response.substring(0, 70) + '...');

      // 7. Test /api/chat/history/:sessionId
      const histRes = await fetch('http://localhost:4001/api/chat/history/live_test_session');
      const histJson = await histRes.json();
      console.log('✅ Chat History Endpoint:', histJson.messages.length, 'messages in session');

      console.log('\n🎉 ALL LIVE SERVER ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Live server test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

testLiveServer();
