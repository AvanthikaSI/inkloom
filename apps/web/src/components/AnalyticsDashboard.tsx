'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RotateCw,
  AlertOctagon,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  Gauge,
  Target,
  FileCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import { getAnalyticsOverview, getAmbiguityMetrics } from '../lib/api';

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [oRes, mRes] = await Promise.all([
        getAnalyticsOverview(),
        getAmbiguityMetrics()
      ]);
      if (oRes.success) setStats(oRes.stats);
      if (mRes.success) setMetrics(mRes.metrics);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Banner in Titanium Charcoal Theme */}
      <div className="titanium-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center space-x-3.5 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/70 text-white shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Governance & Brand Health Intelligence
            </h2>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Aggregated violation patterns, team compliance velocity, and algorithmic guideline friction detection.
          </p>
          <button
            onClick={loadAnalytics}
            className="flex items-center space-x-2 rounded-xl border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer self-start sm:self-auto font-medium"
          >
            <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* 4 Majestic Glass KPI Cards in Royal Titanium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Compliance */}
        <div className="titanium-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold">Average Brand Compliance</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-900/60 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {stats ? `${stats.averageComplianceScore}%` : '0%'}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +4.2% mo/mo
            </span>
          </div>
        </div>

        {/* KPI 2: Total Audits */}
        <div className="titanium-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold">Pre-Publication Audits</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {stats ? stats.totalAudits : 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-bold">multi-modal scans</span>
          </div>
        </div>

        {/* KPI 3: Active Brand Rules */}
        <div className="titanium-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold">Active Brand Rules</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {stats ? stats.activeGuidelines : 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">guidelines active</span>
          </div>
        </div>

        {/* KPI 4: Verified Facts */}
        <div className="titanium-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold">Ground Truth Benchmarks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {stats ? stats.verifiedFactsCount : 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">facts verified</span>
          </div>
        </div>
      </div>

      {/* Signature Improvement 1: Guideline Ambiguity & Friction Scoring Engine */}
      <div className="titanium-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/[0.08] bg-[#121319] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950 text-amber-400 border border-amber-900/60">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Guideline Ambiguity & Friction Scoring Engine (Signature Improvement 1)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Tracks when creators repeatedly override AI flags—alerting brand managers that a guideline is confusing, rigid, or outdated.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono px-3 py-1 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700 font-bold whitespace-nowrap self-start sm:self-auto">
            Friction Algorithmic Index
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-xs">
            <thead className="bg-[#0c0d12] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/[0.08]">
              <tr>
                <th className="py-3.5 px-5 font-bold">Brand Guideline Rule</th>
                <th className="py-3.5 px-5 font-bold">Times Flagged</th>
                <th className="py-3.5 px-5 font-bold">Overrides</th>
                <th className="py-3.5 px-5 font-bold">Friction Index Bar</th>
                <th className="py-3.5 px-5 font-bold">Diagnostic Algorithmic Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-zinc-300">
              {metrics.map((m) => {
                const isHighFriction = m.ambiguityFrictionIndex >= 0.4;
                const frictionPercent = Math.round(m.ambiguityFrictionIndex * 100);

                return (
                  <tr key={m.guidelineId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-bold text-white">{m.guidelineTitle}</p>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">{m.category}</span>
                    </td>
                    <td className="py-4 px-5 font-mono text-zinc-200">{m.timesFlagged}</td>
                    <td className="py-4 px-5 font-mono text-amber-400 font-bold">{m.timesOverridden}</td>
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                          <span className={isHighFriction ? 'text-rose-400' : 'text-emerald-400'}>
                            {frictionPercent}%
                          </span>
                          <span className="text-zinc-400">{isHighFriction ? 'High Friction' : 'Optimal'}</span>
                        </div>
                        <div className="w-36 bg-black h-2 rounded-full overflow-hidden border border-white/[0.08]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHighFriction ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, frictionPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-zinc-300 text-[11px] leading-relaxed">
                      {m.recommendation || 'Standard team adherence rate.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Non-Compliance by Category */}
      <div className="titanium-panel rounded-2xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-4 tracking-tight">
          Historical Non-Compliance Distribution by Category
        </h3>
        {(() => {
          const dist = stats?.categoryDistribution || {};
          const catConfig = [
            { label: 'Tone Drift', key: 'tone', color: 'bg-blue-400' },
            { label: 'Banned Terms', key: 'terminology', color: 'bg-zinc-300' },
            { label: 'Unsupported Claims', key: 'unsupported_claim', color: 'bg-rose-500' },
            { label: 'Factual Inaccuracy', key: 'factual_inaccuracy', color: 'bg-rose-600' },
            { label: 'Visual Inconsistency', key: 'visual_inconsistency', color: 'bg-purple-500' },
            { label: 'WCAG Contrast', key: 'accessibility', color: 'bg-amber-500' }
          ];
          const totalViolations = catConfig.reduce((acc, c) => acc + (Number(dist[c.key]) || 0), 0) || 1;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {catConfig.map((cat) => {
                const count = Number(dist[cat.key]) || 0;
                const pct = Math.min(100, Math.round((count / totalViolations) * 100));
                return (
                  <div
                    key={cat.label}
                    className="titanium-card p-3.5 rounded-xl text-center space-y-2 shadow-inner"
                  >
                    <span className="text-[11px] text-zinc-400 block truncate font-medium">{cat.label}</span>
                    <span className="text-xl font-extrabold font-mono text-white block">{count}</span>
                    <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-white/[0.06]">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${Math.max(5, pct)}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400 block">{pct}% of total</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
