import { brandAuditGraph } from '@inkloom/langgraph-core';
import { PythonBridgeService } from './python-bridge.service.js';
import { AuditRepository, ContentRepository } from '@inkloom/database';
import { AuditReport, ContentItem } from '@inkloom/shared';

export class AuditRunnerService {
  public static async runAudit(
    contentItem: ContentItem,
    filePath?: string
  ): Promise<AuditReport> {
    const startTime = Date.now();
    let textToAnalyze = contentItem.rawText || '';
    let visualData: any = undefined;

    // 1. If an asset file exists, run Python worker
    if (filePath) {
      if (contentItem.contentFormat === 'image_creative') {
        const imgRes = await PythonBridgeService.auditImage(filePath, ['#0F172A', '#3B82F6', '#FFFFFF']);
        if (imgRes.success && imgRes.data) {
          visualData = {
            dominantColors: imgRes.data.dominant_colors,
            contrastChecks: imgRes.data.contrast_checks,
            dimensions: {
              width: imgRes.data.metadata?.width || 0,
              height: imgRes.data.metadata?.height || 0
            }
          };
          if (!textToAnalyze.trim()) {
            textToAnalyze = `Visual creative asset inspected: ${visualData.dimensions.width}x${visualData.dimensions.height} image with ${visualData.dominantColors?.length || 0} dominant palette swatches. WCAG contrast and palette consistency evaluated.`;
            await ContentRepository.update(contentItem.id, { rawText: textToAnalyze });
          }
        }
      } else {
        const docRes = await PythonBridgeService.parseDocument(filePath);
        if (docRes.success && docRes.data && docRes.data.text) {
          textToAnalyze = docRes.data.text;
          await ContentRepository.update(contentItem.id, { rawText: textToAnalyze });
        }
      }
    }

    if (contentItem.contentFormat !== 'image_creative' && !textToAnalyze.trim()) {
      throw new Error('No readable text was extracted from this document. Try a text-based PDF, DOCX, or TXT file.');
    }

    const safeText = textToAnalyze.length > 12000
      ? `${textToAnalyze.slice(0, 12000)}\n\n[Document truncated for AI context safety.]`
      : textToAnalyze;

    // 2. Execute LangGraph multi-agent pipeline
    const graphResult = await brandAuditGraph.invoke({
      orgId: contentItem.orgId,
      contentId: contentItem.id,
      rawText: safeText,
      visualData
    });

    const executionTimeMs = Date.now() - startTime;

    // 3. Construct and persist AuditReport
    const report: AuditReport = {
      id: `rep_${Date.now()}`,
      contentId: contentItem.id,
      overallComplianceScore: graphResult.overallScore,
      toneScore: Math.max(0, 100 - (graphResult.categoryScores['tone'] || 0) * 10),
      factualScore: Math.max(0, 100 - (graphResult.categoryScores['factual_inaccuracy'] || 0) * 20),
      claimScore: Math.max(0, 100 - (graphResult.categoryScores['unsupported_claim'] || 0) * 15),
      visualScore: Math.max(0, 100 - (graphResult.categoryScores['visual_inconsistency'] || 0) * 10),
      accessibilityScore: Math.max(0, 100 - (graphResult.categoryScores['accessibility'] || 0) * 15),
      riskTier: graphResult.riskTier,
      violations: graphResult.allViolations,
      executionTimeMs,
      createdAt: new Date().toISOString()
    };

    await AuditRepository.saveReport(report);
    return report;
  }
}
