'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ChatDraftContext } from './api';

const DEFAULT_SAMPLE_TEXT = 'We are thrilled to announce InkLoom, the cheap and revolutionary game-changer that offers 100% infallible marketing compliance. Our magic AI engine is the fastest platform in the world, running with zero latency.';
const DEFAULT_SAMPLE_TITLE = 'Inkloom AI Product Launch Press Release';
const DEFAULT_CONTENT_ID = 'content_demo_01';

interface GovernanceContextType {
  userRole: string;
  setUserRole: (role: string) => void;
  activeDraft: ChatDraftContext;
  setActiveDraft: (draft: ChatDraftContext) => void;
  activeReport: any;
  setActiveReport: (report: any) => void;
  complianceScore?: number;
  setComplianceScore: (score?: number) => void;
  editorText: string;
  setEditorText: (text: string) => void;
  editorTitle: string;
  setEditorTitle: (title: string) => void;
  activeStudioTab: 'editor' | 'diff';
  setActiveStudioTab: (tab: 'editor' | 'diff') => void;
  successMessage: string;
  setSuccessMessage: (msg: string) => void;
  restoreHistoricalDraft: (draft: ChatDraftContext, report?: any) => void;
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<string>('creator');
  const [activeDraft, setActiveDraftState] = useState<ChatDraftContext>({
    contentId: DEFAULT_CONTENT_ID,
    title: DEFAULT_SAMPLE_TITLE,
    text: DEFAULT_SAMPLE_TEXT
  });
  const [activeReport, setActiveReportState] = useState<any>(null);
  const [complianceScore, setComplianceScoreState] = useState<number | undefined>(undefined);
  const [editorText, setEditorTextState] = useState<string>(DEFAULT_SAMPLE_TEXT);
  const [editorTitle, setEditorTitleState] = useState<string>(DEFAULT_SAMPLE_TITLE);
  const [activeStudioTab, setActiveStudioTabState] = useState<'editor' | 'diff'>('editor');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('inkloom_user_role');
      if (savedRole) setUserRoleState(savedRole);

      const savedDraft = localStorage.getItem('inkloom_active_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setActiveDraftState(parsed);
        if (parsed.text) setEditorTextState(parsed.text);
        if (parsed.title) setEditorTitleState(parsed.title);
      }

      const savedReport = localStorage.getItem('inkloom_active_report');
      if (savedReport) {
        const parsed = JSON.parse(savedReport);
        setActiveReportState(parsed);
        if (typeof parsed?.overallComplianceScore === 'number') {
          setComplianceScoreState(parsed.overallComplianceScore);
        }
      }

      const savedTab = localStorage.getItem('inkloom_studio_tab');
      if (savedTab === 'editor' || savedTab === 'diff') {
        setActiveStudioTabState(savedTab);
      }
    } catch (e) {
      console.warn('LocalStorage hydration note:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Persistent state sync to localStorage
  const setUserRole = (role: string) => {
    setUserRoleState(role);
    try { localStorage.setItem('inkloom_user_role', role); } catch {}
  };

  const setActiveDraft = (draft: ChatDraftContext) => {
    setActiveDraftState(draft);
    if (draft.text !== undefined) setEditorTextState(draft.text);
    if (draft.title) setEditorTitleState(draft.title);
    try { localStorage.setItem('inkloom_active_draft', JSON.stringify(draft)); } catch {}
  };

  const setEditorText = (text: string) => {
    setEditorTextState(text);
    setActiveDraftState((prev) => {
      const next = { ...prev, text };
      try { localStorage.setItem('inkloom_active_draft', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const setEditorTitle = (title: string) => {
    setEditorTitleState(title);
    setActiveDraftState((prev) => {
      const next = { ...prev, title };
      try { localStorage.setItem('inkloom_active_draft', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const setActiveReport = (report: any) => {
    setActiveReportState(report);
    if (typeof report?.overallComplianceScore === 'number') {
      setComplianceScoreState(report.overallComplianceScore);
    }
    try { localStorage.setItem('inkloom_active_report', JSON.stringify(report)); } catch {}
  };

  const setComplianceScore = (score?: number) => {
    setComplianceScoreState(score);
  };

  const setActiveStudioTab = (tab: 'editor' | 'diff') => {
    setActiveStudioTabState(tab);
    try { localStorage.setItem('inkloom_studio_tab', tab); } catch {}
  };

  const restoreHistoricalDraft = (draft: ChatDraftContext, report?: any) => {
    setActiveDraft(draft);
    if (report) {
      setActiveReport(report);
    }
    setActiveStudioTab('editor');
    setSuccessMessage(`Restored "${draft.title || draft.contentId}" into Review Studio.`);
  };

  return (
    <GovernanceContext.Provider
      value={{
        userRole,
        setUserRole,
        activeDraft,
        setActiveDraft,
        activeReport,
        setActiveReport,
        complianceScore,
        setComplianceScore,
        editorText,
        setEditorText,
        editorTitle,
        setEditorTitle,
        activeStudioTab,
        setActiveStudioTab,
        successMessage,
        setSuccessMessage,
        restoreHistoricalDraft
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
};

export function useGovernance() {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
}
