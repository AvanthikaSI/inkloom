'use client';

import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Clock,
  Send,
  Lock,
  Sparkles,
  Bot,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { getComments, addComment, updateWorkflowStatus, getAuditLogs, getContent, sendChatMessage } from '../lib/api';

interface WorkflowPanelProps {
  userRole: string;
  contentId?: string;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  userRole,
  contentId = 'content_demo_01'
}) => {
  const [status, setStatus] = useState('draft');
  const [content, setContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAiConsulting, setIsAiConsulting] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [contentId]);

  const loadWorkflow = async () => {
    try {
      const [contentRes, cRes, lRes] = await Promise.all([
        getContent(contentId),
        getComments(contentId),
        getAuditLogs(contentId)
      ]);
      if (contentRes.success && contentRes.item) {
        setContent(contentRes.item);
        setStatus(contentRes.item.status);
      }
      if (cRes.success) setComments(cRes.comments);
      if (lRes.success) setLogs(lRes.logs);
    } catch (e) {
      console.error('Failed to load workflow data:', e);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const actorName =
        userRole === 'creator'
          ? 'Sarah Jenkins'
          : userRole === 'reviewer'
          ? 'Marcus Vance'
          : 'Elena Rostova';
      const res = await updateWorkflowStatus(contentId, newStatus, actorName, userRole);
      if (res.success) {
        setStatus(newStatus);
        loadWorkflow();
      }
    } catch (e) {
      console.error('Failed to change status:', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    const authorName =
      userRole === 'creator'
        ? 'Sarah Jenkins'
        : userRole === 'reviewer'
        ? 'Marcus Vance'
        : 'Elena Rostova';

    try {
      const res = await addComment(contentId, text, authorName, userRole);
      if (res.success) {
        setComments((prev) => [...prev, res.comment]);
        setNewComment('');
      }

      // If user mentions @inkloom, @ai, or asks a question, trigger real Agentic AI!
      if (
        text.toLowerCase().includes('@ai') ||
        text.toLowerCase().includes('@inkloom') ||
        text.toLowerCase().startsWith('ask:')
      ) {
        setIsAiConsulting(true);
        const aiQuery = text.replace(/@ai|@inkloom|ask:/gi, '').trim() || text;
        const aiRes = await sendChatMessage(aiQuery, `session_workflow_${contentId}`, userRole);

        if (aiRes.success) {
          const aiComment = await addComment(
            contentId,
            `🤖 [${aiRes.activeAgent || 'Brand Guardian'}]: ${aiRes.response}`,
            'Inkloom AI Copilot',
            'reviewer'
          );
          if (aiComment.success) {
            setComments((prev) => [...prev, aiComment.comment]);
          }
        }
        setIsAiConsulting(false);
      }
    } catch (e) {
      console.error('Failed to add comment or consult AI:', e);
      setIsAiConsulting(false);
    }
  };

  const steps = [
    { id: 'draft', step: 1, label: 'Creator Draft', desc: 'Authoring & Self-Audit' },
    { id: 'in_review', step: 2, label: 'Under Review', desc: 'Cross-Stakeholder Verification' },
    { id: 'approved', step: 3, label: 'Brand Signed-Off', desc: 'Policy & Fact Certified' },
    { id: 'published', step: 4, label: 'Live Published', desc: 'Public Release Cleared' }
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === status);

  return (
    <div className="space-y-6">
      {/* Workflow Bar & Stepper in Titanium Palette */}
      <div className="titanium-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/70 text-white shadow-md">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Multi-Stakeholder Sign-Off Governance
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Role-based sign-offs tracking an immutable cryptographic audit log before any public distribution.
            </p>
          </div>

          {/* Action Buttons based on Role */}
          <div className="flex items-center space-x-3">
            {status === 'draft' && (
              <button
                onClick={() => handleStatusChange('in_review')}
                className="silver-btn text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Submit for Sign-Off Review
              </button>
            )}

            {status === 'in_review' && userRole !== 'creator' && (
              <>
                <button
                  onClick={() => handleStatusChange('draft')}
                  className="charcoal-btn text-amber-400 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Sign-Off</span>
                </button>
              </>
            )}

            {status === 'approved' && userRole === 'brand_manager' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="silver-btn text-xs font-extrabold px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Authorize Live Publication
              </button>
            )}

            {status === 'published' && (
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>Publication Live & Certified</span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Stage Visual Governance Pipeline Stepper */}
        <div className="pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`titanium-card relative rounded-xl p-4 border transition-all duration-300 ${
                    isCurrent
                      ? 'border-white bg-gradient-to-b from-[#2b2d39] to-[#1a1b24] text-white shadow-xl scale-[1.02]'
                      : isPast
                      ? 'border-emerald-500/30 bg-[#121c17] text-emerald-300'
                      : 'border-white/[0.06] bg-[#0e0f14] text-zinc-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono font-bold text-xs ${
                        isCurrent
                          ? 'bg-white text-zinc-950 shadow-md font-extrabold'
                          : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-white' : isPast ? 'text-emerald-300' : 'text-zinc-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pl-10">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Read-only Draft Preview */}
      <div className="titanium-panel rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Submitted Draft</h3>
              <p className="text-[10px] text-zinc-400">Read-only content preview for sign-off</p>
            </div>
          </div>
          {content?.contentFormat && (
            <span className="text-[10px] font-mono uppercase text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md border border-white/[0.08]">
              {content.contentFormat.replace('_', ' ')}
            </span>
          )}
        </div>

        {content ? (
          <div className="mt-4 space-y-3">
            <h4 className="text-base font-bold text-white">{content.title || 'Untitled Draft'}</h4>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0c0d12] p-4">
              <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-zinc-200">
                {content.rawText || 'This draft does not contain readable text.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-white/[0.08] bg-[#0c0d12] p-4 text-xs text-zinc-400">
            Loading submitted draft...
          </p>
        )}
      </div>

      {/* Grid: Threaded Discussion & Cryptographic Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Threaded Review Discussion with AI tagging */}
        <div className="titanium-panel rounded-2xl p-5 sm:p-6 flex flex-col h-[520px] shadow-2xl">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Review Discussion</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-300 bg-zinc-850 px-2.5 py-1 rounded-md border border-white/[0.08]">
              Tag <strong className="text-white">@ai</strong> for Copilot
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {comments.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-xs flex flex-col items-center space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-600" />
                <p>No feedback posted yet.</p>
                <p className="text-[11px] text-zinc-400">
                  Tip: Type <code className="text-zinc-200 font-mono">@ai: is this claim compliant?</code> to consult the Agentic Guardian.
                </p>
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`titanium-card p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    c.authorName.includes('AI')
                      ? 'border-white/[0.18] bg-[#1a1c25]'
                      : 'border-white/[0.06] bg-[#0e0f14]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold flex items-center space-x-1.5">
                      {c.authorName.includes('AI') ? (
                        <>
                          <Bot className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="text-white">{c.authorName}</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-white">
                            {c.authorName} <span className="text-zinc-400 font-normal">({c.authorRole})</span>
                          </span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap">{c.commentText}</p>
                </div>
              ))
            )}
            {isAiConsulting && (
              <div className="bg-[#121319] p-3 rounded-xl border border-white/[0.12] flex items-center space-x-2.5 text-xs text-zinc-200 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Agentic Brand Guardian is evaluating guidelines & benchmarks...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAddComment} className="pt-3 border-t border-white/[0.08] flex items-center space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add feedback or type '@ai: check claims'..."
              className="flex-1 bg-[#0c0d12] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-400 transition"
            />
            <button
              type="submit"
              disabled={isAiConsulting || !newComment.trim()}
              className="silver-btn p-2.5 rounded-xl cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: Immutable Cryptographic Compliance Audit Trail */}
        <div className="titanium-panel rounded-2xl p-5 sm:p-6 flex flex-col h-[520px] shadow-2xl">
          <div className="flex items-center space-x-2.5 pb-3.5 border-b border-white/[0.08] mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Immutable Sign-Off Audit Trail</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {logs.length === 0 ? (
              <div className="bg-[#0c0d12] p-3 rounded-xl border border-white/[0.06] text-xs text-zinc-400 font-mono">
                <span className="text-emerald-400">[INIT]</span> Document initialized in Creator Draft state.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="titanium-card p-3 rounded-xl text-xs space-y-1 font-mono transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="text-zinc-200 font-bold uppercase">{log.action}</span>
                  </div>
                  <p className="text-zinc-300">
                    <span className="text-zinc-100 font-semibold">{log.actorName}</span> performed{' '}
                    <strong className="text-white">{log.action}</strong>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
