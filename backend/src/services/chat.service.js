/**
 * Chat Service
 * Core business logic for RAG-based banking chat
 */
const config = require("../config");
const {
  extractClientId,
  determineQueryType,
  needsSemanticSearch,
  detectContentType,
} = require("./entity.service");
const {
  getClientProfile,
  getClientAccounts,
  getClientTransactions,
  getClientLoans,
  getClientCreditCards,
  getClientInvestments,
  getClientHistory,
  getFullClientProfile,
} = require("../db/neo4j");
const { callGroq } = require("./llm.service");

// Conditionally load vector services
let vectorService = null;
if (config.features.EMBEDDINGS_ENABLED) {
  vectorService = require("./vector.service");
  console.log("[Chat] Vector search ENABLED");
} else {
  console.log("[Chat] Vector search DISABLED");
}

// Query handlers mapping
const queryHandlers = {
  profile: getClientProfile,
  accounts: getClientAccounts,
  transactions: getClientTransactions,
  loans: getClientLoans,
  credit_cards: getClientCreditCards,
  investments: getClientInvestments,
  history: getClientHistory,
  full: getFullClientProfile,
};

/**
 * Main chat handler
 */
async function handleChat({ question, role, user_id, client_id }) {
  // Validate input
  if (!question || !role || !user_id) {
    throw new Error("Missing required fields: question, role, user_id");
  }

  if (role !== "advisor" && role !== "client") {
    throw new Error("Invalid role. Must be 'advisor' or 'client'");
  }

  // Check for semantic search (if enabled)
  const useSemanticSearch = config.features.EMBEDDINGS_ENABLED && needsSemanticSearch(question);

  if (useSemanticSearch) {
    console.log("[Chat] Using hybrid search (Neo4j + Vector)");
    return handleHybridSearch({ question, role, user_id, client_id });
  }

  // Extract client ID
  let targetClient = extractClientId(question) || client_id;

  // Authorization check
  if (role === "client") {
    targetClient = user_id;
  } else if (role === "advisor" && !targetClient) {
    throw new Error("Advisor must specify or mention a client ID");
  }

  if (!targetClient) {
    throw new Error("Could not determine client ID. Please mention client ID (e.g., C001)");
  }

  // Determine query type
  const queryType = determineQueryType(question);
  console.log(`[Chat] Client: ${targetClient}, Query: ${queryType}`);

  // Query Neo4j
  const queryHandler = queryHandlers[queryType] || getFullClientProfile;
  const graphData = await queryHandler(targetClient);

  // Check results
  if (!graphData || (Array.isArray(graphData) && graphData.length === 0)) {
    return {
      answer: `No ${queryType} data found for client ${targetClient}. Please verify the client ID.`,
      source: "neo4j",
      query_type: queryType,
      client_id: targetClient,
      data_found: false,
    };
  }

  // Build prompt and call LLM
  const prompt = buildPrompt(question, queryType, targetClient, graphData);
  const answer = await callGroq(prompt);

  return {
    answer,
    source: "neo4j",
    query_type: queryType,
    client_id: targetClient,
    data_found: true,
    records_retrieved: Array.isArray(graphData) ? graphData.length : 1,
  };
}

/**
 * Handle hybrid search (graph + vector)
 */
async function handleHybridSearch({ question, role, user_id, client_id }) {
  const contentType = detectContentType(question);
  let targetClient = extractClientId(question) || client_id;

  if (role === "client") {
    targetClient = user_id;
  }

  console.log(`[Hybrid] Content: ${contentType || "all"}, Client: ${targetClient || "none"}`);

  // Vector search
  const vectorResults = await vectorService.semanticSearch(question, contentType, 5);

  // Client context
  let clientContext = null;
  if (targetClient) {
    try {
      clientContext = await getFullClientProfile(targetClient);
    } catch (e) {
      console.log("[Hybrid] No client context");
    }
  }

  // Generate response
  const prompt = buildHybridPrompt(question, vectorResults, clientContext);
  const answer = await callGroq(prompt);

  return {
    answer,
    source: "hybrid",
    query_type: "semantic_search",
    client_id: targetClient,
    data_found: vectorResults.length > 0,
    records_retrieved: vectorResults.length,
    similar_items: vectorResults.map((r) => ({
      type: r.type,
      text: r.text,
      similarity: r.similarity,
    })),
  };
}

/**
 * Build prompt for standard queries
 */
function buildPrompt(question, queryType, clientId, data) {
  return `
CLIENT DATA FROM BANKING GRAPH DATABASE:
==========================================
Client ID: ${clientId}
Query Type: ${queryType}

Data Retrieved:
${JSON.stringify(data, null, 2)}
==========================================

USER QUESTION: ${question}

Based ONLY on the client data above, provide a clear and helpful answer. 
If specific information is not available in the data, state that clearly.
Format your response in a professional, easy-to-read manner.
Include relevant financial details and amounts where applicable.
`;
}

/**
 * Build prompt for hybrid search
 */
function buildHybridPrompt(question, vectorResults, clientContext) {
  const vectorStr = vectorResults
    .map(
      (r) =>
        `- [${r.type}] ${r.text} (similarity: ${r.similarity})${r.graph_data ? "\n  Graph Data: " + JSON.stringify(r.graph_data) : ""
        }`
    )
    .join("\n");

  const clientStr = clientContext
    ? JSON.stringify(clientContext, null, 2)
    : "No specific client context";

  return `
BANKING KNOWLEDGE BASE - HYBRID SEARCH RESULTS:
================================================
VECTOR SIMILARITY SEARCH RESULTS (from Supabase pgvector):
${vectorStr || "No similar items found"}

CLIENT CONTEXT (from Neo4j Graph DB):
${clientStr}
================================================

USER QUESTION: ${question}

Based on the search results and client context above:
1. Analyze the semantically similar banking information found
2. Consider the client's current accounts and financial status if available
3. Provide a comprehensive, data-driven response

Be specific about which information comes from the search results vs client records.
Format your response professionally for banking staff.
Include relevant financial figures and account details where applicable.
`;
}

module.exports = {
  handleChat,
  handleHybridSearch,
  buildPrompt,
  buildHybridPrompt,
};
