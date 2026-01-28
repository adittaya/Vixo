import { supabase } from './supabase';
import { User } from '../types';

interface ChatSession {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class ChatService {
  /**
   * Get or create a chat session for a user
   */
  async getOrCreateSession(userId: string): Promise<ChatSession> {
    // First try to find an open session for the user
    const { data: existingSession, error: findError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      return existingSession;
    }

    // If no open session exists, create a new one
    const { data: newSession, error: createError } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: userId, status: 'open' }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating chat session:', createError);
      throw new Error('Failed to create chat session');
    }

    return newSession;
  }

  /**
   * Add a message to the chat session
   */
  async addMessage(sessionId: string, role: 'system' | 'user' | 'assistant', content: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ session_id: sessionId, role, content }])
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }

    return data;
  }

  /**
   * Get full chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }

    return data || [];
  }

  /**
   * Get recent chat history for a user (last 10 messages)
   */
  async getRecentChatHistory(userId: string): Promise<ChatMessage[]> {
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !sessionData) {
      return [];
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionData.id)
      .order('created_at', { ascending: true })
      .limit(10); // Get last 10 messages

    if (error) {
      console.error('Error fetching recent chat history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Close a chat session
   */
  async closeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId);

    if (error) {
      console.error('Error closing session:', error);
      throw new Error('Failed to close session');
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();