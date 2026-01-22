/**
 * Chat API
 * Handles all chat-related API calls
 */
import { apiRequest } from './config';

/**
 * Send a chat message and get AI response
 * @param {object} params - Chat parameters
 * @param {string} params.question - The user's question
 * @param {string} params.role - User role ('advisor' or 'client')
 * @param {string} params.userId - User ID
 * @param {string} params.clientId - Client ID being queried
 * @returns {Promise<object>} Chat response
 */
export async function sendChatMessage({ question, role, userId, clientId }) {
    return apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
            question,
            role,
            user_id: userId,
            client_id: clientId,
        }),
    });
}

/**
 * Get chat history (if implemented)
 * @param {string} userId - User ID
 * @returns {Promise<array>} Chat history
 */
export async function getChatHistory(userId) {
    return apiRequest(`/api/chat/history?userId=${userId}`);
}

export default {
    sendChatMessage,
    getChatHistory,
};
