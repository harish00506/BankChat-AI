/**
 * useChat Hook
 * Manages chat state and message handling
 */
import { useState, useCallback } from 'react';
import { sendChatMessage } from '../api';

const INITIAL_MESSAGE = {
  type: 'assistant',
  content: `# Welcome to Bank-Chat

I'm your intelligent banking assistant powered by **Neo4j Knowledge Graph** and **Groq LLM**.

## Getting Started

Try any of these queries:
- "What accounts does C001 have?"
- "Show me client C002's transactions"
- "What are C003's investments?"
- "List loans for C001"

Use the quick buttons below or type your custom questions directly.`
};

/**
 * Custom hook for chat functionality
 * @returns {object} Chat state and handlers
 */
export function useChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Send a message to the chat API
   * @param {string} question - User's question
   * @param {object} context - Role and ID context
   */
  const sendMessage = useCallback(async (question, { role, userId, clientId }) => {
    if (!question.trim()) return;

    // Add user message immediately
    setMessages(prev => [...prev, {
      type: 'user',
      content: question.trim()
    }]);

    setLoading(true);
    setError(null);

    try {
      const data = await sendChatMessage({
        question: question.trim(),
        role,
        userId,
        clientId: role === 'advisor' ? clientId : userId,
      });

      if (data.success) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.answer,
          metadata: {
            source: data.source,
            queryType: data.query_type,
            clientId: data.client_id,
            records: data.records_retrieved
          }
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          content: data.error || 'An error occurred'
        }]);
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Connection error: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all messages and reset to initial state
   */
  const clearMessages = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setError(null);
  }, []);

  /**
   * Generate a quick query string
   * @param {string} queryType - Type of query
   * @param {string} clientId - Client ID
   * @returns {string} Query string
   */
  const getQuickQuery = useCallback((queryType, clientId) => {
    const queries = {
      accounts: `What accounts does ${clientId} have?`,
      transactions: `What are ${clientId}'s recent transactions?`,
      loans: `What loans does ${clientId} have?`,
      investments: `Show me ${clientId}'s investments`,
      credit_cards: `What credit cards does ${clientId} have?`,
      profile: `Show me ${clientId}'s profile information`
    };
    return queries[queryType] || '';
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    getQuickQuery,
  };
}

export default useChat;
