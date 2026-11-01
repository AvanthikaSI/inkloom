'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  GitPullRequest,
  BarChart3,
  Bot,
  History,
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
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  complianceScore?: number;
  availableRoles?: RolePersona[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = 'studio',
  setCurrentTab,
  userRole,
  setUserRole,
  complianceScore,
  availableRoles = DYNAMIC_ROLES
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'studio', label: 'Review Studio', icon: Sparkles, path: '/studio' },
    { id: 'chat', label: 'AI Copilot & Chat', icon: Bot, path: '/chat' },
    { id: 'knowledge', label: 'Brand Knowledge Base', icon: BookOpen, path: '/knowledge' },
    { id: 'workflow', label: 'Review & Approvals', icon: GitPullRequest, path: '/workflow' },
    { id: 'analytics', label: 'Governance Insights', icon: BarChart3, path: '/analytics' },
    { id: 'history', label: 'Audit History', icon: History, path: '/history' }
  ];

  const getActiveTab = () => {
    if (!pathname) return currentTab;
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/knowledge')) return 'knowledge';
    if (pathname.includes('/workflow')) return 'workflow';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/history')) return 'history';
    if (pathname.includes('/studio')) return 'studio';
    return currentTab;
  };

  const activeTabId = getActiveTab();

  const handleTabClick = (tab: typeof tabs[0]) => {
    setCurrentTab?.(tab.id);
    router.push(tab.path);
    setMobileMenuOpen(false);
  };

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
            setCurrentTab?.('studio');
            router.push('/studio');
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
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`whitespace-nowrap flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-white via-zinc-100 to-zinc-200 text-zinc-950 font-extrabold shadow-[0_2px_20px_rgba(255,255,255,0.25),0_0_15px_rgba(59,130,246,0.3)] border border-white scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] hover:scale-[1.01]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Persona Selector & Real-Time Engine Status */}
        <div className="hidden sm:flex items-center space-x-3 shrink-0">
          {/* Dynamic Persona Selector Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-2.5 rounded-2xl border border-white/[0.12] bg-[#14151c]/80 backdrop-blur-xl px-3 py-1.5 shadow-md hover:border-zinc-500 transition-all cursor-pointer">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr ${currentRole.badgeGradient} text-white font-extrabold text-xs shadow-sm ring-1 ring-white/20`}>
                {currentRole.avatarInitial}
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">{currentRole.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                    {currentRole.id}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">{currentRole.title}</p>
              </div>
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.12] bg-[#121319]/95 backdrop-blur-2xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                <p className="text-[10px] uppercase font-mono font-bold text-zinc-400">Switch Governance Persona</p>
              </div>
              {availableRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setUserRole(role.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left transition text-xs cursor-pointer ${
                    userRole === role.id ? 'bg-white/[0.08] text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr ${role.badgeGradient} text-white font-bold text-[10px]`}>
                    {role.avatarInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-zinc-200">{role.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{role.title}</p>
                  </div>
                  {userRole === role.id && <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="lg:hidden flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-white/[0.1] bg-[#14151c] p-2 text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0c0d12]/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                  isActive
                    ? 'bg-white text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
