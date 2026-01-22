/**
 * Neo4j Graph Queries
 * Cypher queries for banking data retrieval from Neo4j
 */
const { runQuery } = require("./driver");

// ==================== ADVISOR QUERIES ====================

async function getAllAdvisors() {
  const cypher = `
    MATCH (a:Advisor)
    RETURN a.advisor_id AS id, a.name AS name, a.specialty AS specialty,
           a.phone AS phone, a.email AS email, a.license_number AS license_number
    ORDER BY a.name
  `;
  return runQuery(cypher);
}

async function getAdvisorById(advisorId) {
  const cypher = `
    MATCH (a:Advisor {advisor_id: $advisorId})
    RETURN a.advisor_id AS id, a.name AS name, a.specialty AS specialty,
           a.phone AS phone, a.email AS email, a.license_number AS license_number
  `;
  return runQuery(cypher, { advisorId });
}

async function getAdvisorClients(advisorId) {
  const cypher = `
    MATCH (a:Advisor {advisor_id: $advisorId})-[r:MANAGES]->(c:Client)
    RETURN c.client_id AS id, c.name AS name, c.age AS age, 
           c.occupation AS occupation, c.account_type AS account_type,
           c.member_since AS member_since, c.status AS status,
           r.since AS managing_since, r.primary AS is_primary
    ORDER BY c.name
  `;
  return runQuery(cypher, { advisorId });
}

async function getAllClients() {
  const cypher = `
    MATCH (c:Client)
    OPTIONAL MATCH (a:Advisor)-[:MANAGES]->(c)
    RETURN c.client_id AS id, c.name AS name, c.age AS age, 
           c.occupation AS occupation, c.account_type AS account_type,
           c.status AS status, c.member_since AS member_since,
           a.advisor_id AS advisor_id, a.name AS advisor_name
    ORDER BY c.name
  `;
  return runQuery(cypher);
}

// ==================== CLIENT QUERIES ====================

async function getClientProfile(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})
    RETURN c.client_id AS id, c.name AS name, c.age AS age, 
           c.occupation AS occupation, c.account_type AS account_type,
           c.phone AS phone, c.email AS email,
           c.member_since AS member_since, c.status AS status
  `;
  return runQuery(cypher, { clientId });
}

async function getClientAccounts(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[r:HAS_ACCOUNT]->(acc:Account)
    RETURN acc.account_id AS account_id, acc.type AS account_type, 
           acc.balance AS balance, acc.currency AS currency,
           acc.status AS status, acc.opened_date AS opened_date,
           r.role AS role, r.since AS since
    ORDER BY acc.opened_date DESC
  `;
  return runQuery(cypher, { clientId });
}

async function getClientTransactions(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:HAS_ACCOUNT]->(acc:Account)-[:MADE_TRANSACTION]->(t:Transaction)
    RETURN acc.account_id AS account_id, t.transaction_id AS transaction_id,
           t.type AS type, t.amount AS amount, t.date AS date,
           t.description AS description, t.status AS status
    ORDER BY t.date DESC
  `;
  return runQuery(cypher, { clientId });
}

async function getClientLoans(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[r:HAS_LOAN]->(l:Loan)
    RETURN l.loan_id AS loan_id, l.type AS loan_type,
           l.principal AS principal, l.interest_rate AS interest_rate,
           l.term_months AS term_months, l.monthly_payment AS monthly_payment,
           l.status AS status, l.start_date AS start_date
    ORDER BY l.start_date DESC
  `;
  return runQuery(cypher, { clientId });
}

async function getClientCreditCards(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[r:OWNS_CARD]->(cc:CreditCard)
    RETURN cc.card_id AS card_id, cc.type AS card_type,
           cc.credit_limit AS credit_limit, cc.balance AS balance,
           cc.apr AS apr, cc.status AS status,
           r.since AS since, r.is_primary AS is_primary
    ORDER BY r.since DESC
  `;
  return runQuery(cypher, { clientId });
}

async function getClientInvestments(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[r:HAS_INVESTMENT]->(inv:Investment)
    RETURN inv.investment_id AS investment_id, inv.type AS type,
           inv.name AS name, inv.value AS value,
           inv.return_rate AS return_rate, inv.status AS status,
           r.since AS since
    ORDER BY inv.value DESC
  `;
  return runQuery(cypher, { clientId });
}

async function getClientHistory(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:HAS_ACCOUNT]->(acc:Account)-[:MADE_TRANSACTION]->(t:Transaction)
    RETURN acc.account_id AS account_id, t.type AS transaction_type,
           t.amount AS amount, t.date AS date, t.description AS description
    ORDER BY t.date DESC
    LIMIT 20
  `;
  return runQuery(cypher, { clientId });
}

async function getFullClientProfile(clientId) {
  const [profile, accounts, transactions, loans, creditCards, investments] = await Promise.all([
    getClientProfile(clientId),
    getClientAccounts(clientId),
    getClientTransactions(clientId),
    getClientLoans(clientId),
    getClientCreditCards(clientId),
    getClientInvestments(clientId),
  ]);

  return {
    client: profile[0] || null,
    accounts,
    transactions,
    loans,
    credit_cards: creditCards,
    investments,
  };
}

// ==================== GRAPH VISUALIZATION QUERIES ====================

async function getAllNodesAndEdges() {
  const nodesQuery = `
    MATCH (n)
    RETURN 
      elementId(n) AS id,
      labels(n)[0] AS nodeLabel,
      properties(n) AS props
  `;

  const edgesQuery = `
    MATCH (a)-[r]->(b)
    RETURN 
      elementId(a) AS source,
      elementId(b) AS target,
      type(r) AS relationship,
      properties(r) AS props
  `;

  const [nodesResult, edgesResult] = await Promise.all([
    runQuery(nodesQuery),
    runQuery(edgesQuery),
  ]);

  // Process nodes - use nodeLabel (Neo4j label) as type, not props.type
  const nodes = nodesResult.map((record) => {
    const props = record.props || {};
    const nodeType = record.nodeLabel; // Use Neo4j label as the type
    const label = props.name || props.client_id || props.account_id || props.loan_id ||
      props.card_id || props.investment_id || props.transaction_id || record.id.slice(-6);
    // Spread props first, then override type with the Neo4j label
    return { ...props, id: record.id, type: nodeType, label };
  });

  // Process edges
  const links = edgesResult.map((record) => ({
    source: record.source,
    target: record.target,
    relationship: record.relationship,
    ...record.props,
  }));

  // Count by type
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  return { nodes, links, nodeTypes };
}

// ==================== FILTERED GRAPH QUERIES ====================

async function getGraphByAdvisor(advisorId) {
  // Get all nodes and edges related to a specific advisor's clients
  const nodesQuery = `
    MATCH (a:Advisor {advisor_id: $advisorId})
    OPTIONAL MATCH (a)-[:MANAGES]->(c:Client)
    WITH a, collect(DISTINCT c) AS clients
    
    // Get all related nodes for clients
    UNWIND clients AS client
    OPTIONAL MATCH (client)-[]->(related)
    WITH a, clients, collect(DISTINCT related) AS relatedNodes
    
    // Now combine all nodes by collecting them together
    UNWIND [a] + clients + relatedNodes AS allNodes
    WITH DISTINCT allNodes AS n
    WHERE n IS NOT NULL
    RETURN 
      elementId(n) AS id,
      labels(n)[0] AS nodeLabel,
      properties(n) AS props
  `;

  const edgesQuery = `
    MATCH (a:Advisor {advisor_id: $advisorId})
    OPTIONAL MATCH (a)-[:MANAGES]->(c:Client)
    WITH a, collect(DISTINCT c) AS clients
    
    // Get edges from advisor to clients
    UNWIND clients AS client
    OPTIONAL MATCH (a)-[r1:MANAGES]->(client)
    WITH a, clients, collect({source: elementId(a), target: elementId(client), rel: type(r1), props: properties(r1)}) AS advisorEdges
    
    // Get edges from clients to related nodes
    UNWIND clients AS client
    OPTIONAL MATCH (client)-[r]->(related)
    WITH advisorEdges, collect({source: elementId(client), target: elementId(related), rel: type(r), props: properties(r)}) AS clientEdges
    
    // Combine and return edges
    WITH advisorEdges + clientEdges AS allEdges
    UNWIND allEdges AS edge
    WITH edge WHERE edge.source IS NOT NULL AND edge.target IS NOT NULL
    RETURN DISTINCT
      edge.source AS source,
      edge.target AS target,
      edge.rel AS relationship,
      edge.props AS props
  `;

  const [nodesResult, edgesResult] = await Promise.all([
    runQuery(nodesQuery, { advisorId }),
    runQuery(edgesQuery, { advisorId }),
  ]);

  // Process nodes - use nodeLabel (Neo4j label) as type, not props.type
  const nodes = nodesResult.map((record) => {
    const props = record.props || {};
    const nodeType = record.nodeLabel; // Use Neo4j label as the type
    const label = props.name || props.client_id || props.advisor_id || props.account_id ||
      props.loan_id || props.card_id || props.investment_id || props.transaction_id || record.id.slice(-6);
    return { ...props, id: record.id, type: nodeType, label };
  });

  // Process edges
  const links = edgesResult.map((record) => ({
    source: record.source,
    target: record.target,
    relationship: record.relationship,
    ...(record.props || {}),
  }));

  // Count by type
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  return { nodes, links, nodeTypes };
}

async function getGraphByClient(clientId) {
  const nodesQuery = `
    MATCH (c:Client {client_id: $clientId})
    OPTIONAL MATCH (a:Advisor)-[:MANAGES]->(c)
    OPTIONAL MATCH (c)-[]->(related)
    WITH collect(DISTINCT a) AS advisors, collect(DISTINCT related) AS relatedNodes, c
    WITH [c] + advisors + relatedNodes AS allNodes
    UNWIND allNodes AS n
    WITH DISTINCT n
    WHERE n IS NOT NULL
    RETURN 
      elementId(n) AS id,
      labels(n)[0] AS nodeLabel,
      properties(n) AS props
  `;

  const edgesQuery = `
    MATCH (c:Client {client_id: $clientId})
    OPTIONAL MATCH (a:Advisor)-[r1:MANAGES]->(c)
    WITH c, collect(CASE WHEN a IS NOT NULL THEN {source: elementId(a), target: elementId(c), rel: type(r1), props: properties(r1)} END) AS advisorEdges
    
    OPTIONAL MATCH (c)-[r]->(related)
    WITH c, [e IN advisorEdges WHERE e IS NOT NULL] AS advisorEdges, collect(CASE WHEN related IS NOT NULL THEN {source: elementId(c), target: elementId(related), rel: type(r), props: properties(r)} END) AS clientEdges
    
    WITH advisorEdges + [e IN clientEdges WHERE e IS NOT NULL] AS allEdges
    UNWIND allEdges AS edge
    RETURN DISTINCT
      edge.source AS source,
      edge.target AS target,
      edge.rel AS relationship,
      edge.props AS props
  `;

  const [nodesResult, edgesResult] = await Promise.all([
    runQuery(nodesQuery, { clientId }),
    runQuery(edgesQuery, { clientId }),
  ]);

  // Process nodes - use nodeLabel (Neo4j label) as type, not props.type
  const nodes = nodesResult.map((record) => {
    const props = record.props || {};
    const nodeType = record.nodeLabel; // Use Neo4j label as the type
    const label = props.name || props.client_id || props.advisor_id || props.account_id ||
      props.loan_id || props.card_id || props.investment_id || props.transaction_id || record.id.slice(-6);
    return { ...props, id: record.id, type: nodeType, label };
  });

  // Process edges
  const links = edgesResult.map((record) => ({
    source: record.source,
    target: record.target,
    relationship: record.relationship,
    ...(record.props || {}),
  }));

  // Count by type
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  return { nodes, links, nodeTypes };
}

// ==================== ACCOUNT ANALYTICS ====================

async function getAccountBalance(clientId) {
  const cypher = `
    MATCH (c:Client {client_id: $clientId})-[:HAS_ACCOUNT]->(acc:Account)
    RETURN sum(acc.balance) AS total_balance,
           count(acc) AS account_count,
           collect({type: acc.type, balance: acc.balance}) AS accounts
  `;
  return runQuery(cypher, { clientId });
}

module.exports = {
  // Advisor queries
  getAllAdvisors,
  getAdvisorById,
  getAdvisorClients,
  getAllClients,
  // Client queries
  getClientProfile,
  getClientAccounts,
  getClientTransactions,
  getClientLoans,
  getClientCreditCards,
  getClientInvestments,
  getClientHistory,
  getFullClientProfile,
  // Graph visualization
  getAllNodesAndEdges,
  getGraphByAdvisor,
  getGraphByClient,
  // Account analytics
  getAccountBalance,
};
