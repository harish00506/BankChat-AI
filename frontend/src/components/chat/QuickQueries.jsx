/**
 * QuickQueries Component
 * Quick action buttons for common queries
 */
import React from 'react';

const QUERY_TYPES = [
  { id: 'accounts', icon: '💳', label: 'Accounts' },
  { id: 'transactions', icon: '💸', label: 'Transactions' },
  { id: 'loans', icon: '🏠', label: 'Loans' },
  { id: 'investments', icon: '📈', label: 'Investments' },
  { id: 'credit_cards', icon: '💳', label: 'Credit Cards' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

/**
 * @param {object} props
 * @param {function} props.onQuerySelect - Callback when a query type is selected
 */
export function QuickQueries({ onQuerySelect }) {
  return (
    <div className="quick-queries">
      {QUERY_TYPES.map(({ id, icon, label }) => (
        <button
          key={id}
          onClick={() => onQuerySelect(id)}
          title={`Query ${label}`}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

export default QuickQueries;
