'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  GitPullRequest,
  BarChart3,
  Bot,
  Menu,
  X,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  complianceScore?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'studio', label: 'Review Studio', icon: Sparkles },
    { id: 'chat', label: 'AI Copilot & Chat', icon: Bot },
    { id: 'knowledge', label: 'Brand Knowledge Base', icon: BookOpen },
    { id: 'workflow', label: 'Review & Approvals', icon: GitPullRequest },
    { id: 'analytics', label: 'Governance Insights', icon: BarChart3 }
  ];

  const roleDetails: Record<string, { name: string; title: string }> = {
    creator: { name: 'Sarah Jenkins', title: 'Content Creator' },
    reviewer: { name: 'Marcus Vance', title: 'Compliance Lead' },
    brand_manager: { name: 'Elena Rostova', title: 'Brand Guardian' }
  };

  const currentRoleInfo = roleDetails[userRole] || roleDetails.creator;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.09] bg-[#0e0f15]/95 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
      {/* Specular top highlight */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <div
          className="group flex cursor-pointer items-center space-x-3.5 transition-transform duration-300 hover:scale-[1.02] shrink-0"
          onClick={() => {
            setCurrentTab('studio');
            setMobileMenuOpen(false);
          }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-600/70 text-white shadow-lg ring-1 ring-white/10 group-hover:border-zinc-400 transition-colors">
            <ShieldCheck className="h-5 w-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold tracking-tight text-white font-sans">
                Inkloom
              </span>
              <span className="rounded-md bg-gradient-to-b from-zinc-800 to-zinc-900 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider text-zinc-300 border border-zinc-700 uppercase shadow-sm">
                Enterprise AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 flex items-center space-x-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Modal Brand Governance</span>
            </p>
          </div>
        </div>

        {/* Desktop Single-Line Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#181920] to-[#101116] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-white to-zinc-200 text-zinc-950 font-bold shadow-[0_2px_15px_rgba(255,255,255,0.18)] border border-white/80 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:scale-[1.01]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Role Persona Dropdown (20% Index Pill Removed!) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center space-x-2.5 rounded-xl border border-white/[0.09] bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 px-3.5 py-1.5 shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-b from-zinc-600 to-zinc-800 text-white font-bold text-xs border border-zinc-600">
              {currentRoleInfo.name.charAt(0)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Active Persona
              </span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 hover:text-zinc-200 transition-colors"
              >
                <option value="creator" className="bg-[#121318] text-white">
                  Creator (Sarah Jenkins)
                </option>
                <option value="reviewer" className="bg-[#121318] text-white">
                  Reviewer (Marcus Vance)
                </option>
                <option value="brand_manager" className="bg-[#121318] text-white">
                  Brand Guardian (Elena Rostova)
                </option>
              </select>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-zinc-900 text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Single-Line Items & No Tags) */}
      {mobileMenuOpen && (
        <div className="border-t border-white/[0.08] bg-[#0e0f15]/98 px-4 py-4 lg:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-white to-zinc-200 text-zinc-950 font-bold shadow-md'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 whitespace-nowrap">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isActive ? 'text-zinc-950' : 'text-zinc-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Mobile Role Switcher */}
          <div className="mt-4 border-t border-white/[0.08] pt-3">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">
              Active Persona
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-zinc-900 px-3 py-2 text-xs font-semibold text-white focus:outline-none"
            >
              <option value="creator">Sarah Jenkins (Creator)</option>
              <option value="reviewer">Marcus Vance (Reviewer)</option>
              <option value="brand_manager">Elena Rostova (Brand Guardian)</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
