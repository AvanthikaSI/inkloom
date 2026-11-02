import { ChatSession, ChatMessage } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

function toChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    role: (row.role || 'user') as 'user' | 'assistant',
    content: row.content || '',
    attachment: row.attachment || undefined,
    activeAgent: row.active_agent || undefined,
    toolExecutions: Array.isArray(row.tool_executions) ? row.tool_executions : [],
    structuredFindings: Array.isArray(row.structured_findings) ? row.structured_findings : [],
    timestamp: row.created_at || new Date().toISOString()
  };
}

export class ChatRepository {
  public static async getAllSessions(): Promise<Array<{
    sessionId: string;
    title: string;
    messageCount: number;
    lastMessageTime?: string;
    activeDraft?: any;
  }>> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const [sessionsRes, msgsRes] = await Promise.all([
          supabase.from('chat_sessions').select('*').order('created_at', { ascending: false }),
          supabase.from('chat_messages').select('session_id, created_at')
        ]);

        if (!sessionsRes.error && Array.isArray(sessionsRes.data) && sessionsRes.data.length > 0) {
          const msgCounts: Record<string, number> = {};
          const lastMsgTimes: Record<string, string> = {};

          if (!msgsRes.error && Array.isArray(msgsRes.data)) {
            for (const m of msgsRes.data) {
              const sId = m.session_id;
              if (sId) {
                msgCounts[sId] = (msgCounts[sId] || 0) + 1;
                if (!lastMsgTimes[sId] || m.created_at > lastMsgTimes[sId]) {
                  lastMsgTimes[sId] = m.created_at;
                }
              }
            }
          }

          return sessionsRes.data
            .filter((s: any) => !String(s.session_id || '').startsWith('session_workflow_'))
            .map((s: any) => ({
              sessionId: s.session_id,
              title: s.title || 'New Conversation',
              messageCount: msgCounts[s.session_id] ?? (Array.isArray(s.messages) ? s.messages.length : 0),
              lastMessageTime: lastMsgTimes[s.session_id] || s.updated_at || s.created_at,
              activeDraft: s.active_draft
            }));
        }
      } catch (err) {
        console.warn('Supabase getAllSessions failed, using fallback store:', err);
      }
    }

    const sessions = Array.from(inMemoryDb.chatSessions.values())
      // Exclude workflow-specific sessions from the global chat list
      .filter((s) => !s.sessionId.startsWith('session_workflow_'));

    if (sessions.length === 0) {
      const defaultSession: ChatSession = {
        sessionId: 'session_default',
        messages: [],
        activeDraft: undefined
      };
      (defaultSession as any).title = 'Main Conversation';
      inMemoryDb.chatSessions.set(defaultSession.sessionId, defaultSession);
      inMemoryDb.persist();
      sessions.push(defaultSession);
    }

    return sessions.map((s) => {
      const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
      let title = (s as any).title;
      if (!title) {
        if (s.sessionId === 'session_default') {
          title = 'Main Conversation';
        } else if (s.messages && s.messages.length > 0) {
          const firstUser = s.messages.find((m) => m.role === 'user');
          title = firstUser?.content ? firstUser.content.slice(0, 36) + (firstUser.content.length > 36 ? '...' : '') : 'New Session';
        } else {
          title = 'New Session';
        }
      }

      return {
        sessionId: s.sessionId,
        title,
        messageCount: s.messages ? s.messages.length : 0,
        lastMessageTime: lastMsg?.timestamp,
        activeDraft: s.activeDraft
      };
    });
  }

  public static async getSession(sessionId: string): Promise<ChatSession | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const [sessRes, msgsRes] = await Promise.all([
          supabase.from('chat_sessions').select('*').eq('session_id', sessionId).single(),
          supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true })
        ]);

        const sessionData = sessRes.data;
        const msgList: ChatMessage[] = (!msgsRes.error && Array.isArray(msgsRes.data))
          ? msgsRes.data.map(toChatMessage)
          : [];

        if (sessionData || msgList.length > 0) {
          const sessionObj: ChatSession = {
            sessionId,
            messages: msgList,
            activeDraft: sessionData?.active_draft
          };
          (sessionObj as any).title = sessionData?.title || 'Conversation';

          // Sync with inMemoryDb for low-latency lookups
          inMemoryDb.chatSessions.set(sessionId, sessionObj);
          return sessionObj;
        }
      } catch (err) {
        console.warn('Supabase getSession failed, using fallback store:', err);
      }
    }
    return inMemoryDb.chatSessions.get(sessionId) || null;
  }

  public static async createSession(sessionId: string, title?: string, activeDraft?: any): Promise<ChatSession> {
    const newSession: ChatSession = {
      sessionId,
      messages: [],
      activeDraft
    };
    const sTitle = title || 'New Conversation';
    (newSession as any).title = sTitle;

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('chat_sessions').upsert({
          id: `cs_${Date.now()}`,
          session_id: sessionId,
          title: sTitle,
          active_draft: activeDraft || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' });
      } catch (err) {
        console.warn('Supabase createSession failed, using fallback store:', err);
      }
    }

    inMemoryDb.chatSessions.set(sessionId, newSession);
    inMemoryDb.persist();
    return newSession;
  }

  public static async saveSession(session: ChatSession): Promise<ChatSession> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('chat_sessions').upsert({
          session_id: session.sessionId,
          title: (session as any).title || 'Conversation',
          active_draft: session.activeDraft || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' });

        // Persist messages to chat_messages table
        if (Array.isArray(session.messages) && session.messages.length > 0) {
          const msgRows = session.messages.map((m) => ({
            id: m.id,
            session_id: session.sessionId,
            role: m.role,
            content: m.content || '',
            active_agent: m.activeAgent || 'Master Orchestrator',
            tool_executions: m.toolExecutions || [],
            structured_findings: m.structuredFindings || [],
            attachment: m.attachment || null,
            created_at: m.timestamp || new Date().toISOString()
          }));

          await supabase.from('chat_messages').upsert(msgRows, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('Supabase saveSession failed, using fallback store:', err);
      }
    }

    inMemoryDb.chatSessions.set(session.sessionId, session);
    inMemoryDb.persist();
    return session;
  }

  public static async renameSession(sessionId: string, title: string): Promise<boolean> {
    const trimmed = title.trim();
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('chat_sessions').update({ title: trimmed, updated_at: new Date().toISOString() }).eq('session_id', sessionId);
      } catch (err) {
        console.warn('Supabase renameSession failed, using fallback store:', err);
      }
    }

    const session = inMemoryDb.chatSessions.get(sessionId);
    if (!session) return false;
    (session as any).title = trimmed;
    inMemoryDb.persist();
    return true;
  }

  public static async deleteSession(sessionId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('chat_messages').delete().eq('session_id', sessionId);
        await supabase.from('chat_sessions').delete().eq('session_id', sessionId);
      } catch (err) {
        console.warn('Supabase deleteSession failed, using fallback store:', err);
      }
    }

    const deleted = inMemoryDb.chatSessions.delete(sessionId);
    if (deleted) inMemoryDb.persist();
    return deleted;
  }
}
