const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ChatDraftContext {
  contentId: string;
  title?: string;
  text?: string;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getContent(contentId: string) {
  const res = await fetch(`${API_BASE}/content/${contentId}`);
  return res.json();
}

export async function runAudit(formData: FormData) {
  const res = await fetch(`${API_BASE}/audit/analyze`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function runAuditText(text: string, title?: string, contentId?: string) {
  const res = await fetch(`${API_BASE}/audit/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title, contentId, format: 'text_copy' })
  });
  return res.json();
}

export async function runAuditFile(file: File, title?: string, contentId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (contentId) formData.append('contentId', contentId);
  const res = await fetch(`${API_BASE}/audit/analyze`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function applySurgicalPatch(
  contentId: string,
  violationId: string,
  excerpt: string,
  replacement: string,
  currentText?: string
) {
  const res = await fetch(`${API_BASE}/content/${contentId}/apply-patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ violationId, excerpt, replacement, currentText })
  });
  return res.json();
}

export async function overrideWarning(contentId: string, violationId: string, guidelineId: string, justification: string) {
  const res = await fetch(`${API_BASE}/content/${contentId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ violationId, guidelineId, justification })
  });
  return res.json();
}

export async function getGuidelines() {
  const res = await fetch(`${API_BASE}/knowledge/guidelines`);
  return res.json();
}

export async function addGuideline(title: string, category: string, content: string) {
  const res = await fetch(`${API_BASE}/knowledge/guidelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category, content })
  });
  return res.json();
}

export async function getFacts() {
  const res = await fetch(`${API_BASE}/knowledge/facts`);
  return res.json();
}

export async function addFact(claimTopic: string, approvedStatement: string, sourceCitation: string, verificationDate?: string) {
  const res = await fetch(`${API_BASE}/knowledge/facts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimTopic, approvedStatement, sourceCitation, verificationDate })
  });
  return res.json();
}

export async function getTerminology() {
  const res = await fetch(`${API_BASE}/knowledge/terminology`);
  return res.json();
}

export async function addTerminology(termPattern: string, preferredTerm: string, ruleType: string, explanation: string) {
  const res = await fetch(`${API_BASE}/knowledge/terminology`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termPattern, preferredTerm, ruleType, explanation })
  });
  return res.json();
}

export async function getBrandKit() {
  const res = await fetch(`${API_BASE}/knowledge/brand-kit`);
  return res.json();
}

export async function getComments(contentId: string) {
  const res = await fetch(`${API_BASE}/workflow/${contentId}/comments`);
  return res.json();
}

export async function addComment(contentId: string, commentText: string, authorName: string, authorRole: string) {
  const res = await fetch(`${API_BASE}/workflow/${contentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentText, authorName, authorRole })
  });
  return res.json();
}

export async function updateWorkflowStatus(contentId: string, status: string, actorName: string, role: string) {
  const res = await fetch(`${API_BASE}/workflow/${contentId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorName, role })
  });
  return res.json();
}

export async function getAuditLogs(contentId: string) {
  const res = await fetch(`${API_BASE}/workflow/${contentId}/audit-logs`);
  return res.json();
}

export async function getAnalyticsOverview() {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  return res.json();
}

export async function getAmbiguityMetrics() {
  const res = await fetch(`${API_BASE}/analytics/ambiguity-metrics`);
  return res.json();
}

export async function sendChatMessage(
  message: string,
  sessionId: string = 'session_default',
  userRole: string = 'creator',
  file?: File | null,
  activeDraft?: ChatDraftContext
) {
  if (file) {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('sessionId', sessionId);
    formData.append('userRole', userRole);
    if (activeDraft?.contentId) formData.append('contentId', activeDraft.contentId);
    if (activeDraft?.title) formData.append('contentTitle', activeDraft.title);
    if (activeDraft?.text !== undefined) formData.append('contentText', activeDraft.text);
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  }

  const res = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId,
      userRole,
      contentId: activeDraft?.contentId,
      contentTitle: activeDraft?.title,
      contentText: activeDraft?.text
    })
  });
  return res.json();
}

export async function getChatHistory(sessionId: string = 'session_default') {
  const res = await fetch(`${API_BASE}/chat/history/${sessionId}`);
  return res.json();
}

export async function resetChatSession(sessionId: string = 'session_default') {
  const res = await fetch(`${API_BASE}/chat/reset/${sessionId}`, {
    method: 'POST'
  });
  return res.json();
}
