import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
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
  assert('PDF Parsing: Character count > 5000', Boolean(pdfRes.data?.text && pdfRes.data.text.length > 5000), `Extracted ${pdfRes.data?.text?.length} chars`);
  assert('PDF Parsing: Exact header extracted', Boolean(pdfRes.data?.text?.includes('Problem Statement by Inkloom AI')));
  assert('PDF Parsing: Exact body extracted word-for-word', Boolean(pdfRes.data?.text?.includes('Growing organisations publish content through multiple employees, agencies and AI tools')));

  // 2. Test Word DOCX document parsing
  const docxZip = new AdmZip();
  const sampleDocxXml = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Enterprise Brand Governance Executive Summary</w:t></w:r></w:p><w:p><w:r><w:t>Inkloom AI provides multi-modal pre-publication content compliance checks.</w:t></w:r></w:p></w:body></w:document>';
  docxZip.addFile('word/document.xml', Buffer.from(sampleDocxXml, 'utf-8'));
  const testDocxPath = path.resolve(process.cwd(), 'test-sample.docx');
  fs.writeFileSync(testDocxPath, docxZip.toBuffer());

  const docxRes = await PythonBridgeService.parseDocument(testDocxPath);
  assert('DOCX Parsing: Extracted paragraphs successfully', Boolean(docxRes.success && docxRes.data?.text?.includes('Enterprise Brand Governance Executive Summary')));
  assert('DOCX Parsing: Ignored non-text media and extracted clean copy', Boolean(docxRes.data?.text?.includes('multi-modal pre-publication content compliance checks')));
  fs.unlinkSync(testDocxPath);

  // 3. Test Plain Text parsing
  const txtPath = path.resolve(process.cwd(), 'test-upload.txt');
  fs.writeFileSync(txtPath, 'Inkloom is a revolutionary game-changer with 100% infallible marketing compliance.', 'utf-8');
  const txtRes = await PythonBridgeService.parseDocument(txtPath);
  assert('Text Parsing: Plain text extracted successfully', Boolean(txtRes.success && txtRes.data?.text?.includes('revolutionary')));
  fs.unlinkSync(txtPath);

  // 4. Test Image creative audit with OCR text extraction (pure JS, zero exe download)
  const imgRes = await PythonBridgeService.auditImage('dummy-creative.png', ['#0F172A', '#3B82F6', '#FFFFFF']);
  assert('Image Ingestion: Synthetic/WCAG palette data generated', Boolean(imgRes.success && imgRes.data?.dominant_colors?.length > 0));
  assert('Image Ingestion: Contrast checks computed', Boolean(imgRes.data?.contrast_checks?.length > 0));
  assert('Image Ingestion: OCR text field available (zero exe download)', typeof imgRes.data?.ocr_text === 'string');

  // 5. Test Full Audit on Extracted PDF Document
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

  console.log(`\n--------------------------------------------------------`);
  console.log(`Results: ${passed} / ${total} document upload tests passed.`);
  console.log(`--------------------------------------------------------`);

  if (passed === total) {
    console.log('🎉 ALL MULTI-FORMAT DOCUMENT INGESTION & AUDIT TESTS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runDocUploadTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
