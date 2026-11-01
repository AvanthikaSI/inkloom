'use client';

import React from 'react';
import { AgenticChat } from '../../components/AgenticChat';
import { useGovernance } from '../../lib/governance-context';

export default function ChatPage() {
  const { userRole, activeDraft } = useGovernance();
  return (
    <AgenticChat
      userRole={userRole}
      activeDraft={activeDraft}
    />
  );
}
