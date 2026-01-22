/**
 * Application Constants
 * Note: Advisors and clients are now fetched from the database
 */

// User roles
export const ROLES = {
  ADVISOR: 'advisor',
  CLIENT: 'client',
};

// Query types for quick actions
export const QUERY_TYPES = {
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  LOANS: 'loans',
  INVESTMENTS: 'investments',
  CREDIT_CARDS: 'credit_cards',
  PROFILE: 'profile',
};

// Node colors for graph visualization
export const NODE_COLORS = {
  Client: '#4a9eff',
  Account: '#51cf66',
  Transaction: '#ffd43b',
  Loan: '#ff6b6b',
  CreditCard: '#ff922b',
  Investment: '#845ef7',
  Advisor: '#20c997',
};

// Edge colors for graph visualization
export const EDGE_COLORS = {
  HAS_ACCOUNT: '#51cf66',
  MADE_TRANSACTION: '#ffd43b',
  TRANSFERRED_TO: '#69db7c',
  HAS_LOAN: '#ff6b6b',
  OWNS_CARD: '#ff922b',
  HAS_INVESTMENT: '#845ef7',
  MANAGES: '#20c997',
  default: '#868e96',
};
