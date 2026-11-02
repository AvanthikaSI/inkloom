import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs';
import {
  ContentRepository,
  AuditRepository,
  WorkflowRepository,
  AnalyticsRepository,
  GuidelineRepository,
  FactRepository,
  TerminologyRepository,
  ChatRepository,
  inMemoryDb,
  checkSupabaseConnection
} from '@inkloom/database';
import { agenticWorkflow } from '@inkloom/langgraph-core';
import { GuidelineIndexer, FactIndexer } from '@inkloom/vector-store';
import { applySurgicalPatch, ContentFormat, ContentItem } from '@inkloom/shared';
import { AuditRunnerService } from '@/lib/server/audit-runner';
import { PythonBridgeService } from '@/lib/server/python-bridge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Content-Type': 'application/json'
};

function jsonResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

function resolveFormat(filename?: string, requestedFormat?: string): ContentFormat {
  if (requestedFormat === 'text_copy' || requestedFormat === 'document_pdf' || requestedFormat === 'document_docx' || requestedFormat === 'image_creative') {
    return requestedFormat;
  }
  if (!filename) return 'text_copy';
  const ext = path.extname(filename).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image_creative';
  if (ext === '.docx') return 'document_docx';
  if (ext === '.txt' || ext === '.md') return 'text_copy';
  return 'document_pdf';
}

// ==================== GET HANDLER ====================
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug || [];
  const route = slug.join('/');

  try {
    // 1. Health
    if (route === 'health') {
      let database: { connected: boolean; error?: string } = { connected: false, error: 'Database uninitialized' };
      try {
        database = await checkSupabaseConnection();
      } catch (err: any) {
        database = { connected: false, error: err?.message || 'Database error' };
      }
      return jsonResponse({
        status: database.connected ? 'healthy' : 'degraded',
        service: 'Inkloom AI Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database
      });
    }

    // 2. Knowledge: Guidelines
    if (route === 'knowledge/guidelines') {
      const guidelines = await GuidelineRepository.getAll();
      return jsonResponse({ success: true, guidelines });
    }

    // 3. Knowledge: Facts
    if (route === 'knowledge/facts') {
      const facts = await FactRepository.getAll();
      return jsonResponse({ success: true, facts });
    }

    // 4. Knowledge: Terminology
    if (route === 'knowledge/terminology') {
      const terminology = await TerminologyRepository.getAll();
      return jsonResponse({ success: true, terminology });
    }

    // 5. Knowledge: Brand Kit
    if (route === 'knowledge/brand-kit') {
      const brandKit = Array.from(inMemoryDb.brandKits.values())[0] || null;
      return jsonResponse({ success: true, brandKit });
    }

    // 6. Content: List all
    if (route === 'content') {
      const items = await ContentRepository.getAll();
      return jsonResponse({ success: true, items });
    }

    // 7. Content: Get by ID
    if (slug[0] === 'content' && slug.length === 2) {
      const item = await ContentRepository.getById(slug[1]);
      if (!item) return jsonResponse({ success: false, error: 'Content item not found' }, 404);
      return jsonResponse({ success: true, item });
    }

    // 8. Audit: Get Report by Content ID
    if (slug[0] === 'audit' && slug.length === 2 && slug[1] !== 'analyze' && slug[1] !== 'history') {
      const report = await AuditRepository.getLatestReportByContentId(slug[1]);
      if (!report) return jsonResponse({ success: false, error: 'Report not found' }, 404);
      return jsonResponse({ success: true, report });
    }

    // 8a. Audit: History list
    if (route === 'audit/history') {
      const history = await AuditRepository.getAllReports();
      return jsonResponse({ success: true, history });
    }

    // 8b. Audit: Specific historical report
    if (slug[0] === 'audit' && slug[1] === 'history' && slug.length === 3) {
      const report = await AuditRepository.getReportById(slug[2]);
      if (!report) return jsonResponse({ success: false, error: 'Historical audit report not found' }, 404);
      return jsonResponse({ success: true, report });
    }

    // 8c. Chat: List Sessions
    if (route === 'chat/sessions') {
      const sessions = await ChatRepository.getAllSessions();
      return jsonResponse({ success: true, sessions });
    }

    // 8d. Chat: Get single session
    if (slug[0] === 'chat' && slug[1] === 'sessions' && slug.length === 3) {
      const session = await ChatRepository.getSession(slug[2]);
      if (!session) return jsonResponse({ success: false, error: 'Chat session not found' }, 404);
      return jsonResponse({ success: true, session });
    }

    // 9. Workflow: Comments
    if (slug[0] === 'workflow' && slug.length === 3 && slug[2] === 'comments') {
      const comments = await WorkflowRepository.getComments(slug[1]);
      return jsonResponse({ success: true, comments });
    }

    // 10. Workflow: Audit Logs
    if (slug[0] === 'workflow' && slug.length === 3 && slug[2] === 'audit-logs') {
      const logs = await WorkflowRepository.getAuditLogs(slug[1]);
      return jsonResponse({ success: true, logs });
    }

    // 11. Analytics: Overview – always query Supabase for accurate counts
    if (route === 'analytics/overview') {
      // Fetch audit reports from Supabase for accurate cross-device count
      const allReports = await AuditRepository.getAllReports();
      const totalAudits = allReports.length;
      const avgScore = totalAudits > 0
        ? Math.round(allReports.reduce((acc, r) => acc + r.overallComplianceScore, 0) / totalAudits)
        : 88;

      const categoryCounts: Record<string, number> = {
        tone: 0,
        terminology: 0,
        unsupported_claim: 0,
        factual_inaccuracy: 0,
        visual_inconsistency: 0,
        accessibility: 0
      };

      for (const r of allReports) {
        for (const v of r.violations) {
          categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
        }
      }

      // Fetch live guideline/fact counts from Supabase too
      const guidelines = await GuidelineRepository.getAll();
      const facts = await FactRepository.getAll();

      return jsonResponse({
        success: true,
        stats: {
          totalAudits,
          averageComplianceScore: avgScore,
          activeGuidelines: guidelines.length || inMemoryDb.guidelines.size,
          verifiedFactsCount: facts.length || inMemoryDb.facts.size,
          categoryDistribution: categoryCounts
        }
      });
    }

    // 12. Analytics: Ambiguity Metrics
    if (route === 'analytics/ambiguity-metrics') {
      const metrics = await AnalyticsRepository.getAmbiguityMetrics();
      return jsonResponse({ success: true, metrics });
    }

    // 13. Chat: History – always prefer Supabase, fall back to in-memory
    if (slug[0] === 'chat' && slug[1] === 'history' && slug.length === 3) {
      const sessionId = slug[2];
      const session = await ChatRepository.getSession(sessionId);
      return jsonResponse({
        success: true,
        sessionId,
        messages: session ? session.messages : []
      });
    }

    return jsonResponse({ success: false, error: `Endpoint not found: /api/${route}` }, 404);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'Internal Server Error' }, 500);
  }
}

// ==================== POST HANDLER ====================
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug || [];
  const route = slug.join('/');

  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. Audit: Analyze (POST /api/audit/analyze)
    if (route === 'audit/analyze') {
      let text = '';
      let title = '';
      let contentId = '';
      let format = '';
      let filePath: string | undefined = undefined;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        text = String(formData.get('text') || '');
        title = String(formData.get('title') || '');
        contentId = String(formData.get('contentId') || '');
        format = String(formData.get('format') || '');

        const file = formData.get('file') as File | null;
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const safeName = `inkloom-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          filePath = path.join(os.tmpdir(), safeName);
          await fs.promises.writeFile(filePath, buffer);
          if (!format) {
            format = resolveFormat(file.name);
          }
        }
      } else {
        const body = await req.json().catch(() => ({}));
        text = body.text || '';
        title = body.title || '';
        contentId = body.contentId || '';
        format = body.format || 'text_copy';
      }

      let item: ContentItem | null = null;
      if (contentId) {
        item = await ContentRepository.getById(contentId);
      }

      if (!item) {
        item = await ContentRepository.create({
          orgId: 'org_inkloom_01',
          authorId: 'usr_creator_01',
          authorName: 'Sarah Jenkins',
          title: title || 'Draft Publication',
          contentFormat: resolveFormat(filePath, format),
          rawText: text || '',
          assetFileUrl: filePath,
          status: 'draft'
        });
      } else {
        const updates: Record<string, any> = {};
        if (text) updates.rawText = text;
        if (title) updates.title = title;
        if (filePath) {
          updates.assetFileUrl = filePath;
          updates.contentFormat = resolveFormat(filePath, format);
        }
        if (Object.keys(updates).length > 0) {
          await ContentRepository.update(item.id, updates);
          Object.assign(item, updates);
        }
        await ContentRepository.updateStatus(item.id, 'draft');
        item.status = 'draft';
      }

      const report = await AuditRunnerService.runAudit(item, filePath);
      const refreshedItem = await ContentRepository.getById(item.id);
      return jsonResponse({ success: true, contentItem: refreshedItem || item, report });
    }

    // Create or Register Chat Session (POST /api/chat/sessions)
    if (route === 'chat/sessions') {
      const body = await req.json().catch(() => ({}));
      const sessionId = body.sessionId || `session_${Date.now()}`;
      const title = body.title || 'New Conversation';
      const session = await ChatRepository.createSession(sessionId, title, body.activeDraft);
      return jsonResponse({ success: true, session });
    }

    // 2. Chat: Send Message (POST /api/chat/message)
    if (route === 'chat/message') {
      let message = '';
      let sessionId = 'session_default';
      let userRole = 'creator';
      let contentId: string | undefined = undefined;
      let contentTitle: string | undefined = undefined;
      let contentText: string | undefined = undefined;
      let filePath: string | undefined = undefined;
      let attachmentInfo: any = undefined;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        message = String(formData.get('message') || '').trim();
        sessionId = String(formData.get('sessionId') || 'session_default');
        userRole = String(formData.get('userRole') || 'creator');
        contentId = (formData.get('contentId') as string) || undefined;
        contentTitle = (formData.get('contentTitle') as string) || undefined;
        contentText = (formData.get('contentText') as string) || undefined;

        const file = formData.get('file') as File | null;
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const safeName = `inkloom-chat-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          filePath = path.join(os.tmpdir(), safeName);
          await fs.promises.writeFile(filePath, buffer);
          attachmentInfo = {
            name: file.name,
            type: file.type,
            size: file.size
          };
        }
      } else {
        const body = await req.json().catch(() => ({}));
        message = String(body.message || '').trim();
        sessionId = body.sessionId || 'session_default';
        userRole = body.userRole || 'creator';
        contentId = body.contentId;
        contentTitle = body.contentTitle;
        contentText = body.contentText;
      }

      if (!message && !filePath) {
        return jsonResponse({ success: false, error: 'A message or document/image attachment is required.' }, 400);
      }

      let effectiveMessage = message;
      let extractedDocText = '';
      if (filePath && attachmentInfo) {
        if (attachmentInfo.type.startsWith('image/')) {
          const imgAudit = await PythonBridgeService.auditImage(filePath, ['#0F172A', '#3B82F6', '#FFFFFF', '#64748B']);
          extractedDocText = (imgAudit.data?.ocr_text || '').trim();
          const colorList = imgAudit.data?.dominant_colors?.map((c: any) => `${c.hex || c} (${c.percentage || ''}%)`).join(', ') || 'N/A';
          const contrastStatus = imgAudit.data?.contrast_checks?.map((c: any) => `${c.foreground} on ${c.background}: ${c.contrast_ratio}:1 (${c.status})`).join('; ') || 'N/A';
          const ocrSection = extractedDocText ? `\nExtracted Image Text (OCR): "${extractedDocText}"` : '';
          const imgContext = `[Attached Creative Image: "${attachmentInfo.name}" (${imgAudit.data?.metadata?.width || 0}x${imgAudit.data?.metadata?.height || 0}px)]
Dominant Palette: ${colorList}
WCAG Contrast Diagnostics: ${contrastStatus}${ocrSection}`;
          effectiveMessage = effectiveMessage
            ? `${imgContext}\n\nUser Question/Instruction: ${effectiveMessage}`
            : `${imgContext}\n\nPlease audit this creative image asset for brand color adherence and WCAG contrast accessibility.`;
        } else {
          const docRes = await PythonBridgeService.parseDocument(filePath);
          extractedDocText = docRes.success && docRes.data?.text ? docRes.data.text : '';
          const docContext = `[Attached Document: "${attachmentInfo.name}"]
Extracted Document Content:
${extractedDocText ? extractedDocText.slice(0, 10000) : '[No extractable text found or empty document]'}`;
          effectiveMessage = effectiveMessage
            ? `${docContext}\n\nUser Question/Instruction: ${effectiveMessage}`
            : `${docContext}\n\nPlease audit this document copy against official brand guidelines, fact matrix, and tone rules.`;
        }
      }

      let session = await ChatRepository.getSession(sessionId);
      if (!session) {
        session = await ChatRepository.createSession(sessionId, 'New Conversation');
      }

      const currentTitle = (session as any).title;
      const isDefaultTitle = !currentTitle ||
        currentTitle === 'New Conversation' ||
        currentTitle === 'Main Conversation' ||
        currentTitle === 'Untitled Chat' ||
        /^Chat\s+[A-Za-z]{3}\s+\d+/i.test(currentTitle);

      if (isDefaultTitle && (message || attachmentInfo?.name)) {
        let generatedTitle = message
          ? message.replace(/^["'`#*\s]+|["'`#*\s]+$/g, '').slice(0, 38).trim()
          : `Doc: ${attachmentInfo?.name?.slice(0, 30)}`;
        if (generatedTitle) {
          generatedTitle = generatedTitle.charAt(0).toUpperCase() + generatedTitle.slice(1);
          (session as any).title = generatedTitle;
          await ChatRepository.renameSession(sessionId, generatedTitle).catch(() => {});
        }
      }

      if (contentId) {
        const existingDraft = await ContentRepository.getById(contentId);
        // Provide draft as read-only context for the agent without mutating the database
        session.activeDraft = {
          contentId,
          title: contentTitle || existingDraft?.title || 'Draft Document',
          text: contentText || existingDraft?.rawText || ''
        };
      }

      const userMsgId = `msg_${Date.now()}_u`;
      session.messages.push({
        id: userMsgId,
        role: 'user',
        content: message || `[Attached File: ${attachmentInfo?.name}]`,
        attachment: attachmentInfo,
        timestamp: new Date().toISOString()
      });

      const history = session.messages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const state = await agenticWorkflow.invoke({
        sessionId,
        userMessage: effectiveMessage,
        conversationHistory: history,
        activeDraft: session.activeDraft,
        activeAgent: 'Master Orchestrator',
        maxSteps: 5
      });

      const assistantMsgId = `msg_${Date.now()}_a`;
      const responseItem = {
        id: assistantMsgId,
        role: 'assistant' as const,
        content: state.finalResponse || 'Analysis completed with gathered evidence.',
        activeAgent: state.activeAgent,
        toolExecutions: state.toolExecutions || [],
        structuredFindings: state.structuredFindings || [],
        timestamp: new Date().toISOString()
      };

      session.messages.push(responseItem);
      const refreshedDraft = session.activeDraft
        ? await ContentRepository.getById(session.activeDraft.contentId)
        : null;
      if (refreshedDraft && session.activeDraft) {
        session.activeDraft = {
          contentId: refreshedDraft.id,
          title: refreshedDraft.title,
          text: refreshedDraft.rawText
        };
      }
      inMemoryDb.persist();
      await ChatRepository.saveSession(session).catch(() => {});

      return jsonResponse({
        success: true,
        sessionId,
        response: responseItem.content,
        activeAgent: responseItem.activeAgent,
        toolExecutions: responseItem.toolExecutions,
        structuredFindings: responseItem.structuredFindings,
        needsClarification: state.needsClarification,
        activeDraft: session.activeDraft
      });
    }

    // Parse JSON body for subsequent routes
    const body = await req.json().catch(() => ({}));

    // 3. Content: Create (POST /api/content)
    if (route === 'content') {
      const newItem = await ContentRepository.create({
        orgId: 'org_inkloom_01',
        authorId: 'usr_creator_01',
        authorName: 'Sarah Jenkins',
        title: body.title || 'Untitled Content',
        contentFormat: body.contentFormat || 'text_copy',
        rawText: body.rawText || '',
        status: 'draft'
      });
      return jsonResponse({ success: true, item: newItem });
    }

    // 4. Content: Apply Patch (POST /api/content/:id/apply-patch)
    if (slug[0] === 'content' && slug.length === 3 && slug[2] === 'apply-patch') {
      const id = slug[1];
      const { violationId, excerpt, replacement, currentText } = body;

      let item = await ContentRepository.getById(id);
      if (!item) {
        item = await ContentRepository.create({
          orgId: 'org_inkloom_01',
          authorId: 'usr_creator_01',
          authorName: 'Sarah Jenkins',
          title: 'Draft Publication',
          contentFormat: 'text_copy',
          rawText: currentText || '',
          status: 'draft'
        });
      }

      const baseText = typeof currentText === 'string' && currentText.trim()
        ? currentText
        : (item.rawText || '');

      const report = violationId ? await AuditRepository.getLatestReportByContentId(item.id) : null;
      const violation = report?.violations.find((entry) => entry.id === String(violationId));
      const requestedExcerpt = typeof excerpt === 'string' ? excerpt : '';
      const requestedReplacement = typeof replacement === 'string' ? replacement : '';

      const patchResult = applySurgicalPatch(
        baseText,
        violation?.violatingExcerpt || requestedExcerpt,
        requestedReplacement
      );

      const updatedItem = await ContentRepository.update(item.id, { rawText: patchResult.newText });
      if (violationId) {
        await AuditRepository.updateViolationStatus(item.id, String(violationId), 'accepted');
        await WorkflowRepository.logAction({
          contentId: item.id,
          actorId: 'usr_creator_01',
          actorName: 'Sarah Jenkins',
          action: 'applied_suggestion',
          metadata: { violationId, excerpt: violation?.violatingExcerpt || excerpt, replacement }
        });
        let gId = violation?.guidelineId;
        if (!gId && violation?.category) {
          const cat = violation.category as string;
          if (cat === 'unsupported_claim' || cat === 'factual_inaccuracy' || cat === 'legal') {
            gId = 'bg_legal_01';
          } else if (cat === 'visual_inconsistency' || cat === 'accessibility' || cat === 'visual') {
            gId = 'bg_visual_01';
          } else {
            gId = 'bg_tone_01';
          }
        }
        if (gId) {
          await AnalyticsRepository.recordGuidelineResolution(String(gId), 'accepted').catch(() => {});
        }
      }

      return jsonResponse({ success: true, item: updatedItem || { ...item, rawText: patchResult.newText } });
    }

    // 5. Content: Override (POST /api/content/:id/override)
    if (slug[0] === 'content' && slug.length === 3 && slug[2] === 'override') {
      const id = slug[1];
      const { violationId, guidelineId, justification } = body;

      await AuditRepository.updateViolationStatus(id, String(violationId), 'rejected');
      await WorkflowRepository.logAction({
        contentId: id,
        actorId: 'usr_creator_01',
        actorName: 'Sarah Jenkins',
        action: 'overridden_warning',
        metadata: { violationId, justification }
      });

      if (guidelineId) {
        await AnalyticsRepository.recordGuidelineResolution(String(guidelineId), 'overridden');
      }

      return jsonResponse({ success: true, message: 'Warning overridden and logged to governance records.' });
    }

    // 6. Knowledge: Add Guideline (POST /api/knowledge/guidelines)
    if (route === 'knowledge/guidelines') {
      const { title, category, content } = body;
      const created = await GuidelineRepository.create({
        orgId: 'org_inkloom_01',
        title,
        category,
        content,
        version: 1,
        isActive: true
      });
      await GuidelineIndexer.indexGuidelines([created]);
      return jsonResponse({ success: true, guideline: created });
    }

    // 7. Knowledge: Add Fact (POST /api/knowledge/facts)
    if (route === 'knowledge/facts') {
      const { claimTopic, approvedStatement, sourceCitation, verificationDate } = body;
      const created = await FactRepository.create({
        orgId: 'org_inkloom_01',
        claimTopic,
        approvedStatement,
        sourceCitation,
        verificationDate: verificationDate || new Date().toISOString().split('T')[0],
        isActive: true
      });
      await FactIndexer.indexFacts([created]);
      return jsonResponse({ success: true, fact: created });
    }

    // 8. Knowledge: Add Terminology (POST /api/knowledge/terminology)
    if (route === 'knowledge/terminology') {
      const { termPattern, preferredTerm, ruleType, explanation } = body;
      const created = await TerminologyRepository.create({
        orgId: 'org_inkloom_01',
        termPattern,
        preferredTerm,
        ruleType: ruleType || 'banned',
        explanation: explanation || 'Brand lexicon compliance rule.'
      });
      return jsonResponse({ success: true, rule: created });
    }

    // 9. Workflow: Add Comment (POST /api/workflow/:contentId/comments)
    if (slug[0] === 'workflow' && slug.length === 3 && slug[2] === 'comments') {
      const contentId = slug[1];
      const { violationId, authorId, authorName, authorRole, commentText } = body;

      const comment = await WorkflowRepository.addComment({
        contentId,
        violationId: violationId ? String(violationId) : undefined,
        authorId: authorId || 'usr_reviewer_01',
        authorName: authorName || 'Marcus Vance',
        authorRole: authorRole || 'reviewer',
        commentText
      });

      return jsonResponse({ success: true, comment });
    }

    // 10. Workflow: Change Status (POST /api/workflow/:contentId/status)
    if (slug[0] === 'workflow' && slug.length === 3 && slug[2] === 'status') {
      const contentId = slug[1];
      const { status, actorId, actorName, role } = body;

      const validStatuses = ['draft', 'in_review', 'changes_requested', 'approved', 'published'];
      if (!validStatuses.includes(status)) {
        return jsonResponse({ success: false, error: 'Invalid status' }, 400);
      }

      const updated = await ContentRepository.updateStatus(contentId, status);
      await WorkflowRepository.logAction({
        contentId,
        actorId: actorId || 'usr_manager_01',
        actorName: actorName || 'Elena Rostova',
        action: status === 'approved'
          ? 'approved_content'
          : status === 'published'
          ? 'published'
          : status === 'changes_requested'
          ? 'changes_requested'
          : 'submitted_review',
        metadata: { newStatus: status, role }
      });

      return jsonResponse({ success: true, item: updated });
    }

    // 10b. Chat: Rename Session (POST /api/chat/sessions/:sessionId/rename)
    if (slug[0] === 'chat' && slug[1] === 'sessions' && slug.length === 4 && slug[3] === 'rename') {
      const sessionId = slug[2];
      const body = await req.json().catch(() => ({}));
      const title = String(body.title || '').trim();
      if (!title) return jsonResponse({ success: false, error: 'Title is required' }, 400);
      const session = await ChatRepository.renameSession(sessionId, title);
      return jsonResponse({ success: !!session, session });
    }

    // 11. Chat: Reset Session (POST /api/chat/reset/:sessionId)
    if (slug[0] === 'chat' && slug[1] === 'reset' && slug.length === 3) {
      const sessionId = slug[2];
      inMemoryDb.chatSessions.delete(sessionId);
      inMemoryDb.persist();
      await ChatRepository.deleteSession(sessionId).catch(() => {});
      return jsonResponse({ success: true, message: `Session ${sessionId} reset successfully.` });
    }

    return jsonResponse({ success: false, error: `Endpoint not found: /api/${route}` }, 404);
  } catch (err: any) {
    const message = err?.message || 'The request could not be processed.';
    return jsonResponse({ success: false, error: message }, 500);
  }
}

// ==================== PATCH HANDLER ====================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug || [];

  try {
    // 0. Content: Update Content (PATCH /api/content/:id)
    if (slug[0] === 'content' && slug.length === 2) {
      const contentId = slug[1];
      const body = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (typeof body.rawText === 'string') updates.rawText = body.rawText;
      if (typeof body.title === 'string') updates.title = body.title;
      if (typeof body.status === 'string') updates.status = body.status;

      let item = await ContentRepository.getById(contentId);
      if (!item) {
        item = await ContentRepository.create({
          orgId: 'org_inkloom_01',
          authorId: 'usr_creator_01',
          authorName: 'Sarah Jenkins',
          title: body.title || 'Draft Publication',
          contentFormat: 'text_copy',
          rawText: body.rawText || '',
          status: body.status || 'draft'
        });
      } else if (Object.keys(updates).length > 0) {
        item = await ContentRepository.update(contentId, updates);
      }
      return jsonResponse({ success: true, item });
    }

    // 0b. Chat: Rename Session (PATCH /api/chat/sessions/:sessionId)
    if (slug[0] === 'chat' && slug[1] === 'sessions' && slug.length === 3) {
      const sessionId = slug[2];
      const body = await req.json().catch(() => ({}));
      const title = String(body.title || '').trim();
      if (!title) return jsonResponse({ success: false, error: 'Title is required' }, 400);
      const session = await ChatRepository.renameSession(sessionId, title);
      return jsonResponse({ success: !!session, session });
    }

    // 1. Audit: Update Violation Status (PATCH /api/audit/:contentId/violations/:violationId)
    if (slug[0] === 'audit' && slug.length === 4 && slug[2] === 'violations') {
      const contentId = slug[1];
      const violationId = slug[3];
      const body = await req.json().catch(() => ({}));
      const updated = await AuditRepository.updateViolationStatus(contentId, violationId, body.status);
      return jsonResponse({ success: true, violation: updated });
    }

    return jsonResponse({ success: false, error: `Endpoint not found: /api/${slug.join('/')}` }, 404);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'Internal Server Error' }, 500);
  }
}

// ==================== DELETE HANDLER ====================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug || [];
  try {
    if (slug[0] === 'chat' && slug[1] === 'sessions' && slug.length === 3) {
      const deleted = await ChatRepository.deleteSession(slug[2]);
      return jsonResponse({ success: deleted });
    }
    return jsonResponse({ success: false, error: `Endpoint not found: /api/${slug.join('/')}` }, 404);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'Internal Server Error' }, 500);
  }
}
