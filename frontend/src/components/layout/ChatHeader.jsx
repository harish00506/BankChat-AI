/**
 * ChatHeader Component
 * Header for the main chat area - shows current advisor/client context
 */
import React from 'react';
import { ThemeToggle, StatusIndicator } from '../common';

/**
 * @param {object} props
 * @param {boolean} props.darkMode - Current dark mode state
 * @param {function} props.onToggleTheme - Theme toggle callback
 * @param {object} props.selectedAdvisor - Currently selected advisor
 * @param {object} props.selectedClient - Currently selected client
 * @param {boolean} props.serverOnline - Server online status
 */
export function ChatHeader({ darkMode, onToggleTheme, selectedAdvisor, selectedClient, serverOnline }) {
  return (
    <header className="chat-header">
      <div className="header-left">
        <h2>Banking Assistant</h2>
        <p>
          {selectedAdvisor && selectedClient ? (
            <>
              <span className="context-badge advisor">💼 {selectedAdvisor.name}</span>
              <span className="context-separator">→</span>
              <span className="context-badge client">👤 {selectedClient.name}</span>
            </>
          ) : (
            'Powered by Neo4j Knowledge Graph + Groq LLM'
          )}
        </p>
      </div>
      <div className="header-right" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
          <StatusIndicator label="API" online={serverOnline} />
          <StatusIndicator label="DB" online={serverOnline} className="neo4j" />
          <StatusIndicator label="LLM" online={serverOnline} className="groq" />
        </div>
        <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}

export default ChatHeader;
