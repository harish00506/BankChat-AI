// Graph Queries - Cypher queries for Neo4j banking data retrieval
const { runQuery } = require("./neo4j-driver");

// Get client profile
async function getClientProfile(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})
    RETURN c.client_id AS id, c.name AS name, c.age AS age, 
           c.occupation AS occupation, c.member_since AS member_since,
           c.credit_score AS credit_score
  `;
  return runQuery(cypher, { clientId });
}

// Get client accounts
async function getClientAccounts(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[r:HAS_ACCOUNT]->(a:Account)
    RETURN a.account_id AS account_id, a.type AS type, 
           a.balance AS balance, a.opened_date AS opened_date,
           a.status AS status, a.interest_rate AS interest_rate
    ORDER BY a.balance DESC
  `;
  return runQuery(cypher, { clientId });
}

// Get client transactions
async function getClientTransactions(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:HAS_ACCOUNT]->(a:Account)-[:MADE_TRANSACTION]->(t:Transaction)
    RETURN t.transaction_id AS transaction_id, t.type AS type, 
           t.amount AS amount, t.date AS date,
           t.description AS description, a.account_id AS from_account
    ORDER BY t.date DESC
    LIMIT 20
  `;
  return runQuery(cypher, { clientId });
}

// Get client loans
async function getClientLoans(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:HAS_LOAN]->(l:Loan)
    RETURN l.loan_id AS loan_id, l.type AS type, l.amount AS amount,
           l.interest_rate AS interest_rate, l.term_months AS term_months,
           l.monthly_payment AS monthly_payment, l.status AS status,
           l.start_date AS start_date
    ORDER BY l.amount DESC
  `;
  return runQuery(cypher, { clientId });
}

// Get client credit cards
async function getClientCreditCards(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:OWNS_CARD]->(cc:CreditCard)
    RETURN cc.card_id AS card_id, cc.type AS type, 
           cc.credit_limit AS credit_limit, cc.current_balance AS current_balance,
           cc.apr AS apr, cc.rewards_rate AS rewards_rate,
           cc.status AS status
    ORDER BY cc.credit_limit DESC
  `;
  return runQuery(cypher, { clientId });
}

// Get client investments
async function getClientInvestments(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:HAS_INVESTMENT]->(i:Investment)
    RETURN i.investment_id AS investment_id, i.type AS type, 
           i.value AS value, i.purchase_date AS purchase_date,
           i.return_rate AS return_rate, i.risk_level AS risk_level
    ORDER BY i.value DESC
  `;
  return runQuery(cypher, { clientId });
}

// Get full client financial profile
async function getFullClientProfile(clientId) {
  const [profile, accounts, transactions, loans, creditCards, investments] = await Promise.all([
    getClientProfile(clientId),
    getClientAccounts(clientId),
    getClientTransactions(clientId),
    getClientLoans(clientId),
    getClientCreditCards(clientId),
    getClientInvestments(clientId)
  ]);

  return {
    client: profile[0] || null,
    accounts,
    transactions,
    loans,
    credit_cards: creditCards,
    investments
  };
}

// Get total net worth for a client
async function getClientNetWorth(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})
    OPTIONAL MATCH (c)-[:HAS_ACCOUNT]->(a:Account)
    OPTIONAL MATCH (c)-[:HAS_INVESTMENT]->(i:Investment)
    OPTIONAL MATCH (c)-[:HAS_LOAN]->(l:Loan)
    OPTIONAL MATCH (c)-[:OWNS_CARD]->(cc:CreditCard)
    WITH c, 
         COALESCE(SUM(a.balance), 0) AS total_accounts,
         COALESCE(SUM(i.value), 0) AS total_investments,
         COALESCE(SUM(l.amount), 0) AS total_loans,
         COALESCE(SUM(cc.current_balance), 0) AS total_card_debt
    RETURN c.client_id AS client_id, c.name AS name,
           total_accounts AS account_balance,
           total_investments AS investment_value,
           total_loans AS loan_debt,
           total_card_debt AS credit_card_debt,
           (total_accounts + total_investments - total_loans - total_card_debt) AS net_worth
  `;
  return runQuery(cypher, { clientId });
}

module.exports = {
  getClientProfile,
  getClientAccounts,
  getClientTransactions,
  getClientLoans,
  getClientCreditCards,
  getClientInvestments,
  getFullClientProfile,
  getClientNetWorth
};
