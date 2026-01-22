/**
 * ChatMessage Component
 * Renders a single chat message with markdown parsing
 */
import React from 'react';
import { LLMParser } from '../../utils/LLMParser';

/**
 * @param {object} props
 * @param {object} props.message - Message object with type and content
 */
export function ChatMessage({ message }) {
  const isParsed = message.type === 'assistant';

  const content = isParsed
    ? <div dangerouslySetInnerHTML={{ __html: LLMParser.parse(message.content) }} />
    : <p>{message.content}</p>;

  return (
    <div className={`message ${message.type}`}>
      <div className="message-content">
        {content}
        {message.metadata && <MessageMetadata metadata={message.metadata} />}
      </div>
    </div>
  );
}

/**
 * Message metadata display
 */
function MessageMetadata({ metadata }) {
  return (
    <div className="message-meta">
      <span>📊 Source: {metadata.source}</span>
      <span>🔍 Query: {metadata.queryType}</span>
      <span>👤 Client: {metadata.clientId}</span>
      {metadata.records && <span>📄 Records: {metadata.records}</span>}
    </div>
  );
}

export default ChatMessage;
