export interface ChatDraftContext {
  contentId: string;
  title?: string;
  text?: string;
}

export function getApiBaseUrl(): string {
  // 1. Explicit environment variable (Option B: separate backend deployment)
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Client-side browser runtime (Option A: Same Project & Domain)
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // 3. SSR / build-time fallback
  return '/api';
}

async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${cleanEndpoint}`;

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server responded with valid JSON
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok && data && typeof data === 'object' && !('error' in data)) {
        data.error = `Server responded with HTTP ${res.status}`;
      }
      return data;
    }

    // If server responded with HTML (e.g. 404 / 500 error page from Vercel/Next)
    const rawText = await res.text();
    const isHtml = rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE') || rawText.includes('<html');

    if (isHtml) {
      let friendlyError = '';
      if (res.status === 404) {
        friendlyError = `Endpoint "${cleanEndpoint}" not found on ${base}. If deploying frontend and backend in separate Vercel projects, make sure NEXT_PUBLIC_API_URL is set to your backend deployment URL (e.g. https://your-backend.vercel.app/api).`;
      } else if (res.status >= 500) {
        friendlyError = `Backend server encountered an error (${res.status} ${res.statusText}). Check backend logs in Vercel.`;
      } else {
        friendlyError = `Server returned an HTML response instead of JSON (${res.status} ${res.statusText}).`;
      }

      return {
        success: false,
        error: friendlyError,
        status: res.status
      } as unknown as T;
    }

    // Attempt parsing as JSON in case content-type was omitted
    try {
      return JSON.parse(rawText);
    } catch {
      return {
        success: false,
        error: rawText || `HTTP ${res.status} error`
      } as unknown as T;
    }
  } catch (err: any) {
    const msg = err?.message || 'Network request failed';
    return {
      success: false,
      error: `Network error: ${msg}. Check that the backend server is reachable at ${base}.`
    } as unknown as T;
  }
}

export async function fetchHealth() {
  return apiFetch('/health');
}

export async function getContent(contentId: string) {
  return apiFetch(`/content/${contentId}`);
}

export async function updateContent(contentId: string, data: { rawText?: string; title?: string; status?: string }) {
  return apiFetch(`/content/${contentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function runAudit(formData: FormData) {
  return apiFetch('/audit/analyze', {
    method: 'POST',
    body: formData
  });
}

export async function runAuditText(text: string, title?: string, contentId?: string) {
  return apiFetch('/audit/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title, contentId, format: 'text_copy' })
  });
}

export async function runAuditFile(file: File, title?: string, contentId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (contentId) formData.append('contentId', contentId);
  return apiFetch('/audit/analyze', {
    method: 'POST',
    body: formData
  });
}

export async function applySurgicalPatch(
  contentId: string,
  violationId: string,
  excerpt: string,
  replacement: string,
  currentText?: string
) {
  return apiFetch(`/content/${contentId}/apply-patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ violationId, excerpt, replacement, currentText })
  });
}

export async function overrideWarning(contentId: string, violationId: string, guidelineId: string, justification: string) {
  return apiFetch(`/content/${contentId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ violationId, guidelineId, justification })
  });
}

export async function getGuidelines() {
  return apiFetch('/knowledge/guidelines');
}

export async function addGuideline(title: string, category: string, content: string) {
  return apiFetch('/knowledge/guidelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category, content })
  });
}

export async function getFacts() {
  return apiFetch('/knowledge/facts');
}

export async function addFact(claimTopic: string, approvedStatement: string, sourceCitation: string, verificationDate?: string) {
  return apiFetch('/knowledge/facts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimTopic, approvedStatement, sourceCitation, verificationDate })
  });
}

export async function getTerminology() {
  return apiFetch('/knowledge/terminology');
}

export async function addTerminology(termPattern: string, preferredTerm: string, ruleType: string, explanation: string) {
  return apiFetch('/knowledge/terminology', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termPattern, preferredTerm, ruleType, explanation })
  });
}

export async function getBrandKit() {
  return apiFetch('/knowledge/brand-kit');
}

export async function getComments(contentId: string) {
  return apiFetch(`/workflow/${contentId}/comments`);
}

export async function addComment(contentId: string, commentText: string, authorName: string, authorRole: string) {
  return apiFetch(`/workflow/${contentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentText, authorName, authorRole })
  });
}

export async function updateWorkflowStatus(contentId: string, status: string, actorName: string, role: string) {
  return apiFetch(`/workflow/${contentId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorName, role })
  });
}

export async function getAuditLogs(contentId: string) {
  return apiFetch(`/workflow/${contentId}/audit-logs`);
}

export async function getAnalyticsOverview() {
  return apiFetch('/analytics/overview');
}

export async function getAmbiguityMetrics() {
  return apiFetch('/analytics/ambiguity-metrics');
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
    return apiFetch('/chat/message', {
      method: 'POST',
      body: formData
    });
  }

  return apiFetch('/chat/message', {
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
}

export async function getChatHistory(sessionId: string = 'session_default') {
  return apiFetch(`/chat/history/${sessionId}`);
}

export async function resetChatSession(sessionId: string = 'session_default') {
  return apiFetch(`/chat/reset/${sessionId}`, {
    method: 'POST'
  });
}

export async function getAllContent() {
  return apiFetch('/content');
}

export async function fetchAuditHistory() {
  return apiFetch('/audit/history');
}

export async function fetchHistoricalReport(reportId: string) {
  return apiFetch(`/audit/history/${reportId}`);
}

export async function fetchChatSessions() {
  return apiFetch('/chat/sessions');
}

export async function fetchChatSession(sessionId: string) {
  return apiFetch(`/chat/sessions/${sessionId}`);
}

export async function createChatSession(sessionId?: string, title?: string, activeDraft?: ChatDraftContext) {
  return apiFetch('/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, title, activeDraft })
  });
}

export async function deleteChatSession(sessionId: string) {
  return apiFetch(`/chat/sessions/${sessionId}`, {
    method: 'DELETE'
  });
}
