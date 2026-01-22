/**
 * Sidebar Component
 * Main navigation and controls sidebar with dynamic advisor/client selection
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickQueries } from '../chat';
import { StatusIndicator } from '../common';

/**
 * @param {object} props
 * @param {object} props.users - Users state from useUsers hook
 * @param {boolean} props.serverOnline - Server online status
 * @param {function} props.onQuickQuery - Callback for quick query selection
 */
export function Sidebar({ users, serverOnline, onQuickQuery }) {
  const navigate = useNavigate();
  const {
    advisors,
    clients,
    selectedAdvisor,
    selectedClient,
    selectAdvisor,
    selectClient,
    loading
  } = users;

  const handleAdvisorChange = (e) => {
    selectAdvisor(e.target.value);
  };

  const handleClientChange = (e) => {
    selectClient(e.target.value);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        <span className="logo-icon">🏦</span>
        <h1>Bank-Chat</h1>
      </div>

      {/* Advisor Selection */}
      <div className="sidebar-section">
        <h3>💼 Select Advisor</h3>

        <div className="form-group">
          <label htmlFor="advisorId">Advisor</label>
          <select
            id="advisorId"
            value={selectedAdvisor?.id || ''}
            onChange={handleAdvisorChange}
            disabled={loading || advisors.length === 0}
          >
            {loading ? (
              <option>Loading...</option>
            ) : advisors.length === 0 ? (
              <option>No advisors available</option>
            ) : (
              advisors.map(advisor => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name} - {advisor.specialty}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedAdvisor && (
          <div className="advisor-info">
            <small>📧 {selectedAdvisor.email}</small>
          </div>
        )}
      </div>

      {/* Client Selection */}
      <div className="sidebar-section">
        <h3>👤 Select Client</h3>

        <div className="form-group">
          <label htmlFor="clientId">Client ({clients.length} clients)</label>
          <select
            id="clientId"
            value={selectedClient?.id || ''}
            onChange={handleClientChange}
            disabled={loading || clients.length === 0}
          >
            {loading ? (
              <option>Loading...</option>
            ) : clients.length === 0 ? (
              <option>No clients for this advisor</option>
            ) : (
              clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.id} - {client.name}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedClient && (
          <div className="client-info-card">
            <div className="client-info-header">
              <div className="avatar">👤</div>
              <div>
                <div className="name">{selectedClient.name}</div>
                <div className="id">{selectedClient.id}</div>
              </div>
            </div>
            <div className="client-info-details">
              <div className="client-info-item">
                <span className="label">Account Type</span>
                <span className="value">{selectedClient.account_type || 'Premium'}</span>
              </div>
              <div className="client-info-item">
                <span className="label">Status</span>
                <span className="value">{selectedClient.status || 'Active'}</span>
              </div>
              <div className="client-info-item">
                <span className="label">Member Since</span>
                <span className="value">{selectedClient.member_since || '2023'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Queries Section */}
      <div className="sidebar-section">
        <h3>Quick Queries</h3>
        <QuickQueries onQuerySelect={onQuickQuery} disabled={!selectedClient} />
      </div>

      {/* Graph Visualization */}
      <div className="sidebar-section">
        <h3>Graph Visualization</h3>
        <button
          className="visualize-btn"
          onClick={() => navigate('/visualize', {
            state: {
              advisorId: selectedAdvisor?.id,
              clientId: selectedClient?.id
            }
          })}
        >
          🕸️ Visualize Graph
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
