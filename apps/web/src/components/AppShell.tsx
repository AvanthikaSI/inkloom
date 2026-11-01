'use client';

import React, { useState } from 'react';
import { GovernanceProvider, useGovernance } from '../lib/governance-context';
import { Navbar, DYNAMIC_ROLES } from './Navbar';
import { ShieldCheck, Info, X, Cpu } from 'lucide-react';
import { useBodyScrollLock } from '../lib/use-body-scroll-lock';

function InnerAppShell({ children }: { children: React.ReactNode }) {
  const { userRole, setUserRole, complianceScore } = useGovernance();
  const [showAiDisclosure, setShowAiDisclosure] = useState(false);

  useBodyScrollLock(showAiDisclosure);

  return (
    <div className="relative min-h-screen bg-[#07080c] text-zinc-100 flex flex-col selection:bg-blue-600/30 selection:text-white overflow-x-clip">
      {/* Ambient Glossy Background Glow Spheres */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[140px]" />

      {/* 100% Full-Width Glossy Top Navigation */}
      <Navbar
        userRole={userRole}
        setUserRole={setUserRole}
        complianceScore={complianceScore}
        availableRoles={DYNAMIC_ROLES}
      />

      {/* Main Container: Centered max-w-7xl content area with smooth page transitions */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 fill-mode-both">
          {children}
        </div>
      </main>

      {/* Charcoal & Titanium Luxury Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#0c0e15]/90 backdrop-blur-2xl px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-zinc-300">
              Inkloom AI Enterprise Governance Engine
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 hidden sm:inline">Zero-Data-Retention Safe</span>
          </div>

          <button
            onClick={() => setShowAiDisclosure(true)}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer shadow-sm text-[11px] font-semibold"
          >
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Responsible AI & Model Disclosure</span>
          </button>
        </div>
      </footer>

      {/* Ethical AI Disclosure Modal */}
      {showAiDisclosure && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto overscroll-contain">
          <div className="titanium-panel rounded-2xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Responsible AI & System Architecture</h3>
                  <p className="text-xs text-zinc-400">Inkloom Governance Engine Specifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiDisclosure(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.08] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.06] space-y-1.5">
                <p className="font-bold text-white">Underlying Model & Gating Topology</p>
                <p className="text-zinc-400">
                  Operated using <strong className="text-zinc-200">Meta Llama 3.3 70B Versatile</strong> on ultra-low latency Groq LPUs, governed by LangGraph deterministic directed acyclic graphs (DAGs).
                </p>
              </div>

              <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.06] space-y-1.5">
                <p className="font-bold text-white">Human-in-the-Loop Risk Gating</p>
                <p className="text-zinc-400">
                  Autonomous decisions are restricted to low-risk formatting. Critical claims and brand voice violations strictly require human creator acceptance or compliance officer override with justification.
                </p>
              </div>

              <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.06] space-y-1.5">
                <p className="font-bold text-white">Explainability & Audit Transparency</p>
                <p className="text-zinc-400">
                  Every flagged issue generates an explainable rule citation pointing directly to verified internal facts or policy guidelines stored in vector memory.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAiDisclosure(false)}
                className="silver-btn px-5 py-2 text-xs font-bold rounded-xl cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <GovernanceProvider>
      <InnerAppShell>{children}</InnerAppShell>
    </GovernanceProvider>
  );
}
