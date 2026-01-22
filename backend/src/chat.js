// Chat Handler - Hybrid RAG with Neo4j Graph DB + Supabase pgvector + Groq LLM
require("dotenv").config();
const { extractClientId, determineQueryType } = require("./entity-extractor");
const {
  getClientProfile,
  getClientAccounts,
  getClientTransactions,
  getClientLoans,
  getClientCreditCards,
  getClientInvestments,
  getFullClientProfile
} = require("./graph-queries");
const { callGroq } = require("./llm");

// Check if embeddings are enabled
const EMBEDDINGS_ENABLED = process.env.ENABLE_EMBEDDINGS?.toLowerCase() === "yes";

// Conditionally load vector search module
let semanticSearch, findSimilarClients, findProductOptions;
if (EMBEDDINGS_ENABLED) {
  const vectorSearch = require("./vector-search");
  semanticSearch = vectorSearch.semanticSearch;
  findSimilarClients = vectorSearch.findSimilarClients;
  findProductOptions = vectorSearch.findProductOptions;
  console.log("[Chat] Vector search ENABLED");
} else {
  console.log("[Chat] Vector search DISABLED (ENABLE_EMBEDDINGS=no)");
}

// Query type to function mapping
const queryHandlers = {
  profile: getClientProfile,
  accounts: getClientAccounts,
  transactions: getClientTransactions,
  loans: getClientLoans,
  credit_cards: getClientCreditCards,
  investments: getClientInvestments,
  full: getFullClientProfile
};

// Detect if query needs semantic search
function needsSemanticSearch(question) {
  const semanticKeywords = [
    "similar", "like", "related", "recommend", "suggest", "find",
    "search", "best rate", "options for", "products for", "services for",
    "clients with", "accounts like", "comparable", "alternative"
  ];
  const q = question.toLowerCase();
  return semanticKeywords.some(kw => q.includes(kw));
}

// Detect content type from question
function detectContentType(question) {
  const q = question.toLowerCase();
  if (q.includes("account") || q.includes("checking") || q.includes("savings")) return "account";
  if (q.includes("transaction") || q.includes("transfer") || q.includes("deposit") || q.includes("withdrawal")) return "transaction";
  if (q.includes("loan") || q.includes("mortgage") || q.includes("borrow")) return "loan";
  if (q.includes("credit card") || q.includes("card")) return "credit_card";
  if (q.includes("invest") || q.includes("stock") || q.includes("fund") || q.includes("portfolio")) return "investment";
  if (q.includes("client")) return "client";
  return null;
}

async function handleChat({ question, role, user_id, client_id }) {
  // 1. Validate input
  if (!question || !role || !user_id) {
    throw new Error("Missing required fields: question, role, user_id");
  }

  if (role !== "advisor" && role !== "client") {
    throw new Error("Invalid role. Must be 'advisor' or 'client'");
  }

  // 2. Check if this is a semantic/similarity search query (only if embeddings enabled)
  const useSemanticSearch = EMBEDDINGS_ENABLED && needsSemanticSearch(question);

  if (useSemanticSearch) {
    console.log("[Chat] Using hybrid search (Neo4j + Vector)");
    return await handleHybridSearch({ question, role, user_id, client_id });
  }

  // 3. Extract client ID from question or use provided client_id
  let targetClient = extractClientId(question) || client_id;

  // 4. Authorization check
  if (role === "client") {
    // Clients can only access their own data
    targetClient = user_id;
  } else if (role === "advisor" && !targetClient) {
    throw new Error("Advisor must specify or mention a client ID");
  }

  if (!targetClient) {
    throw new Error("Could not determine client ID. Please mention client ID (e.g., C001) in your question.");
  }

  // 5. Determine query type from question
  const queryType = determineQueryType(question);
  console.log(`[Chat] Client: ${targetClient}, Query Type: ${queryType}`);

  // 6. Query Neo4j graph database
  const queryHandler = queryHandlers[queryType] || getFullClientProfile;
  const graphData = await queryHandler(targetClient);

  // 7. Check if data was found
  if (!graphData || (Array.isArray(graphData) && graphData.length === 0)) {
    return {
      answer: `No ${queryType} data found for client ${targetClient}. Please verify the client ID.`,
      source: "neo4j",
      query_type: queryType,
      client_id: targetClient,
      data_found: false
    };
  }

  // 8. Build prompt for LLM
  const prompt = buildPrompt(question, queryType, targetClient, graphData, null);

  // 9. Call Groq LLM to generate natural language answer
  const answer = await callGroq(prompt);

  return {
    answer,
    source: "neo4j",
    query_type: queryType,
    client_id: targetClient,
    data_found: true,
    records_retrieved: Array.isArray(graphData) ? graphData.length : 1
  };
}

/**
 * Handle hybrid search queries that need both graph + vector search
 */
async function handleHybridSearch({ question, role, user_id, client_id }) {
  const contentType = detectContentType(question);
  let targetClient = extractClientId(question) || client_id;

  // Authorization for clients
  if (role === "client") {
    targetClient = user_id;
  }

  console.log(`[Hybrid] Content type: ${contentType || "all"}, Client context: ${targetClient || "none"}`);

  // Perform semantic search
  const vectorResults = await semanticSearch(question, contentType, 5);

  // Get client context if available
  let clientContext = null;
  if (targetClient) {
    try {
      clientContext = await getFullClientProfile(targetClient);
    } catch (e) {
      console.log("[Hybrid] No client context found");
    }
  }

  // Build hybrid prompt
  const prompt = buildHybridPrompt(question, vectorResults, clientContext);

  // Generate response
  const answer = await callGroq(prompt);

  return {
    answer,
    source: "hybrid",
    query_type: "semantic_search",
    client_id: targetClient,
    data_found: vectorResults.length > 0,
    records_retrieved: vectorResults.length,
    similar_items: vectorResults.map(r => ({
      type: r.type,
      text: r.text,
      similarity: r.similarity
    }))
  };
}

function buildPrompt(question, queryType, clientId, data, vectorData) {
  const dataStr = JSON.stringify(data, null, 2);

  return `
CLIENT DATA FROM BANKING GRAPH DATABASE:
==========================================
Client ID: ${clientId}
Query Type: ${queryType}

Data Retrieved:
${dataStr}
==========================================

USER QUESTION: ${question}

Based ONLY on the client data above, provide a clear and helpful answer. 
If specific information is not available in the data, state that clearly.
Format your response in a professional, easy-to-read manner.
`;
}

function buildHybridPrompt(question, vectorResults, clientContext) {
  let prompt = `You are a helpful banking assistant with access to a financial knowledge base.\n\n`;

  if (clientContext) {
    prompt += `CLIENT CONTEXT:\n${JSON.stringify(clientContext, null, 2)}\n\n`;
  }

  if (vectorResults && vectorResults.length > 0) {
    prompt += `RELEVANT BANKING INFORMATION FROM KNOWLEDGE BASE:\n`;
    vectorResults.forEach((result, i) => {
      prompt += `\n[${i + 1}] ${result.type}: ${result.text} (relevance: ${(result.similarity * 100).toFixed(1)}%)\n`;
    });
    prompt += `\n`;
  }

  prompt += `USER QUESTION: ${question}\n\n`;
  prompt += `Provide a helpful, accurate answer based on the banking information above. 
If recommending products or services, explain why they might be suitable.`;

  return prompt;
}

module.exports = { handleChat };
