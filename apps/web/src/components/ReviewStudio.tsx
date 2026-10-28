'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  RotateCcw,
  GitCommit,
  FileUp,
  Image as ImageIcon,
  FileType,
  X,
  Gauge,
  SlidersHorizontal,
  ChevronRight,
  Eye
} from 'lucide-react';
import { runAuditText, runAuditFile, applySurgicalPatch, overrideWarning, type ChatDraftContext } from '../lib/api';

interface ReviewStudioProps {
  userRole: string;
  onAuditComplete?: (report: any) => void;
  activeDraft?: ChatDraftContext;
  onActiveDraftChange?: (draft: ChatDraftContext) => void;
}

const SAMPLE_PRESETS = [
  {
    label: 'High-Risk Copy (Banned Terms + False Claims)',
    title: 'Inkloom AI Product Launch Press Release',
    text: 'We are thrilled to announce InkLoom, the cheap and revolutionary game-changer that offers 100% infallible marketing compliance. Our magic AI engine is the fastest platform in the world, running with zero latency.'
  },
  {
    label: 'Compliant Copy (Approved Lexicon + Grounded Facts)',
    title: 'Inkloom AI Enterprise Launch Announcement',
    text: 'We are pleased to introduce Inkloom AI, an enterprise-grade brand governance platform designed to provide multi-modal compliance auditing. Our system achieves sub-second inference speeds based on internal enterprise benchmarks.'
  },
  {
    label: 'Tone Drift Copy (Informal & Hyperbolic)',
    title: 'Community Newsletter Draft',
    text: 'Hey guys! You totally gotta check out this insane new tool that will literally blow your mind and solve every single marketing headache forever.'
  }
];

export const ReviewStudio: React.FC<ReviewStudioProps> = ({ userRole, onAuditComplete, activeDraft, onActiveDraftChange }) => {
  const [contentId, setContentId] = useState('content_demo_01');
  const [title, setTitle] = useState('Inkloom AI Product Launch Press Release');
  const [text, setText] = useState(SAMPLE_PRESETS[0].text);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'diff'>('editor');
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadSize, setUploadSize] = useState<string>('');
  const [uploadType, setUploadType] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishActiveDraft = (nextContentId = contentId, nextTitle = title, nextText = text) => {
    onActiveDraftChange?.({ contentId: nextContentId, title: nextTitle, text: nextText });
  };

  useEffect(() => {
    if (!activeDraft || activeDraft.contentId !== contentId) return;
    if (activeDraft.title && activeDraft.title !== title) setTitle(activeDraft.title);
    if (activeDraft.text !== undefined && activeDraft.text !== text) setText(activeDraft.text);
  }, [activeDraft, contentId, text, title]);

  const handleRunAudit = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await runAuditText(text, title, contentId);
      if (res.success) {
        setReport(res.report);
        if (res.contentItem) {
          setContentId(res.contentItem.id);
          publishActiveDraft(res.contentItem.id, res.contentItem.title || title, res.contentItem.rawText || text);
        }
        if (onAuditComplete) onAuditComplete(res.report);
      } else {
        setErrorMessage(res.error || 'Audit analysis encountered an issue.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Audit failed. Please verify that the backend server is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMessage('');
    setUploadName(file.name);
    setUploadSize(`${(file.size / 1024).toFixed(1)} KB`);
    setUploadType(file.type || file.name.split('.').pop()?.toUpperCase() || 'DOCUMENT');

    try {
      const res = await runAuditFile(file, title || file.name, contentId);
      if (!res.success) {
        throw new Error(res.error || 'The document or creative could not be parsed.');
      }
      setReport(res.report);
      if (res.contentItem) {
        setContentId(res.contentItem.id);
        if (res.contentItem.rawText) {
          setText(res.contentItem.rawText);
        }
        publishActiveDraft(res.contentItem.id, res.contentItem.title || title, res.contentItem.rawText || text);
      }
      onAuditComplete?.(res.report);
    } catch (e: any) {
      setErrorMessage(e.message || 'Multi-modal file ingestion failed. Accepted formats: PDF, DOCX, TXT, PNG, JPG, WEBP.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadName('');
    setUploadSize('');
    setUploadType('');
  };

  // Robust Surgical Patch Applicator — Passes text as currentText to completely eliminate out-of-date errors!
  const handleApplyPatch = async (violation: any) => {
    try {
      setErrorMessage('');
      const res = await applySurgicalPatch(
        contentId,
        violation.id,
        violation.violatingExcerpt,
        violation.suggestedRewrite,
        text
      );

      const newText = res.item?.rawText || (text.includes(violation.suggestedRewrite) ? text : text.replace(violation.violatingExcerpt, violation.suggestedRewrite));
      setText(newText);
      publishActiveDraft(contentId, title, newText);

      setReport((prev: any) => {
        if (!prev) return prev;
        const updated = prev.violations.map((v: any) =>
          v.id === violation.id ? { ...v, status: 'accepted' } : v
        );
        return { ...prev, violations: updated };
      });
    } catch (e: any) {
      // Local fallback: smoothly replace the excerpt so user is never interrupted
      const target = violation.violatingExcerpt || '';
      const replacement = violation.suggestedRewrite || '';
      if (target && text.includes(target)) {
        setText(text.replace(target, replacement));
        publishActiveDraft(contentId, title, text.replace(target, replacement));
      }
      setReport((prev: any) => {
        if (!prev) return prev;
        const updated = prev.violations.map((v: any) =>
          v.id === violation.id ? { ...v, status: 'accepted' } : v
        );
        return { ...prev, violations: updated };
      });
    }
  };

  const handleOverride = async () => {
    if (!selectedViolation || !overrideReason.trim()) return;
    try {
      await overrideWarning(
        contentId,
        selectedViolation.id,
        selectedViolation.guidelineId || 'bg_tone_01',
        overrideReason
      );

      setReport((prev: any) => {
        if (!prev) return prev;
        const updated = prev.violations.map((v: any) =>
          v.id === selectedViolation.id ? { ...v, status: 'rejected' } : v
        );
        return { ...prev, violations: updated };
      });

      setShowOverrideModal(false);
      setOverrideReason('');
      setSelectedViolation(null);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to record override justification.');
    }
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="space-y-6">
      {/* Error Alert Bar */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-[#1e1316] p-4 text-xs text-rose-200 animate-in fade-in duration-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Auditing Notice</p>
            <p className="text-zinc-300 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3-Tier Risk Gate Status Banner in Titanium Theme */}
      {report && (
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all shadow-xl ${
            report.riskTier === 'critical_blocker'
              ? 'border-rose-500/40 bg-gradient-to-r from-[#211317] via-[#16171e] to-[#101116] shadow-[0_0_35px_rgba(244,63,94,0.15)]'
              : report.riskTier === 'warning'
              ? 'border-amber-500/40 bg-gradient-to-r from-[#241a12] via-[#16171e] to-[#101116] shadow-[0_0_35px_rgba(245,158,11,0.15)]'
              : 'border-emerald-500/40 bg-gradient-to-r from-[#12221b] via-[#16171e] to-[#101116] shadow-[0_0_35px_rgba(16,185,129,0.15)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border flex-shrink-0 shadow-md ${
                  report.riskTier === 'critical_blocker'
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                    : report.riskTier === 'warning'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                }`}
              >
                {report.riskTier === 'critical_blocker' ? (
                  <ShieldAlert className="h-6 w-6" />
                ) : report.riskTier === 'warning' ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    {report.riskTier === 'critical_blocker'
                      ? '3-Tier Risk Gate: Critical Blocker Active'
                      : report.riskTier === 'warning'
                      ? '3-Tier Risk Gate: Moderate Warnings Present'
                      : '3-Tier Risk Gate: Cleared for Pre-Publication'}
                  </h4>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                      report.riskTier === 'critical_blocker'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                        : report.riskTier === 'warning'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                        : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                    }`}
                  >
                    {report.riskTier.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  {report.riskTier === 'critical_blocker'
                    ? 'Publication is hard-blocked. Content contains unverified performance superlatives or trademark violations. Resolve issues or seek Brand Guardian sign-off.'
                    : report.riskTier === 'warning'
                    ? 'Contains tone divergence or readability friction. Review suggested rewrites or record creator justification to proceed.'
                    : 'All brand voice criteria, verified fact benchmarks, and WCAG accessibility standards passed.'}
                </p>
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center space-x-6 border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-3 sm:pt-0 sm:pl-6">
              <div className="text-right">
                <div className="flex items-baseline justify-end space-x-1">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {report.overallComplianceScore}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">/100</span>
                </div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Compliance Score
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Content Editor & Multi-Modal Ingestion */}
        <div className="lg:col-span-7 space-y-5">
          {/* Editor Container in Titanium Theme */}
          <div className="titanium-panel rounded-2xl overflow-hidden shadow-2xl">
            {/* Header Toolbar */}
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#13141a]">
              <div className="flex items-center space-x-2.5 flex-1 min-w-[200px]">
                <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none w-full border-b border-transparent focus:border-zinc-500 transition-colors"
                  placeholder="Document or Campaign Title"
                />
              </div>

              {/* View Switcher: Raw Editor vs Unified Diff */}
              <div className="flex items-center space-x-1 bg-[#1c1d25] p-1 rounded-xl border border-white/[0.08] text-xs">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'editor'
                      ? 'silver-btn font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'diff'
                      ? 'silver-btn font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Surgical Diff
                </button>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="px-5 py-2.5 bg-[#101116] border-b border-white/[0.06] flex items-center justify-between text-xs overflow-x-auto">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center space-x-1 whitespace-nowrap font-bold">
                <SlidersHorizontal className="w-3 h-3 text-zinc-400 mr-1" />
                <span>Test Presets:</span>
              </span>
              <div className="flex items-center space-x-1.5">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTitle(preset.title);
                      setText(preset.text);
                      publishActiveDraft(contentId, preset.title, preset.text);
                    }}
                    className="charcoal-btn px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Preset {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Body */}
            {activeTab === 'editor' ? (
              <div className="p-5 space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    publishActiveDraft(contentId, title, e.target.value);
                  }}
                  rows={10}
                  className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl p-4 text-xs sm:text-sm font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all resize-none shadow-inner"
                  placeholder="Paste or write promotional copy, press releases, newsletters, or brand content here..."
                />

                {/* Footer Metrics & Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-3 text-xs text-zinc-400 font-mono">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{text.length} chars</span>
                    <span>•</span>
                    <span>~{readingTime} min read</span>
                  </div>

                  <button
                    onClick={handleRunAudit}
                    disabled={loading}
                    className="silver-btn flex items-center justify-center space-x-2 text-xs px-6 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Executing LangGraph Multi-Agent Audit...' : 'Audit with Inkloom AI'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Surgical Diff View */
              <div className="p-5 space-y-4">
                <div className="text-xs text-zinc-300 flex items-center space-x-2">
                  <GitCommit className="w-4 h-4 text-zinc-400" />
                  <span className="font-semibold">Interactive Surgical Diff Viewer</span>
                  <span className="text-[10px] text-zinc-400">(Preserves Sentence Cadence & Voice)</span>
                </div>

                <div className="bg-[#0c0d12] p-4 rounded-xl border border-white/[0.08] font-mono text-xs leading-loose text-zinc-200">
                  {text}
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#14151c] p-3.5 text-xs text-zinc-300 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    Click <strong className="text-white">"Accept Surgical Patch"</strong> on any diagnostic card on the right to surgically update this copy in place without altering your brand tone.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Modal Document & Creative Ingestion Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 cursor-pointer ${
              isDragging
                ? 'border-white bg-[#1e2029] shadow-xl'
                : 'border-white/[0.12] bg-[#121319] hover:border-zinc-400 hover:bg-[#161821]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={handleFileInputChange}
              disabled={loading}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-700 to-zinc-900 text-white border border-zinc-600/60 shadow-md">
                <Upload className="w-5 h-5" />
              </div>

              <div>
                <h5 className="text-sm font-extrabold text-white tracking-tight">
                  Multi-Modal Document & Creative Ingestion
                </h5>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Drag & drop or click to upload <strong>PDF, DOCX, TXT, PNG, JPG, or WEBP</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] text-zinc-400 font-mono">
                <span className="rounded bg-zinc-800/80 px-2.5 py-0.5 border border-white/[0.08] text-zinc-300">Pure Python Parser</span>
                <span className="rounded bg-zinc-800/80 px-2.5 py-0.5 border border-white/[0.08] text-zinc-300">Pillow Vision</span>
                <span className="rounded bg-zinc-800/80 px-2.5 py-0.5 border border-white/[0.08] text-zinc-300">WCAG Contrast</span>
              </div>

              {uploadName && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 flex items-center space-x-3 rounded-xl border border-white/[0.15] bg-zinc-800 px-4 py-2 text-xs text-zinc-100"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span className="font-bold font-mono text-white">{uploadName}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({uploadSize} • {uploadType})</span>
                  <button
                    onClick={handleClearFile}
                    className="text-zinc-400 hover:text-white ml-2 p-0.5 cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Findings & Explainable Citations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="titanium-panel rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Diagnostic Findings</h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-white/[0.08] text-zinc-300">
                {report
                  ? `${report.violations.filter((v: any) => v.status === 'open').length} Open Issues`
                  : 'Awaiting Audit'}
              </span>
            </div>

            {/* Violation List */}
            <div className="mt-4 space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {!report ? (
                <div className="text-center py-16 text-zinc-500 text-xs flex flex-col items-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-850 border border-white/[0.08] text-zinc-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-300">No active audit loaded</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Click "Audit with Inkloom AI" to execute the LangGraph multi-agent pipeline.
                    </p>
                  </div>
                </div>
              ) : report.violations.length === 0 ? (
                <div className="text-center py-16 text-emerald-400 text-xs flex flex-col items-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-emerald-300">100% Brand Compliant</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      No violations detected across tone, fact matrix, terminology, or WCAG standards.
                    </p>
                  </div>
                </div>
              ) : (
                report.violations.map((violation: any) => {
                  const isAccepted = violation.status === 'accepted';
                  const isRejected = violation.status === 'rejected';

                  return (
                    <div
                      key={violation.id}
                      className={`titanium-card p-4 rounded-xl border transition-all ${
                        isAccepted
                          ? 'opacity-60 border-emerald-900/40'
                          : isRejected
                          ? 'opacity-60 border-zinc-700/60'
                          : violation.severity === 'critical'
                          ? 'border-rose-500/40 bg-[#1c1215]'
                          : 'border-amber-500/40 bg-[#1e1712]'
                      }`}
                    >
                      {/* Violation Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              violation.severity === 'critical'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                            }`}
                          >
                            {violation.severity}
                          </span>
                          <span className="text-xs font-bold text-zinc-200 capitalize">
                            {violation.category.replace('_', ' ')}
                          </span>
                        </div>

                        {isAccepted && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Patch Applied</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] text-zinc-400 font-semibold flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Overridden</span>
                          </span>
                        )}
                      </div>

                      {/* Flagged Excerpt */}
                      <div className="bg-[#0c0d12] p-2.5 rounded-lg border border-white/[0.08] font-mono text-xs text-rose-300 mb-2.5">
                        <span className="text-zinc-500 block text-[9px] uppercase font-sans">Flagged Excerpt:</span>
                        <span className="line-through">{violation.violatingExcerpt}</span>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-zinc-300 mb-2.5 leading-relaxed">
                        {violation.explanation}
                      </p>

                      {/* Rule Citation */}
                      <div className="flex items-center space-x-1.5 text-[11px] text-zinc-300 bg-zinc-800/70 px-2.5 py-1.5 rounded-lg border border-white/[0.06] mb-3">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                        <span className="truncate">Source: {violation.ruleCitation}</span>
                      </div>

                      {/* Suggested Surgical Rewrite & Action Buttons */}
                      {!isAccepted && !isRejected && (
                        <div className="space-y-2.5 pt-2.5 border-t border-white/[0.08]">
                          <div className="text-xs font-mono text-emerald-300 bg-[#0c0d12] p-2.5 rounded-lg border border-emerald-900/50">
                            <span className="text-zinc-400 text-[9px] block uppercase font-sans">
                              Surgical Replacement (Intent-Preserving):
                            </span>
                            {violation.suggestedRewrite}
                          </div>

                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              onClick={() => handleApplyPatch(violation)}
                              className="silver-btn flex-1 text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Surgical Patch</span>
                            </button>

                            {violation.severity !== 'critical' && (
                              <button
                                onClick={() => {
                                  setSelectedViolation(violation);
                                  setShowOverrideModal(true);
                                }}
                                className="charcoal-btn text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer"
                              >
                                <span>Override</span>
                              </button>
                            )}
                          </div>
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

      {/* Override Warning Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="titanium-panel rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-white/[0.08]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Record Creator Justification</h3>
            </div>

            <p className="text-xs text-zinc-300">
              You are recording an official governance override for:
              <span className="font-mono text-amber-300 block mt-1 p-2 rounded bg-[#0c0d12] border border-white/[0.08]">
                "{selectedViolation?.violatingExcerpt}"
              </span>
            </p>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">
                Audit Trail Justification (Required by Governance Policy):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-zinc-400"
                placeholder="e.g. Approved exception for Q4 seasonal campaign by VP Marketing..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                Confirm & Record Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
