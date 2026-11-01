'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HistoryPanel } from '../../components/HistoryPanel';
import { useGovernance } from '../../lib/governance-context';

export default function HistoryPage() {
  const router = useRouter();
  const { restoreHistoricalDraft } = useGovernance();

  return (
    <HistoryPanel
      onRestoreDraft={(draft, report) => {
        restoreHistoricalDraft(draft, report);
        router.push('/studio');
      }}
    />
  );
}
