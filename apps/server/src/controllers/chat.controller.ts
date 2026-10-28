import { Request, Response } from 'express';
import { agenticWorkflow, ToolExecutionRecord, StructuredFinding } from '@inkloom/langgraph-core';
import { ContentRepository, inMemoryDb } from '@inkloom/database';
import { ChatAttachment } from '@inkloom/shared';
import { PythonBridgeService } from '../services/python-bridge.service.js';

export class ChatController {
  public static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, sessionId = 'session_default', userRole = 'creator', contentId, contentTitle, contentText } = req.body;
      const file = req.file;

      const rawMessage = typeof message === 'string' ? message.trim() : '';

      if (!rawMessage && !file) {
        res.status(400).json({ success: false, error: 'A message or document/image attachment is required.' });
        return;
      }

      let attachmentInfo: ChatAttachment | undefined = undefined;
      let effectiveMessage = rawMessage;

      if (file) {
        attachmentInfo = {
          name: file.originalname,
          type: file.mimetype,
          size: file.size
        };

        if (file.mimetype.startsWith('image/')) {
          const imgAudit = await PythonBridgeService.auditImage(file.path, ['#0F172A', '#3B82F6', '#FFFFFF', '#64748B']);
          const colorList = imgAudit.data?.dominant_colors?.map((c: any) => `${c.hex} (${c.percentage}%)`).join(', ') || 'N/A';
          const contrastStatus = imgAudit.data?.contrast_checks?.map((c: any) => `${c.foreground} on ${c.background}: ${c.contrast_ratio}:1 (${c.status})`).join('; ') || 'N/A';
          const imgContext = `[Attached Creative Image: "${file.originalname}" (${imgAudit.data?.metadata?.width || 0}x${imgAudit.data?.metadata?.height || 0}px)]
Dominant Palette: ${colorList}
WCAG Contrast Diagnostics: ${contrastStatus}`;
          effectiveMessage = effectiveMessage
            ? `${imgContext}\n\nUser Question/Instruction: ${effectiveMessage}`
            : `${imgContext}\n\nPlease audit this creative image asset for brand color adherence and WCAG contrast accessibility.`;
        } else {
          const docRes = await PythonBridgeService.parseDocument(file.path);
          const docText = docRes.success && docRes.data?.text ? docRes.data.text : '';
          const docContext = `[Attached Document: "${file.originalname}"]
Extracted Document Content:
${docText ? docText.slice(0, 10000) : '[No extractable text found or empty document]'}`;
          effectiveMessage = effectiveMessage
            ? `${docContext}\n\nUser Question/Instruction: ${effectiveMessage}`
            : `${docContext}\n\nPlease audit this document copy against official brand guidelines, fact matrix, and tone rules.`;
        }
      }

      // Retrieve or initialize session
      let session = inMemoryDb.chatSessions.get(sessionId);
      if (!session) {
        session = { sessionId, messages: [] };
        inMemoryDb.chatSessions.set(sessionId, session);
      }

      // Keep the copilot bound to the draft visible in Review Studio. This lets a
      // follow-up such as "apply that recommendation" target the same document.
      const requestedContentId = typeof contentId === 'string' && contentId.trim() ? contentId.trim() : undefined;
      if (requestedContentId) {
        const draftText = typeof contentText === 'string' ? contentText : undefined;
        const draftTitle = typeof contentTitle === 'string' ? contentTitle : undefined;
        const existingDraft = await ContentRepository.getById(requestedContentId);

        if (existingDraft && (draftText !== undefined || draftTitle !== undefined)) {
          await ContentRepository.update(requestedContentId, {
            ...(draftText !== undefined ? { rawText: draftText } : {}),
            ...(draftTitle ? { title: draftTitle } : {})
          });
        }

        session.activeDraft = {
          contentId: requestedContentId,
          title: draftTitle || existingDraft?.title,
          text: draftText ?? existingDraft?.rawText
        };
      }

      const userMsgId = `msg_${Date.now()}_u`;
      session.messages.push({
        id: userMsgId,
        role: 'user',
        content: rawMessage || `[Attached File: ${file?.originalname}]`,
        attachment: attachmentInfo,
        timestamp: new Date().toISOString()
      });

      // Prepare conversation history for LangGraph
      // The just-added user message is supplied separately as userMessage, so do
      // not include it in history a second time.
      const history = session.messages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Invoke Agentic LangGraph Workflow
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

      res.json({
        success: true,
        sessionId,
        response: responseItem.content,
        activeAgent: responseItem.activeAgent,
        toolExecutions: responseItem.toolExecutions,
        structuredFindings: responseItem.structuredFindings,
        needsClarification: state.needsClarification,
        activeDraft: session.activeDraft
      });
    } catch (err: any) {
      console.error('[ChatController] Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal Agentic AI execution error.'
      });
    }
  }

  public static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId || 'session_default');
      const session = inMemoryDb.chatSessions.get(sessionId);
      res.json({
        success: true,
        sessionId,
        messages: session ? session.messages : []
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async resetSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId || 'session_default');
      inMemoryDb.chatSessions.delete(sessionId);
      inMemoryDb.persist();
      res.json({ success: true, message: `Session ${sessionId} reset successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Server-Sent Events (SSE) Stream for real-time agent execution updates
   */
  public static async streamMessage(req: Request, res: Response): Promise<void> {
    const message = String(req.query.message || '');
    const sessionId = String(req.query.sessionId || 'session_default');

    if (!message) {
      res.status(400).end('Missing message query parameter.');
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendSSE('agent_status', { activeAgent: 'Master Orchestrator', status: 'Validating request and formulating plan...' });

      const state = await agenticWorkflow.invoke({
        sessionId,
        userMessage: message,
        conversationHistory: [],
        activeAgent: 'Master Orchestrator',
        maxSteps: 5
      });

      if (state.toolExecutions && state.toolExecutions.length > 0) {
        for (const exec of state.toolExecutions) {
          sendSSE('tool_executed', exec);
        }
      }

      sendSSE('agent_completed', {
        activeAgent: state.activeAgent,
        response: state.finalResponse,
        structuredFindings: state.structuredFindings || [],
        toolExecutions: state.toolExecutions || []
      });

      res.end();
    } catch (err: any) {
      sendSSE('agent_error', { error: err.message });
      res.end();
    }
  }
}
