// Vector Search - Semantic search combining Neo4j + Supabase pgvector
const { searchSimilar } = require("./supabase-driver");
const { generateEmbedding } = require("./embedding-service");
const { runQuery } = require("./neo4j-driver");

/**
 * Semantic search for similar banking content
 * @param {string} query - Natural language query
 * @param {string} contentType - Optional filter: 'account', 'transaction', 'loan', etc.
 * @param {number} limit - Max results
 * @returns {Array} Similar items with Neo4j enrichment
 */
async function semanticSearch(query, contentType = null, limit = 5) {
  console.log(`[Vector] Semantic search: "${query}" (type: ${contentType || "all"})`);

  // 1. Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // 2. Search Supabase pgvector for similar embeddings
  const vectorResults = await searchSimilar({
    queryEmbedding,
    contentType,
    limit,
    threshold: 0.3 // Lower threshold for broader results
  });

  if (vectorResults.length === 0) {
    console.log("[Vector] No similar items found");
    return [];
  }

  console.log(`[Vector] Found ${vectorResults.length} similar items`);

  // 3. Enrich results with Neo4j graph data
  const enrichedResults = await enrichWithGraphData(vectorResults);

  return enrichedResults;
}

/**
 * Enrich vector search results with Neo4j graph relationships
 */
async function enrichWithGraphData(vectorResults) {
  const enriched = [];

  for (const result of vectorResults) {
    const { neo4j_id, content_type, content_text, similarity, metadata } = result;

    let graphData = null;

    try {
      switch (content_type) {
        case "account":
          graphData = await runQuery(`
            MATCH (a:Account {account_id: $id})
            OPTIONAL MATCH (c:Client)-[:HAS_ACCOUNT]->(a)
            OPTIONAL MATCH (a)-[:MADE_TRANSACTION]->(t:Transaction)
            RETURN a as account,
                   c.name as owner,
                   collect(DISTINCT t.type) as transaction_types
          `, { id: neo4j_id });
          break;

        case "loan":
          graphData = await runQuery(`
            MATCH (l:Loan {loan_id: $id})
            OPTIONAL MATCH (c:Client)-[:HAS_LOAN]->(l)
            RETURN l as loan,
                   c.name as borrower
          `, { id: neo4j_id });
          break;

        case "investment":
          graphData = await runQuery(`
            MATCH (i:Investment {investment_id: $id})
            OPTIONAL MATCH (c:Client)-[:HAS_INVESTMENT]->(i)
            RETURN i as investment,
                   c.name as investor
          `, { id: neo4j_id });
          break;

        case "client":
          graphData = await runQuery(`
            MATCH (c:Client {client_id: $id})
            OPTIONAL MATCH (c)-[:HAS_ACCOUNT]->(a:Account)
            OPTIONAL MATCH (c)-[:HAS_LOAN]->(l:Loan)
            OPTIONAL MATCH (c)-[:HAS_INVESTMENT]->(i:Investment)
            RETURN c as client,
                   collect(DISTINCT a.type) as account_types,
                   collect(DISTINCT l.type) as loan_types,
                   collect(DISTINCT i.type) as investment_types
          `, { id: neo4j_id });
          break;

        default:
          // No enrichment for unknown types
          break;
      }
    } catch (error) {
      console.error(`[Vector] Error enriching ${content_type}:${neo4j_id}:`, error.message);
    }

    enriched.push({
      id: neo4j_id,
      type: content_type,
      text: content_text,
      similarity: parseFloat(similarity).toFixed(3),
      metadata,
      graph_data: graphData?.[0] || null
    });
  }

  return enriched;
}

/**
 * Find similar clients based on financial profile
 * Useful for product recommendations
 */
async function findSimilarClients(clientId, limit = 3) {
  // Get client's financial profile
  const clientData = await runQuery(`
    MATCH (c:Client {client_id: $id})
    OPTIONAL MATCH (c)-[:HAS_ACCOUNT]->(a:Account)
    OPTIONAL MATCH (c)-[:HAS_INVESTMENT]->(i:Investment)
    RETURN c.name as name,
           c.occupation as occupation,
           collect(DISTINCT a.type) as account_types,
           collect(DISTINCT i.type) as investment_types
  `, { id: clientId });

  if (!clientData?.[0]) {
    return [];
  }

  // Build search query from client profile
  const { occupation, account_types, investment_types } = clientData[0];
  const searchText = `Client ${occupation || ""} with ${account_types.join(", ")} accounts and ${investment_types.join(", ")} investments`;

  // Search for similar client profiles
  const queryEmbedding = await generateEmbedding(searchText);
  const similar = await searchSimilar({
    queryEmbedding,
    contentType: "client",
    limit: limit + 1, // +1 to exclude self
    threshold: 0.4
  });

  // Filter out the original client
  return similar.filter(c => c.neo4j_id !== clientId);
}

/**
 * Find products that might suit a client's needs
 */
async function findProductOptions(needsDescription, limit = 5) {
  const queryEmbedding = await generateEmbedding(needsDescription);

  // Search for relevant products
  const similarProducts = await searchSimilar({
    queryEmbedding,
    contentType: null, // Search all types
    limit,
    threshold: 0.4
  });

  return similarProducts;
}

module.exports = {
  semanticSearch,
  findSimilarClients,
  findProductOptions
};
