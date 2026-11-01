import fs from 'fs';
import path from 'path';
import { PythonBridgeService } from '../apps/web/src/lib/server/python-bridge.js';
import { AuditRunnerService } from '../apps/web/src/lib/server/audit-runner.js';
import { ContentRepository } from '@inkloom/database';

async function runDocUploadTests() {
  console.log('========================================================');
  console.log('   INKLOOM AI — DOCUMENT UPLOAD VERIFICATION SUITE      ');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, cond: boolean, detail?: string) {
    total++;
    if (cond) {
      passed++;
      console.log(`✅ [PASS] ${desc}`);
    } else {
      console.error(`❌ [FAIL] ${desc}${detail ? ' — ' + detail : ''}`);
    }
  }

  // 1. Test PDF document parsing on Problem_statement.pdf
  const pdfPath = path.resolve(process.cwd(), 'Problem_statement.pdf');
  const pdfRes = await PythonBridgeService.parseDocument(pdfPath);
  assert('PDF Parsing: Problem_statement.pdf extracted successfully', Boolean(pdfRes.success && pdfRes.data?.text));
  assert('PDF Parsing: Character count > 1000', Boolean(pdfRes.data?.text && pdfRes.data.text.length > 1000), `Extracted ${pdfRes.data?.text?.length} chars`);
  assert('PDF Parsing: Contains problem statement keywords', Boolean(pdfRes.data?.text?.includes('Problem Statement') || pdfRes.data?.text?.includes('Inkloom')));

  // 2. Test Plain Text parsing
  const txtPath = path.resolve(process.cwd(), 'test-upload.txt');
  fs.writeFileSync(txtPath, 'Inkloom is a revolutionary game-changer with 100% infallible marketing compliance.', 'utf-8');
  const txtRes = await PythonBridgeService.parseDocument(txtPath);
  assert('Text Parsing: Plain text extracted successfully', Boolean(txtRes.success && txtRes.data?.text?.includes('revolutionary')));
  fs.unlinkSync(txtPath);

  // 3. Test Full Audit on Extracted PDF Document
  console.log('\nRunning LangGraph multi-agent audit on extracted PDF document...');
  const item = await ContentRepository.create({
    orgId: 'org_inkloom_01',
    authorId: 'usr_creator_01',
    authorName: 'Sarah Jenkins',
    title: 'Problem Statement by Inkloom AI',
    contentFormat: 'document_pdf',
    rawText: '',
    assetFileUrl: pdfPath,
    status: 'draft'
  });

  const report = await AuditRunnerService.runAudit(item, pdfPath);
  assert('Audit on PDF: LangGraph pipeline executed without error', Boolean(report && typeof report.overallComplianceScore === 'number'));
  assert('Audit on PDF: Raw text updated on content item', Boolean(item.rawText && item.rawText.length > 500));
  assert('Audit on PDF: Execution time recorded', Boolean(report.executionTimeMs > 0));
  assert('Audit on PDF: Violations array returned', Array.isArray(report.violations));

  // 4. Test Image creative audit
  const imgRes = await PythonBridgeService.auditImage('dummy-creative.png', ['#0F172A', '#3B82F6', '#FFFFFF']);
  assert('Image Ingestion: Synthetic/WCAG palette data generated', Boolean(imgRes.success && imgRes.data?.dominant_colors?.length > 0));
  assert('Image Ingestion: Contrast checks computed', Boolean(imgRes.data?.contrast_checks?.length > 0));

  console.log(`\n--------------------------------------------------------`);
  console.log(`Results: ${passed} / ${total} document upload tests passed.`);
  console.log(`--------------------------------------------------------`);

  if (passed === total) {
    console.log('🎉 ALL DOCUMENT INGESTION & MULTI-MODAL AUDIT TESTS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runDocUploadTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
