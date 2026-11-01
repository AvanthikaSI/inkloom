'use client';

import React, { useState } from 'react';
import { Navbar, DYNAMIC_ROLES } from '../components/Navbar';
import { ReviewStudio } from '../components/ReviewStudio';
import { AgenticChat } from '../components/AgenticChat';
import { KnowledgeHub } from '../components/KnowledgeHub';
import { WorkflowPanel } from '../components/WorkflowPanel';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ShieldCheck, Info, CheckCircle2, X, Cpu } from 'lucide-react';
import type { ChatDraftContext } from '../lib/api';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('studio');
  const [userRole, setUserRole] = useState('creator');
  const [complianceScore, setComplianceScore] = useState<number | undefined>(undefined);
  const [showAiDisclosure, setShowAiDisclosure] = useState(false);
  const [activeDraft, setActiveDraft] = useState<ChatDraftContext>({
    contentId: 'content_demo_01',
    title: 'Inkloom AI Product Launch Press Release',
    text: 'We are thrilled to announce InkLoom, the cheap and revolutionary game-changer that offers 100% infallible marketing compliance. Our magic AI engine is the fastest platform in the world, running with zero latency.'
  });

  return (
    <div className="relative min-h-screen bg-[#07080c] text-zinc-100 flex flex-col selection:bg-blue-600/30 selection:text-white overflow-hidden">
      {/* Ambient Glossy Background Glow Spheres */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[140px]" />

      {/* 100% Full-Width Glossy Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        complianceScore={complianceScore}
        availableRoles={DYNAMIC_ROLES}
      />

      {/* Main Container: Centered max-w-7xl content area with animated page navigation */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div
          key={currentTab}
          className="transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 fill-mode-both"
        >
          {currentTab === 'studio' && (
            <ReviewStudio
              userRole={userRole}
              onAuditComplete={(report) => setComplianceScore(report.overallComplianceScore)}
              activeDraft={activeDraft}
              onActiveDraftChange={setActiveDraft}
            />
          )}
          {currentTab === 'chat' && (
            <AgenticChat userRole={userRole} activeDraft={activeDraft} onActiveDraftChange={setActiveDraft} />
          )}
          {currentTab === 'knowledge' && <KnowledgeHub />}
          {currentTab === 'workflow' && (
            <WorkflowPanel userRole={userRole} contentId={activeDraft.contentId} />
          )}
          {currentTab === 'analytics' && <AnalyticsDashboard />}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="titanium-panel rounded-2xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Responsible AI & System Architecture</h3>
                  <p className="text-[11px] text-zinc-400">Strict Compliance with Enterprise Governance Standards</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiDisclosure(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p className="text-zinc-200 font-medium">
                In strict accordance with enterprise governance, safety, and competition rules, Inkloom AI declares:
              </p>
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#0c0d12] p-4">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Multi-Agent LangGraph Pipeline:</strong>
                    <span className="text-zinc-400 ml-1">Deterministic linters, tone evaluators, and risk gates executed locally in Node.js.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Groq AI Inference Engine:</strong>
                    <span className="text-zinc-400 ml-1">Sub-second inference using Llama-3.3-70b-versatile for brand voice evaluation.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">ChromaDB Vector Store:</strong>
                    <span className="text-zinc-400 ml-1">Semantic vector retrieval for verified facts and brand guidelines.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Pure Python Vision & Document Engine:</strong>
                    <span className="text-zinc-400 ml-1">Standard Python modules (Pillow) executing mathematical W3C WCAG 2.1 relative luminance algorithms with pure TypeScript fallbacks.</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Zero Data Retention Guarantee:</strong>
                    <span className="text-zinc-400 ml-1">Customer content is processed ephemerally and never retained for training.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => setShowAiDisclosure(false)}
                className="silver-btn text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close Disclosure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
