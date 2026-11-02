'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  FileCheck,
  Edit,
  FileCode,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import {
  getComments,
  addComment,
  updateWorkflowStatus,
  getAuditLogs,
  getContent,
  getAllContent,
  updateContent,
  sendChatMessage
} from '../lib/api';
import { useGovernance } from '../lib/governance-context';

interface WorkflowPanelProps {
  userRole: string;
  contentId?: string;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  userRole,
  contentId = 'content_demo_01'
}) => {
  let gov: any = null;
  try {
    gov = useGovernance();
  } catch {}
  const effectiveRole = userRole || gov?.userRole || 'creator';

  const [contentList, setContentList] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string>(contentId);
  const [status, setStatus] = useState<string>('draft');
  const [content, setContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAiConsulting, setIsAiConsulting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync activeId when prop changes
  useEffect(() => {
    if (contentId && contentId !== activeId) {
      setActiveId(contentId);
    }
  }, [contentId]);

  // Load workflow whenever activeId changes
  useEffect(() => {
    loadWorkflow();
  }, [activeId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const [contentRes, cRes, lRes, allRes] = await Promise.all([
        getContent(activeId),
        getComments(activeId),
        getAuditLogs(activeId),
        getAllContent()
      ]);

      if (allRes.success && Array.isArray(allRes.items)) {
        setContentList(allRes.items);
      }

      if (contentRes.success && contentRes.item) {
        setContent(contentRes.item);
        setStatus(contentRes.item.status || 'draft');
      } else if (allRes.success && Array.isArray(allRes.items) && allRes.items.length > 0) {
        // If current activeId not found, find in list or select first item in list
        const match = allRes.items.find((item: any) => item.id === activeId);
        if (match) {
          setContent(match);
          setStatus(match.status || 'draft');
        } else if (activeId === 'content_demo_01' && allRes.items[0]) {
          setActiveId(allRes.items[0].id);
          setContent(allRes.items[0]);
          setStatus(allRes.items[0].status || 'draft');
        }
      }

      if (cRes.success && Array.isArray(cRes.comments)) {
        setComments(cRes.comments);
      }

      if (lRes.success && Array.isArray(lRes.logs)) {
        setLogs(lRes.logs);
      }
    } catch (e) {
      console.error('Failed to load workflow data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const actorName =
        effectiveRole === 'creator'
          ? 'Sarah Jenkins'
          : effectiveRole === 'reviewer'
          ? 'Marcus Vance'
          : effectiveRole === 'brand_manager'
          ? 'Elena Rostova'
          : 'David Zhao';

      const res = await updateWorkflowStatus(activeId, newStatus, actorName, effectiveRole);
      if (res.success) {
        setStatus(newStatus);
        // Refresh workflow data immediately to maintain perfect sync
        await loadWorkflow();
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
      effectiveRole === 'creator'
        ? 'Sarah Jenkins'
        : effectiveRole === 'reviewer'
        ? 'Marcus Vance'
        : effectiveRole === 'brand_manager'
        ? 'Elena Rostova'
        : 'David Zhao';

    try {
      const res = await addComment(activeId, text, authorName, effectiveRole);
      if (res.success && res.comment) {
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
        const aiRes = await sendChatMessage(aiQuery, `session_workflow_${activeId}`, effectiveRole);

        if (aiRes.success) {
          const aiComment = await addComment(
            activeId,
            `🤖 [${aiRes.activeAgent || 'Brand Guardian'}]: ${aiRes.response}`,
            'Inkloom AI Copilot',
            'reviewer'
          );
          if (aiComment.success && aiComment.comment) {
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
    {
      id: 'in_review',
      step: 2,
      label: status === 'changes_requested' ? 'Changes Requested' : 'Under Review',
      desc: status === 'changes_requested' ? 'Creator Revision Required' : 'Cross-Stakeholder Verification'
    },
    { id: 'approved', step: 3, label: 'Brand Signed-Off', desc: 'Policy & Fact Certified' },
    { id: 'published', step: 4, label: 'Live Published', desc: 'Public Release Cleared' }
  ];

  const currentStepIndex =
    status === 'changes_requested'
      ? 1
      : steps.findIndex((s) => s.id === status) >= 0
      ? steps.findIndex((s) => s.id === status)
      : 0;

  const displayedText = content?.rawText || (gov?.activeDraft?.contentId === activeId ? gov.activeDraft.text : '') || '';
  const displayedTitle = content?.title || (gov?.activeDraft?.contentId === activeId ? gov.activeDraft.title : '') || 'Inkloom AI Product Launch Press Release';

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
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Active Publication:</span>
              <select
                value={activeId}
                onChange={(e) => setActiveId(e.target.value)}
                className="rounded-xl border border-white/[0.15] bg-[#14151c] px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-zinc-400 cursor-pointer max-w-xs truncate"
              >
                {!contentList.some((item) => item.id === activeId) && (
                  <option value={activeId}>
                    {displayedTitle} [{(status || 'draft').toUpperCase()}]
                  </option>
                )}
                {contentList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title || item.id} [{(item.status || 'draft').toUpperCase()}]
                  </option>
                ))}
              </select>
              <button
                onClick={loadWorkflow}
                title="Refresh Workflow Data"
                className="p-1.5 rounded-lg border border-white/[0.1] bg-[#14151c] text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons based on Role */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Creator submission buttons */}
            {(status === 'draft' || status === 'changes_requested') && effectiveRole === 'creator' && (
              <button
                onClick={() => handleStatusChange('in_review')}
                className="silver-btn text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-md active:scale-95 transition"
              >
                {status === 'changes_requested' ? 'Resubmit for Sign-Off Review' : 'Submit for Sign-Off Review'}
              </button>
            )}

            {/* 2. Reviewer / Brand Guardian / Executive review buttons */}
            {status === 'in_review' && effectiveRole !== 'creator' && (
              <>
                <button
                  onClick={() => handleStatusChange('changes_requested')}
                  className="charcoal-btn text-amber-400 hover:text-amber-300 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition shadow-md active:scale-95"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve &amp; Sign-Off</span>
                </button>
              </>
            )}

            {/* 3. Publication authorization */}
            {status === 'approved' && (effectiveRole === 'brand_manager' || effectiveRole === 'executive') && (
              <button
                onClick={() => handleStatusChange('published')}
                className="silver-btn text-xs font-extrabold px-6 py-2.5 rounded-xl cursor-pointer shadow-md active:scale-95 transition"
              >
                Authorize Live Publication
              </button>
            )}

            {/* 4. Live published certified pill */}
            {status === 'published' && (
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" />
                <span>Publication Live &amp; Certified</span>
              </div>
            )}

            {/* 5. Informative status pills for non-acting roles */}
            {status === 'draft' && effectiveRole !== 'creator' && (
              <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-[#121319] px-3.5 py-2 rounded-xl border border-white/[0.08]">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Awaiting Submission by Creator ({content?.authorName || 'Sarah Jenkins'})</span>
              </div>
            )}

            {status === 'in_review' && effectiveRole === 'creator' && (
              <div className="flex items-center space-x-2 text-xs text-sky-400 bg-sky-950/40 px-3.5 py-2 rounded-xl border border-sky-500/30">
                <Clock className="w-4 h-4 animate-spin text-sky-400" />
                <span>Submitted — Under Sign-Off Review</span>
              </div>
            )}

            {status === 'changes_requested' && effectiveRole !== 'creator' && (
              <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-950/40 px-3.5 py-2 rounded-xl border border-amber-500/30">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Changes Requested — Awaiting Creator Revision</span>
              </div>
            )}

            {status === 'approved' && effectiveRole === 'creator' && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Brand Signed-Off — Pending Live Publication</span>
              </div>
            )}

            {status === 'approved' && effectiveRole === 'reviewer' && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Signed-Off — Awaiting Guardian Publication Release</span>
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
              <p className="text-[10px] text-zinc-400">Synchronized draft preview for multi-stakeholder review</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {effectiveRole === 'creator' && (
              <Link
                href="/studio"
                className="charcoal-btn text-[11px] font-semibold px-3 py-1 rounded-lg text-zinc-300 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                <Edit className="w-3 h-3 text-zinc-400" />
                <span>Edit in Review Studio</span>
              </Link>
            )}
            <span className="text-[10px] font-mono uppercase text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md border border-white/[0.08]">
              {content?.contentFormat ? content.contentFormat.replace('_', ' ') : 'TEXT COPY'}
            </span>
          </div>
        </div>

        {displayedText ? (
          <div className="mt-4 space-y-3">
            {status === 'changes_requested' && effectiveRole === 'creator' && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-3 text-xs text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold">Reviewer requested changes</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
                    Review the feedback below, update this draft in Review Studio, and resubmit it for sign-off.
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <h4 className="text-base font-bold text-white">{displayedTitle}</h4>
              <div className="text-[11px] font-mono text-zinc-400 flex items-center space-x-2">
                <span>
                  Author: <strong className="text-zinc-200">{content?.authorName || 'Sarah Jenkins'}</strong>
                </span>
                <span>•</span>
                <span>
                  Publication ID: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">{activeId}</code>
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0d12] p-4 text-xs font-mono text-zinc-300 leading-relaxed max-h-60 overflow-y-auto">
              <p className="whitespace-pre-wrap">{displayedText}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-white/[0.08] bg-[#0c0d12] p-4 text-xs text-zinc-400">
            {loading ? 'Loading submitted draft from Supabase...' : 'No draft content loaded.'}
          </p>
        )}
      </div>

      {/* Grid: Threaded Discussion & Immutable Sign-Off Audit Trail */}
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
                <p>No feedback posted yet for this publication.</p>
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
                <span>Agentic Brand Guardian is evaluating guidelines &amp; benchmarks...</span>
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
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Immutable Sign-Off Audit Trail</h3>
                <p className="text-[10px] text-zinc-400">Cryptographically verifiable actions for {displayedTitle}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              {logs.length} Events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {logs.length === 0 ? (
              <div className="bg-[#0c0d12] p-4 rounded-xl border border-white/[0.06] text-xs text-zinc-400 font-mono space-y-1">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>[INITIALIZED]</span>
                </div>
                <p className="text-zinc-300">
                  Publication <strong className="text-white">{displayedTitle}</strong> (ID: {activeId}) initialized in Creator Draft state.
                </p>
                <p className="text-[11px] text-zinc-500">Actions taken in Review Studio or Workflow will log immutable audit records here.</p>
              </div>
            ) : (
              logs.map((log) => {
                const isPatch = log.action === 'applied_suggestion';
                const isOverride = log.action === 'overridden_warning';
                const isApproved = log.action === 'approved_content';
                const isPublished = log.action === 'published';
                const isChangesReq = log.action === 'changes_requested';
                const isSubmit = log.action === 'submitted_review';

                return (
                  <div
                    key={log.id}
                    className="titanium-card p-3.5 rounded-xl text-xs space-y-2 font-mono transition-all border border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span
                        className={`font-bold uppercase px-1.5 py-0.5 rounded text-[9px] ${
                          isPublished
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : isApproved
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/30'
                            : isChangesReq
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : isOverride
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-600/30'
                            : isPatch
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      <strong className="text-white">{log.actorName}</strong>{' '}
                      {isSubmit && (
                        <span>
                          submitted publication <strong className="text-white">{displayedTitle}</strong> for Sign-Off Review.
                        </span>
                      )}
                      {isApproved && (
                        <span>
                          certified and approved publication <strong className="text-white">{displayedTitle}</strong>.
                        </span>
                      )}
                      {isPublished && (
                        <span>
                          authorized live public distribution for <strong className="text-white">{displayedTitle}</strong>.
                        </span>
                      )}
                      {isChangesReq && (
                        <span>
                          requested changes on publication <strong className="text-white">{displayedTitle}</strong>.
                        </span>
                      )}
                      {isPatch && (
                        <span>
                          applied surgical patch on <strong className="text-white">{displayedTitle}</strong>.
                        </span>
                      )}
                      {isOverride && (
                        <span>
                          overrode policy warning on <strong className="text-white">{displayedTitle}</strong>.
                        </span>
                      )}
                      {!isSubmit && !isApproved && !isPublished && !isChangesReq && !isPatch && !isOverride && (
                        <span>performed {log.action}</span>
                      )}
                    </p>

                    {/* Specific details: Excerpt & Replacement */}
                    {isPatch && log.metadata?.excerpt && (
                      <div className="rounded-lg bg-black/60 p-2 text-[10px] space-y-1 border border-white/[0.05]">
                        <div className="text-rose-400 line-through truncate">
                          - {log.metadata.excerpt}
                        </div>
                        <div className="text-emerald-400 truncate">
                          + {log.metadata.replacement || '[removed]'}
                        </div>
                      </div>
                    )}

                    {/* Specific details: Justification */}
                    {isOverride && log.metadata?.justification && (
                      <div className="rounded-lg bg-amber-950/30 p-2 text-[10px] text-amber-200 border border-amber-500/20">
                        <strong>Override Justification:</strong> &quot;{log.metadata.justification}&quot;
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
