'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  ShieldAlert,
  Search,
  Plus,
  ExternalLink,
  Check,
  Hash,
  FileCheck,
  Layers,
  Sparkles,
  Shield,
  UploadCloud,
  X,
  AlertTriangle,
  FileText,
  Download,
  Lock,
  Info,
  CheckCircle2,
  FolderLock
} from 'lucide-react';
import {
  getGuidelines,
  getFacts,
  getTerminology,
  addGuideline,
  addFact,
  addTerminology
} from '../lib/api';

export const KnowledgeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'facts' | 'terminology'>('guidelines');
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [terminology, setTerminology] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showDefineModal, setShowDefineModal] = useState(false);
  const [defineType, setDefineType] = useState<'guideline' | 'fact' | 'lexicon'>('guideline');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Form states for defining entries
  const [newGuideline, setNewGuideline] = useState({
    title: '',
    category: 'tone_voice',
    content: ''
  });

  const [newFact, setNewFact] = useState({
    claimTopic: '',
    approvedStatement: '',
    sourceCitation: '',
    verificationDate: new Date().toISOString().split('T')[0]
  });

  const [newLexicon, setNewLexicon] = useState({
    termPattern: '',
    preferredTerm: '',
    ruleType: 'banned',
    explanation: ''
  });

  // Batch import state
  const [importJson, setImportJson] = useState('');

  const availableCategories = Array.from(
    new Set([
      'tone_voice',
      'legal',
      'visual',
      'accessibility',
      'terminology',
      ...guidelines.map((g) => g.category).filter(Boolean)
    ])
  );

  const availableRuleTypes = Array.from(
    new Set([
      'banned',
      'preferred_alternative',
      'trademark_capitalization',
      ...terminology.map((t) => t.ruleType).filter(Boolean)
    ])
  );

  const formatCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'tone_voice': return 'Tone & Voice';
      case 'legal': return 'Legal & Claims';
      case 'visual': return 'Visual & Design';
      case 'accessibility': return 'Accessibility & WCAG';
      case 'terminology': return 'Terminology & Style';
      default: return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const formatRuleTypeLabel = (rule: string) => {
    switch (rule) {
      case 'banned': return 'Prohibited Banned Word';
      case 'preferred_alternative': return 'Preferred Alternative';
      case 'trademark_capitalization': return 'Trademark Capitalization';
      default: return rule.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [gRes, fRes, tRes] = await Promise.all([
        getGuidelines(),
        getFacts(),
        getTerminology()
      ]);
      if (gRes.success) setGuidelines(gRes.guidelines);
      if (fRes.success) setFacts(fRes.facts);
      if (tRes.success) setTerminology(tRes.terminology);
    } catch (e) {
      console.error('Failed to load knowledge hub:', e);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      if (defineType === 'guideline') {
        if (!newGuideline.title.trim() || !newGuideline.content.trim()) return;
        const res = await addGuideline(
          newGuideline.title.trim(),
          newGuideline.category,
          newGuideline.content.trim()
        );
        if (res.success) {
          setGuidelines((prev) => [res.guideline, ...prev]);
          setNewGuideline({ title: '', category: 'tone_voice', content: '' });
          setShowDefineModal(false);
        } else {
          setModalFeedback(res.error || 'Failed to add guideline');
        }
      } else if (defineType === 'fact') {
        if (!newFact.claimTopic.trim() || !newFact.approvedStatement.trim()) return;
        const res = await addFact(
          newFact.claimTopic.trim(),
          newFact.approvedStatement.trim(),
          newFact.sourceCitation.trim() || 'Internal Company Standard',
          newFact.verificationDate
        );
        if (res.success) {
          setFacts((prev) => [res.fact, ...prev]);
          setNewFact({
            claimTopic: '',
            approvedStatement: '',
            sourceCitation: '',
            verificationDate: new Date().toISOString().split('T')[0]
          });
          setShowDefineModal(false);
        } else {
          setModalFeedback(res.error || 'Failed to add verified fact');
        }
      } else if (defineType === 'lexicon') {
        if (!newLexicon.termPattern.trim() || !newLexicon.preferredTerm.trim()) return;
        const res = await addTerminology(
          newLexicon.termPattern.trim(),
          newLexicon.preferredTerm.trim(),
          newLexicon.ruleType,
          newLexicon.explanation.trim()
        );
        if (res.success) {
          setTerminology((prev) => [res.rule, ...prev]);
          setNewLexicon({ termPattern: '', preferredTerm: '', ruleType: 'banned', explanation: '' });
          setShowDefineModal(false);
        } else {
          setModalFeedback(res.error || 'Failed to add lexicon rule');
        }
      }
    } catch (err: any) {
      setModalFeedback(err.message || 'Error creating entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchImport = async () => {
    if (!importJson.trim()) return;
    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      const parsed = JSON.parse(importJson);
      let count = 0;

      // Import guidelines
      if (Array.isArray(parsed.guidelines)) {
        for (const g of parsed.guidelines) {
          if (g.title && g.content) {
            await addGuideline(g.title, g.category || 'tone_voice', g.content);
            count++;
          }
        }
      }
      // Import facts
      if (Array.isArray(parsed.facts)) {
        for (const f of parsed.facts) {
          if (f.claimTopic && f.approvedStatement) {
            await addFact(f.claimTopic, f.approvedStatement, f.sourceCitation || 'Imported Benchmark', f.verificationDate);
            count++;
          }
        }
      }
      // Import terminology
      if (Array.isArray(parsed.terminology)) {
        for (const t of parsed.terminology) {
          if (t.termPattern && t.preferredTerm) {
            await addTerminology(t.termPattern, t.preferredTerm, t.ruleType || 'banned', t.explanation || '');
            count++;
          }
        }
      }

      await loadAll();
      setShowImportModal(false);
      setImportJson('');
    } catch (err: any) {
      setModalFeedback('Invalid JSON format. Please verify structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSampleTemplate = () => {
    const sample = {
      guidelines: [
        {
          title: 'Inclusive & Accessible Product Language',
          category: 'accessibility',
          content: 'Ensure all descriptions use gender-neutral pronouns and provide descriptive text alternatives.'
        }
      ],
      facts: [
        {
          claimTopic: 'Enterprise SLA Availability',
          approvedStatement: 'Inkloom AI guarantees 99.95% uptime for Enterprise Tier customers under SLA v3.',
          sourceCitation: 'Enterprise Master Service Agreement 2026'
        }
      ],
      terminology: [
        {
          termPattern: 'seamless',
          preferredTerm: 'integrated or unified',
          ruleType: 'banned',
          explanation: 'Overused marketing buzzword. Describe specific interoperability instead.'
        }
      ]
    };
    setImportJson(JSON.stringify(sample, null, 2));
  };

  const filteredGuidelines = guidelines.filter(
    (g) =>
      g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFacts = facts.filter(
    (f) =>
      f.claimTopic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.approvedStatement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sourceCitation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTerminology = terminology.filter(
    (t) =>
      t.termPattern?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.preferredTerm?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.explanation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Knowledge Hub Header Banner in Titanium Theme */}
      <div className="titanium-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/70 text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Brand Knowledge Base (SSOT)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Single Source of Truth grounding all LangGraph governance agents, ChromaDB vector retrievals, and deterministic token linters.
            </p>
          </div>

          {/* Action Buttons: Define Entry & Batch Import */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setShowDefineModal(true);
                setModalFeedback(null);
              }}
              className="silver-btn flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>Define Entry</span>
            </button>
            <button
              onClick={() => {
                setShowImportModal(true);
                setModalFeedback(null);
              }}
              className="charcoal-btn flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-zinc-400" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'guidelines', label: 'Brand Guidelines', count: guidelines.length, icon: Layers },
              { id: 'facts', label: 'Approved Fact Matrix', count: facts.length, icon: FileCheck },
              { id: 'terminology', label: 'Prohibited Lexicon', count: terminology.length, icon: ShieldAlert }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'silver-btn font-bold scale-[1.02]'
                      : 'charcoal-btn text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[220px] sm:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge..."
              className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Brand Guidelines Grid */}
      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuidelines.map((g) => (
            <div
              key={g.id}
              className="titanium-card p-5 space-y-3.5 rounded-2xl shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-200 border border-white/[0.08]">
                    {g.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-400">v{g.version || 1}.0</span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {g.title}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{g.content}</p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>Rule ID: {g.id}</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Enforced</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Approved Facts & Claims Matrix */}
      {activeTab === 'facts' && (
        <div className="titanium-panel rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/[0.08] bg-[#121319] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Verified Benchmark Facts & Ground Truth Matrix</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Claims in marketing copy must be strictly grounded against these verified metrics.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-zinc-800 text-emerald-400 border border-emerald-500/30 font-bold">
              ChromaDB Indexed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-xs">
              <thead className="bg-[#0c0d12] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Claim Domain</th>
                  <th className="py-3.5 px-5 font-bold">Substantiated Benchmark Statement</th>
                  <th className="py-3.5 px-5 font-bold">Audit Citation</th>
                  <th className="py-3.5 px-5 font-bold">Verification Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {filteredFacts.map((f) => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-bold text-white whitespace-nowrap">{f.claimTopic}</td>
                    <td className="py-4 px-5 leading-relaxed">{f.approvedStatement}</td>
                    <td className="py-4 px-5 font-mono text-zinc-300 font-semibold whitespace-nowrap">
                      {f.sourceCitation}
                    </td>
                    <td className="py-4 px-5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {f.verificationDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Terminology / Lexicon Dictionary */}
      {activeTab === 'terminology' && (
        <div className="titanium-panel rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/[0.08] bg-[#121319] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Prohibited Lexicon & Trademark Directives</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Deterministic regex token rules executed instantaneously prior to LLM evaluation.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-zinc-800 text-rose-400 border border-rose-500/30 font-bold">
              Deterministic Linter
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-xs">
              <thead className="bg-[#0c0d12] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Prohibited Term</th>
                  <th className="py-3.5 px-5 font-bold">Approved Replacement</th>
                  <th className="py-3.5 px-5 font-bold">Directive Type</th>
                  <th className="py-3.5 px-5 font-bold">Governance Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {filteredTerminology.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-mono text-rose-400 font-bold whitespace-nowrap">
                      <span className="bg-rose-950/60 px-2 py-1 rounded border border-rose-500/30">
                        {t.termPattern}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-emerald-400 font-bold whitespace-nowrap">
                      <span className="bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
                        {t.preferredTerm}
                      </span>
                    </td>
                    <td className="py-4 px-5 capitalize whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded bg-zinc-800 border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                        {(t.ruleType || 'banned').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-zinc-300 leading-relaxed">{t.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Define Entry Modal */}
      {showDefineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="titanium-panel rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-white/[0.1] space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">Define Brand Knowledge Entry</h3>
              </div>
              <button
                onClick={() => setShowDefineModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entry Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'guideline', label: 'Brand Guideline' },
                { id: 'fact', label: 'Verified Fact' },
                { id: 'lexicon', label: 'Lexicon Rule' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setDefineType(type.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    defineType === type.id
                      ? 'silver-btn font-bold'
                      : 'charcoal-btn text-zinc-400 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {modalFeedback && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalFeedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-4">
              {defineType === 'guideline' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Guideline Title</label>
                    <input
                      type="text"
                      required
                      value={newGuideline.title}
                      onChange={(e) => setNewGuideline({ ...newGuideline, title: e.target.value })}
                      placeholder="e.g. Authoritative yet Approachable Tone"
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Category</label>
                    <select
                      value={newGuideline.category}
                      onChange={(e) => setNewGuideline({ ...newGuideline, category: e.target.value })}
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#10121a] text-white">
                          {formatCategoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Guideline Description & Directives</label>
                    <textarea
                      required
                      rows={4}
                      value={newGuideline.content}
                      onChange={(e) => setNewGuideline({ ...newGuideline, content: e.target.value })}
                      placeholder="Describe what is required, what to avoid, and the standard to be enforced..."
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                    />
                  </div>
                </>
              )}

              {defineType === 'fact' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Claim Topic</label>
                    <input
                      type="text"
                      required
                      value={newFact.claimTopic}
                      onChange={(e) => setNewFact({ ...newFact, claimTopic: e.target.value })}
                      placeholder="e.g. Architecture Latency or SOC2 Compliance"
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Approved Benchmark Statement</label>
                    <textarea
                      required
                      rows={3}
                      value={newFact.approvedStatement}
                      onChange={(e) => setNewFact({ ...newFact, approvedStatement: e.target.value })}
                      placeholder="The exact substantiated benchmark that marketing copy must strictly adhere to..."
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Source Citation</label>
                      <input
                        type="text"
                        value={newFact.sourceCitation}
                        onChange={(e) => setNewFact({ ...newFact, sourceCitation: e.target.value })}
                        placeholder="e.g. Benchmark Report Q3-2026"
                        className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Verification Date</label>
                      <input
                        type="date"
                        value={newFact.verificationDate}
                        onChange={(e) => setNewFact({ ...newFact, verificationDate: e.target.value })}
                        className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </>
              )}

              {defineType === 'lexicon' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Prohibited Term / Regex</label>
                      <input
                        type="text"
                        required
                        value={newLexicon.termPattern}
                        onChange={(e) => setNewLexicon({ ...newLexicon, termPattern: e.target.value })}
                        placeholder="e.g. cheap, magic, game-changer"
                        className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Approved Replacement</label>
                      <input
                        type="text"
                        required
                        value={newLexicon.preferredTerm}
                        onChange={(e) => setNewLexicon({ ...newLexicon, preferredTerm: e.target.value })}
                        placeholder="e.g. cost-effective, automated"
                        className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Rule Type</label>
                    <select
                      value={newLexicon.ruleType}
                      onChange={(e) => setNewLexicon({ ...newLexicon, ruleType: e.target.value })}
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      {availableRuleTypes.map((rule) => (
                        <option key={rule} value={rule} className="bg-[#10121a] text-white">
                          {formatRuleTypeLabel(rule)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Governance Rationale</label>
                    <textarea
                      rows={3}
                      value={newLexicon.explanation}
                      onChange={(e) => setNewLexicon({ ...newLexicon, explanation: e.target.value })}
                      placeholder="Why is this term flagged and how should writers adapt?"
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowDefineModal(false)}
                  className="charcoal-btn px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="silver-btn px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Indexing Vector SSOT...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                      <span>Save & Enforce in ChromaDB</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Batch Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="titanium-panel rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-white/[0.1] space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Batch Import Brand Knowledge</h3>
                  <p className="text-xs text-zinc-400">Import structured guidelines, facts, or lexicon in JSON format.</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalFeedback}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Paste JSON Specification</label>
                <button
                  type="button"
                  onClick={loadSampleTemplate}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Load Sample JSON Template
                </button>
              </div>
              <textarea
                rows={10}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{\n  "guidelines": [...],\n  "facts": [...],\n  "terminology": [...]\n}'
                className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="charcoal-btn px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                disabled={isSubmitting || !importJson.trim()}
                className="silver-btn px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Importing & Indexing...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-zinc-950" />
                    <span>Run Batch Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
