/**
 * Vector Search Service
 * Semantic search combining embeddings with Neo4j graph data
 */
const { searchSimilar } = require("../db/supabase");
const { generateEmbedding } = require("./embedding.service");
const { runQuery } = require("../db/neo4j");

/**
 * Semantic search for similar banking content
 * @param {string} query - Natural language query
 * @param {string} contentType - Filter: 'account', 'transaction', 'loan', etc.
 * @param {number} limit - Max results
 */
async function semanticSearch(query, contentType = null, limit = 5) {
  console.log(`[Vector] Search: "${query}" (type: ${contentType || "all"})`);

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Search pgvector
  const vectorResults = await searchSimilar({
    queryEmbedding,
    contentType,
    limit,
    threshold: 0.3,
  });

  if (vectorResults.length === 0) {
    console.log("[Vector] No similar items found");
    return [];
  }

  console.log(`[Vector] Found ${vectorResults.length} items`);

  // Enrich with graph data
  return enrichWithGraphData(vectorResults);
}

/**
 * Enrich vector results with Neo4j graph relationships
 */
async function enrichWithGraphData(vectorResults) {
  const enriched = [];

  for (const result of vectorResults) {
    const { neo4j_id, content_type, content_text, similarity, metadata } = result;
    let graphData = null;

    try {
      const queries = {
        account: `
          MATCH (a:Account {account_id: $id})
          OPTIONAL MATCH (c:Client)-[:HAS_ACCOUNT]->(a)
          OPTIONAL MATCH (a)-[:HAS_TRANSACTION]->(t:Transaction)
          RETURN a as account,
                 c.name as owner,
                 collect(DISTINCT t.type) as transaction_types,
                 sum(t.amount) as total_transactions
        `,
        transaction: `
          MATCH (t:Transaction {transaction_id: $id})
          OPTIONAL MATCH (a:Account)-[:HAS_TRANSACTION]->(t)
          OPTIONAL MATCH (c:Client)-[:HAS_ACCOUNT]->(a)
          RETURN t as transaction,
                 a.account_number as account_number,
                 c.name as client_name
        `,
        loan: `
          MATCH (l:Loan {loan_id: $id})
          OPTIONAL MATCH (c:Client)-[:HAS_LOAN]->(l)
          RETURN l as loan,
                 c.name as borrower,
                 l.amount as principal,
                 l.interest_rate as interest_rate
        `,
        credit_card: `
          MATCH (cc:CreditCard {card_id: $id})
          OPTIONAL MATCH (c:Client)-[:HAS_CREDIT_CARD]->(cc)
          RETURN cc as credit_card,
                 c.name as card_holder,
                 cc.credit_limit as credit_limit,
                 cc.current_balance as current_balance
        `,
        investment: `
          MATCH (i:Investment {investment_id: $id})
          OPTIONAL MATCH (c:Client)-[:HAS_INVESTMENT]->(i)
          RETURN i as investment,
                 c.name as investor,
                 i.value as current_value,
                 i.investment_type as investment_type
        `,
        client: `
          MATCH (c:Client {client_id: $id})
          OPTIONAL MATCH (c)-[:HAS_ACCOUNT]->(a:Account)
          OPTIONAL MATCH (c)-[:HAS_LOAN]->(l:Loan)
          OPTIONAL MATCH (c)-[:HAS_INVESTMENT]->(i:Investment)
          RETURN c as client,
                 collect(DISTINCT a.account_type) as account_types,
                 collect(DISTINCT l.loan_type) as loan_types,
                 collect(DISTINCT i.investment_type) as investment_types
        `,
      };

      if (queries[content_type]) {
        graphData = await runQuery(queries[content_type], { id: neo4j_id });
      }
    } catch (error) {
      console.error(`[Vector] Enrichment error ${content_type}:${neo4j_id}:`, error.message);
    }

    enriched.push({
      id: neo4j_id,
      type: content_type,
      text: content_text,
      similarity: parseFloat(similarity).toFixed(3),
      metadata,
      graph_data: graphData?.[0] || null,
    });
  }

  return enriched;
}

/**
 * Find similar clients based on financial profile
 */
async function findSimilarClients(clientId, limit = 3) {
  const clientData = await runQuery(
    `
    MATCH (c:Client {client_id: $id})
    OPTIONAL MATCH (c)-[:HAS_ACCOUNT]->(a:Account)
    OPTIONAL MATCH (c)-[:HAS_LOAN]->(l:Loan)
    OPTIONAL MATCH (c)-[:HAS_INVESTMENT]->(i:Investment)
    RETURN c.name as name,
           c.occupation as occupation,
           c.credit_score as credit_score,
           collect(DISTINCT a.account_type) as account_types,
           collect(DISTINCT l.loan_type) as loan_types,
           collect(DISTINCT i.investment_type) as investment_types
    `,
    { id: clientId }
  );

  if (!clientData?.[0]) return [];

  const { occupation, credit_score, account_types, loan_types, investment_types } = clientData[0];
  const searchText = `Client with ${occupation} occupation, credit score ${credit_score}, ` +
    `accounts: ${account_types.join(", ")}, loans: ${loan_types.join(", ")}, ` +
    `investments: ${investment_types.join(", ")}`;

  const queryEmbedding = await generateEmbedding(searchText);
  const similar = await searchSimilar({
    queryEmbedding,
    contentType: "client",
    limit: limit + 1,
    threshold: 0.4,
  });

  return similar.filter((c) => c.neo4j_id !== clientId);
}

/**
 * Find product options based on client needs
 */
async function findProductOptions(needsDescription, limit = 5) {
  const queryEmbedding = await generateEmbedding(needsDescription);

  // Search for relevant loans
  const similarLoans = await searchSimilar({
    queryEmbedding,
    contentType: "loan",
    limit: 3,
    threshold: 0.4,
  });

  // Search for relevant investments
  const similarInvestments = await searchSimilar({
    queryEmbedding,
    contentType: "investment",
    limit: 3,
    threshold: 0.4,
  });

  // Search for relevant accounts
  const similarAccounts = await searchSimilar({
    queryEmbedding,
    contentType: "account",
    limit: 3,
    threshold: 0.4,
  });

  return {
    loans: similarLoans.map((l) => ({
      id: l.neo4j_id,
      description: l.content_text,
      similarity: l.similarity,
      metadata: l.metadata,
    })),
    investments: similarInvestments.map((i) => ({
      id: i.neo4j_id,
      description: i.content_text,
      similarity: i.similarity,
      metadata: i.metadata,
    })),
    accounts: similarAccounts.map((a) => ({
      id: a.neo4j_id,
      description: a.content_text,
      similarity: a.similarity,
      metadata: a.metadata,
    })),
  };
}

module.exports = {
  semanticSearch,
  enrichWithGraphData,
  findSimilarClients,
  findProductOptions,
};
