'use client';

import React from 'react';
import { WorkflowPanel } from '../../components/WorkflowPanel';
import { useGovernance } from '../../lib/governance-context';

export default function WorkflowPage() {
  const { userRole, activeDraft } = useGovernance();
  return <WorkflowPanel userRole={userRole} contentId={activeDraft.contentId} />;
}
