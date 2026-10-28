'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  ShieldAlert,
  Palette,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Hash,
  FileCheck,
  Type,
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
  getBrandKit,
  addGuideline,
  addFact,
  addTerminology
} from '../lib/api';

export const KnowledgeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'facts' | 'terminology' | 'brandkit'>('guidelines');
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [terminology, setTerminology] = useState<any[]>([]);
  const [brandKit, setBrandKit] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedAsset, setCopiedAsset] = useState<string | null>(null);

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

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [gRes, fRes, tRes, bRes] = await Promise.all([
        getGuidelines(),
        getFacts(),
        getTerminology(),
        getBrandKit()
      ]);
      if (gRes.success) setGuidelines(gRes.guidelines);
      if (fRes.success) setFacts(fRes.facts);
      if (tRes.success) setTerminology(tRes.terminology);
      if (bRes.success) setBrandKit(bRes.brandKit);
    } catch (e) {
      console.error('Failed to load knowledge hub:', e);
    }
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const copyAssetPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedAsset(path);
    setTimeout(() => setCopiedAsset(null), 2000);
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

  const reusableAssets = [
    {
      id: 'asset_logo_primary',
      name: 'Inkloom Primary Vector Monogram',
      type: 'Vector SVG',
      path: '/assets/inkloom-logo.svg',
      desc: 'Official primary brand mark for dark background lockups.',
      format: 'SVG'
    },
    {
      id: 'asset_logo_horizontal',
      name: 'Inkloom Titanium Horizontal Lockup',
      type: 'Vector SVG',
      path: '/assets/inkloom-horizontal.svg',
      desc: 'Standard banner logo for header navigation and document footers.',
      format: 'SVG'
    },
    {
      id: 'asset_badge_certified',
      name: 'SOC2 & GDPR Certified Trust Seal',
      type: 'Vector Badge',
      path: '/assets/inkloom-soc2-badge.svg',
      desc: 'Mandatory trust seal on all landing pages and audited press releases.',
      format: 'SVG'
    },
    {
      id: 'asset_icon_pack',
      name: 'Inkloom Core Micro-Icons Suite',
      type: 'Design System Pack',
      path: '/assets/inkloom-icons.zip',
      desc: '24px geometric icon suite conforming to 4.5:1 minimum WCAG contrast.',
      format: 'ZIP / SVG'
    }
  ];

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
              { id: 'terminology', label: 'Prohibited Lexicon', count: terminology.length, icon: ShieldAlert },
              { id: 'brandkit', label: 'Brand Kit & Assets', count: reusableAssets.length, icon: Palette }
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

      {/* Tab 4: Visual Brand Kit & Reusable Assets */}
      {activeTab === 'brandkit' && (
        <div className="space-y-6">
          {/* Visual Brand Kit Parameters */}
          {brandKit && (
            <div className="titanium-panel rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{brandKit.kitName}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Official design tokens, WCAG 2.1 contrast ratios, and approved typography hierarchy.
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-white/[0.1] font-bold">
                  WCAG 2.1 AA Compliant (Min {brandKit.minContrastRatio || 4.5}:1)
                </span>
              </div>

              {/* Color Palette Swatches */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase font-mono tracking-wider">
                  Primary Brand Palette (Click to Copy HEX)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {brandKit.primaryColors.map((color: string) => (
                    <div
                      key={color}
                      onClick={() => copyHex(color)}
                      className="titanium-card group p-3.5 rounded-xl space-y-2.5 cursor-pointer shadow-md"
                    >
                      <div
                        className="h-20 rounded-lg border border-white/[0.1] relative overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                          {copiedHex === color ? (
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1">
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white">{color}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">HEX</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography Preview */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <h4 className="text-xs font-bold text-zinc-300 uppercase font-mono tracking-wider">
                  Approved Typography Stacks
                </h4>
                <div className="flex flex-wrap gap-3">
                  {brandKit.approvedFonts.map((font: string) => (
                    <div
                      key={font}
                      className="px-4 py-2.5 rounded-xl bg-[#0c0d12] border border-white/[0.08] text-xs font-mono text-zinc-200 flex items-center space-x-2"
                    >
                      <Type className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-white">{font}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reusable Brand Assets Library */}
          <div className="titanium-panel rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Approved Reusable Brand Assets</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Standardized vector marks, lockups, and compliance trust badges for creators and external agencies.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08] font-bold">
                SSOT CDN Assets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reusableAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="titanium-card p-4 rounded-xl flex items-start justify-between gap-4 border border-white/[0.06]"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{asset.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {asset.format}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{asset.desc}</p>
                    <span className="text-[10px] font-mono text-zinc-500 block truncate">{asset.path}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => copyAssetPath(asset.path)}
                      className="charcoal-btn p-2 rounded-lg text-zinc-300 hover:text-white cursor-pointer"
                      title="Copy Asset Path"
                    >
                      {copiedAsset === asset.path ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confidentiality & External AI Services Disclosure Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="titanium-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
              <div className="flex items-center space-x-2 text-white">
                <FolderLock className="w-4 h-4 text-zinc-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Confidential Material Protection
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All uploaded brand guidelines, proprietary facts, and unpublished drafts are secured in tenant-isolated vaults (<span className="font-mono text-zinc-300">org_inkloom_01</span>). Proprietary assets are never shared across organizations or used for public foundation model retraining.
              </p>
            </div>

            <div className="titanium-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
              <div className="flex items-center space-x-2 text-white">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                  AI & External Services Disclosure
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Audits are generated via an ensemble of Groq ChatGroq LLMs, local Python vision/document extractors, and ChromaDB vector embeddings. All automated findings are explainable suggestions subject to human creator and brand manager sign-off.
              </p>
            </div>
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
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400"
                    >
                      <option value="tone_voice">Tone & Voice</option>
                      <option value="legal">Legal & Claims</option>
                      <option value="visual">Visual & Design</option>
                      <option value="accessibility">Accessibility & WCAG</option>
                      <option value="terminology">Terminology & Style</option>
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
                      className="w-full bg-[#0c0d12] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-400"
                    >
                      <option value="banned">Prohibited Banned Word</option>
                      <option value="preferred_alternative">Preferred Alternative</option>
                      <option value="trademark_capitalization">Trademark Capitalization</option>
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
