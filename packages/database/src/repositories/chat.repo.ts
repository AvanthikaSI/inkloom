import { ChatSession, ChatMessage } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';
import { getSupabase } from '../supabase-client.js';

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
        const { data, error } = await supabase.from('chat_sessions').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          return data
            .filter((s: any) => !String(s.session_id || '').startsWith('session_workflow_'))
            .map((s: any) => ({
              sessionId: s.session_id,
              title: s.title || 'New Conversation',
              messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
              lastMessageTime: s.updated_at || s.created_at,
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
        const { data, error } = await supabase.from('chat_sessions').select('*').eq('session_id', sessionId).single();
        if (!error && data) {
          return {
            sessionId: data.session_id,
            messages: Array.isArray(data.messages) ? data.messages : [],
            activeDraft: data.active_draft
          };
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
        await supabase.from('chat_sessions').insert({
          id: `cs_${Date.now()}`,
          session_id: sessionId,
          title: sTitle,
          active_draft: activeDraft || null
        });
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
          messages: session.messages || [],
          active_draft: session.activeDraft || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' });
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
