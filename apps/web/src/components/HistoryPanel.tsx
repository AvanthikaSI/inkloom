'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { fetchAuditHistory, fetchHistoricalReport, type ChatDraftContext } from '../lib/api';

interface HistoryPanelProps {
  onRestoreDraft?: (draft: ChatDraftContext, report?: any) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onRestoreDraft }) => {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [restoreNotice, setRestoreNotice] = useState<string>('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditHistory();
      if (res.success && Array.isArray(res.history)) {
        setHistoryList(res.history);
      }
    } catch (e) {
      console.error('Failed to load audit history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (reportId: string) => {
    try {
      const res = await fetchHistoricalReport(reportId);
      if (res.success && res.report) {
        setSelectedRecord(res.report);
      } else {
        const found = historyList.find((r) => r.id === reportId);
        if (found) setSelectedRecord(found);
      }
    } catch {
      const found = historyList.find((r) => r.id === reportId);
      if (found) setSelectedRecord(found);
    }
  };

  const handleRestore = (report: any) => {
    if (onRestoreDraft) {
      onRestoreDraft(
        {
          contentId: report.contentId,
          title: report.contentTitle || 'Historical Audit Draft',
          text: report.rawText || ''
        },
        report
      );
      setRestoreNotice(`Restored audit record "${report.id}" into Review Studio.`);
      setTimeout(() => setRestoreNotice(''), 4000);
    }
  };

  const filteredHistory = historyList.filter((item) => {
    if (filterRisk === 'all') return true;
    return item.riskTier === filterRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="titanium-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/70 text-white shadow-md">
                <History className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Audit Trail & Historical Records
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Complete provenance timeline of all pre-publication audits, compliance scorings, and risk gating decisions.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={loadHistory}
              className="charcoal-btn text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>

        {/* Restore Notification */}
        {restoreNotice && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#101c15] p-3 text-xs text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <p className="font-medium">{restoreNotice}</p>
          </div>
        )}
      </div>

      {/* Filter and Table Container */}
      <div className="titanium-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#121319] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            <span className="font-semibold text-zinc-300">Filter by Risk Tier:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="rounded-lg border border-white/[0.1] bg-[#1a1b24] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
            >
              <option value="all">All Risk Tiers ({historyList.length})</option>
              <option value="critical_blocker">Critical Blocker</option>
              <option value="warning_override">Warning / Override</option>
              <option value="compliant">Compliant</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            Showing {filteredHistory.length} recorded audit{filteredHistory.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-mono">
            Loading historical audit records...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <History className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">No audit records found</p>
            <p className="text-xs text-zinc-500">Run audits in Review Studio to record immutable audit entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-xs">
              <thead className="bg-[#0c0d12] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Audit ID & Date</th>
                  <th className="py-3.5 px-5 font-bold">Content Target</th>
                  <th className="py-3.5 px-5 font-bold">Compliance Score</th>
                  <th className="py-3.5 px-5 font-bold">Risk Tier</th>
                  <th className="py-3.5 px-5 font-bold">Violations</th>
                  <th className="py-3.5 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {filteredHistory.map((rec) => {
                  const score = rec.overallComplianceScore ?? 0;
                  const isBlocker = rec.riskTier === 'critical_blocker';
                  const isWarning = rec.riskTier === 'warning_override';

                  return (
                    <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-mono font-bold text-white text-[11px]">{rec.id}</p>
                        <span className="text-[10px] text-zinc-400 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(rec.createdAt).toLocaleString()}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-semibold text-zinc-100">{rec.contentTitle || rec.contentId || 'Draft Publication'}</p>
                        <span className="text-[10px] font-mono text-zinc-400">{rec.contentId}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`font-mono text-sm font-extrabold ${
                            score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {score} / 100
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                            isBlocker
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              : isWarning
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {isBlocker ? (
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{rec.riskTier?.replace(/_/g, ' ') || 'AUDITED'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-zinc-200">
                        {rec.violations?.length || 0} findings
                      </td>

                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleInspect(rec.id)}
                          className="charcoal-btn text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Record Modal Popup */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="titanium-panel rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-white/[0.15]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#121319]">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-zinc-400">Record:</span>
                  <h3 className="text-base font-extrabold text-white">{selectedRecord.id}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {selectedRecord.riskTier}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Target: <strong>{selectedRecord.contentTitle || selectedRecord.contentId}</strong> • Timestamp: {new Date(selectedRecord.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Score breakdown banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="titanium-card p-3 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 font-medium block">Overall Score</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400 block mt-1">
                    {selectedRecord.overallComplianceScore}%
                  </span>
                </div>
                <div className="titanium-card p-3 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 font-medium block">Tone Score</span>
                  <span className="text-xl font-bold font-mono text-white block mt-1">
                    {selectedRecord.toneScore ?? 'N/A'}%
                  </span>
                </div>
                <div className="titanium-card p-3 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 font-medium block">Factual Score</span>
                  <span className="text-xl font-bold font-mono text-white block mt-1">
                    {selectedRecord.factualScore ?? 'N/A'}%
                  </span>
                </div>
                <div className="titanium-card p-3 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 font-medium block">Claim Score</span>
                  <span className="text-xl font-bold font-mono text-white block mt-1">
                    {selectedRecord.claimScore ?? 'N/A'}%
                  </span>
                </div>
              </div>

              {/* Violations List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Diagnostic Findings ({selectedRecord.violations?.length || 0})
                </h4>

                {(!selectedRecord.violations || selectedRecord.violations.length === 0) ? (
                  <p className="text-zinc-400 text-xs">No violations recorded in this session run.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedRecord.violations.map((v: any) => (
                      <div
                        key={v.id}
                        className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white font-mono">{v.ruleCitation || v.category}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            v.severity === 'critical' ? 'text-rose-400 bg-rose-950/60' : 'text-amber-400 bg-amber-950/60'
                          }`}>
                            {v.severity} • {v.status}
                          </span>
                        </div>

                        <div className="bg-[#14151c] p-2.5 rounded-lg font-mono text-[11px] text-rose-300">
                          <span className="text-zinc-500 text-[10px] block">Excerpt Flagged:</span>
                          "{v.violatingExcerpt}"
                        </div>

                        {v.suggestedRewrite && (
                          <div className="bg-[#121c17] p-2.5 rounded-lg font-mono text-[11px] text-emerald-300">
                            <span className="text-zinc-500 text-[10px] block">Surgical Patch Recommendation:</span>
                            "{v.suggestedRewrite}"
                          </div>
                        )}

                        <p className="text-zinc-300 text-[11px] leading-relaxed">{v.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-[#121319] flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-mono">
                Execution: {selectedRecord.executionTimeMs || 0}ms
              </span>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="charcoal-btn text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRestore(selectedRecord);
                    setSelectedRecord(null);
                  }}
                  className="silver-btn text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore to Review Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
