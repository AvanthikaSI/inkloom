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

export interface RolePersona {
  id: string;
  name: string;
  title: string;
  avatarInitial: string;
  badgeGradient: string;
  department: string;
}

export const DYNAMIC_ROLES: RolePersona[] = [
  {
    id: 'creator',
    name: 'Sarah Jenkins',
    title: 'Content Creator',
    avatarInitial: 'S',
    badgeGradient: 'from-blue-500 via-indigo-600 to-violet-700',
    department: 'Growth & Creative Marketing'
  },
  {
    id: 'reviewer',
    name: 'Marcus Vance',
    title: 'Compliance Lead',
    avatarInitial: 'M',
    badgeGradient: 'from-amber-500 via-orange-600 to-rose-600',
    department: 'Legal & Risk Operations'
  },
  {
    id: 'brand_manager',
    name: 'Elena Rostova',
    title: 'Brand Guardian',
    avatarInitial: 'E',
    badgeGradient: 'from-purple-500 via-fuchsia-600 to-pink-600',
    department: 'Global Brand Governance'
  },
  {
    id: 'executive',
    name: 'David Zhao',
    title: 'Executive Approver',
    avatarInitial: 'D',
    badgeGradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    department: 'Executive Editorial Board'
  }
];

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  complianceScore?: number;
  availableRoles?: RolePersona[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  complianceScore,
  availableRoles = DYNAMIC_ROLES
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'studio', label: 'Review Studio', icon: Sparkles },
    { id: 'chat', label: 'AI Copilot & Chat', icon: Bot },
    { id: 'knowledge', label: 'Brand Knowledge Base', icon: BookOpen },
    { id: 'workflow', label: 'Review & Approvals', icon: GitPullRequest },
    { id: 'analytics', label: 'Governance Insights', icon: BarChart3 }
  ];

  const currentRole = availableRoles.find((r) => r.id === userRole) || availableRoles[0];

  return (
    <header className="sticky top-0 z-50 w-full glass-header transition-all duration-300">
      {/* Luxurious Multi-stop Specular Highlight */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-blue-500/30 via-white/40 via-purple-500/30 to-transparent" />

      {/* 100% Full-Width Edge-to-Edge Navigation Container (No max-w restriction) */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-3">
        {/* Brand Logo & Live Engine Badge */}
        <div
          className="group flex cursor-pointer items-center space-x-3.5 transition-transform duration-300 hover:scale-[1.02] shrink-0"
          onClick={() => {
            setCurrentTab('studio');
            setMobileMenuOpen(false);
          }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border border-white/15 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-1 ring-white/10 group-hover:border-blue-400/50 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all">
            <ShieldCheck className="h-5 w-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-white font-sans drop-shadow-sm">
                Inkloom
              </span>
              <span className="rounded-md bg-gradient-to-b from-blue-500/10 via-zinc-900 to-zinc-950 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider text-blue-300 border border-blue-500/30 uppercase shadow-sm">
                Enterprise AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-400 flex items-center space-x-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span>Multi-Modal Brand Governance</span>
            </p>
          </div>
        </div>

        {/* Desktop Single-Line Navigation Tabs in Glossy Glass Capsule */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-zinc-950/70 backdrop-blur-2xl p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_25px_rgba(0,0,0,0.4)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-2 rounded-xl px-4 py-2 text-xs transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-white via-zinc-100 to-zinc-200 text-zinc-950 font-extrabold shadow-[0_2px_20px_rgba(255,255,255,0.25),0_0_15px_rgba(59,130,246,0.3)] border border-white scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] hover:scale-[1.01]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic User Role Persona Selector in Frosted Glass */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center space-x-3 rounded-xl border border-white/[0.1] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-xl px-3.5 py-1.5 shadow-lg hover:border-white/[0.2] transition-all">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr ${currentRole.badgeGradient} text-white font-extrabold text-xs shadow-md border border-white/20`}>
              {currentRole.avatarInitial}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Active Persona
              </span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 hover:text-blue-300 transition-colors"
              >
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id} className="bg-[#10121a] text-white">
                    {role.name} ({role.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-zinc-900/90 text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer shadow-md"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Glossy Backdrop) */}
      {mobileMenuOpen && (
        <div className="border-t border-white/[0.08] bg-[#0c0e16]/98 backdrop-blur-2xl px-4 py-4 lg:hidden animate-in slide-in-from-top-2 duration-200">
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
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-white to-zinc-200 text-zinc-950 font-bold shadow-md'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 whitespace-nowrap">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap font-medium">{tab.label}</span>
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
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.title})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
