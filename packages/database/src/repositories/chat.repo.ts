import { ChatSession, ChatMessage } from '@inkloom/shared';
import { inMemoryDb } from '../in-memory-db.js';

export class ChatRepository {
  public static async getAllSessions(): Promise<Array<{
    sessionId: string;
    title: string;
    messageCount: number;
    lastMessageTime?: string;
    activeDraft?: any;
  }>> {
    const sessions = Array.from(inMemoryDb.chatSessions.values());
    if (sessions.length === 0) {
      // Create initial default session
      const defaultSession: ChatSession = {
        sessionId: 'session_default',
        messages: [],
        activeDraft: {
          contentId: 'content_demo_01',
          title: 'Inkloom AI Product Launch Press Release',
          text: 'We are thrilled to announce InkLoom, the cheap and revolutionary game-changer that offers 100% infallible marketing compliance. Our magic AI engine is the fastest platform in the world, running with zero latency.'
        }
      };
      inMemoryDb.chatSessions.set(defaultSession.sessionId, defaultSession);
      inMemoryDb.persist();
      sessions.push(defaultSession);
    }

    return sessions.map((s) => {
      const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
      let title = (s as any).title;
      if (!title) {
        if (s.sessionId === 'session_default') {
          title = 'Main Compliance Audit Chat';
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
    return inMemoryDb.chatSessions.get(sessionId) || null;
  }

  public static async createSession(sessionId: string, title?: string, activeDraft?: any): Promise<ChatSession> {
    const newSession: ChatSession = {
      sessionId,
      messages: [],
      activeDraft
    };
    (newSession as any).title = title || 'New Conversation';
    inMemoryDb.chatSessions.set(sessionId, newSession);
    inMemoryDb.persist();
    return newSession;
  }

  public static async saveSession(session: ChatSession): Promise<ChatSession> {
    inMemoryDb.chatSessions.set(session.sessionId, session);
    inMemoryDb.persist();
    return session;
  }

  public static async deleteSession(sessionId: string): Promise<boolean> {
    const deleted = inMemoryDb.chatSessions.delete(sessionId);
    if (deleted) inMemoryDb.persist();
    return deleted;
  }
}
