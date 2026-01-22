// Express Server - Banking Chat API with Neo4j + Supabase Vector Search
require("dotenv").config({ path: __dirname + "/../.env" });

const express = require("express");
const cors = require("cors");
const { handleChat } = require("./chat");
const { closeDriver, runQuery } = require("./neo4j-driver");

// Check if embeddings are enabled
const EMBEDDINGS_ENABLED = process.env.ENABLE_EMBEDDINGS?.toLowerCase() === "yes";

// Conditionally load vector modules
let initVectorTable, closePool, semanticSearch, findProductOptions, getCacheStats;
if (EMBEDDINGS_ENABLED) {
  const supabaseDriver = require("./supabase-driver");
  const vectorSearch = require("./vector-search");
  const embeddingService = require("./embedding-service");
  initVectorTable = supabaseDriver.initVectorTable;
  closePool = supabaseDriver.closePool;
  semanticSearch = vectorSearch.semanticSearch;
  findProductOptions = vectorSearch.findProductOptions;
  getCacheStats = embeddingService.getCacheStats;
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize vector table on startup (only if embeddings enabled)
async function initializeServices() {
  if (!EMBEDDINGS_ENABLED) {
    console.log("⚠️ Embeddings DISABLED (ENABLE_EMBEDDINGS=no)");
    return;
  }

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_URL) {
      console.log("🔄 Initializing Supabase vector table...");
      await initVectorTable();
      console.log("✅ Vector search ready");
    } else {
      console.log("⚠️ Supabase not configured - vector search disabled");
    }
  } catch (error) {
    console.error("⚠️ Vector init warning:", error.message);
    console.log("   Continuing without vector search...");
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    llm_provider: "groq",
    database: "neo4j",
    embeddings_enabled: EMBEDDINGS_ENABLED,
    vector_db: EMBEDDINGS_ENABLED && process.env.SUPABASE_URL ? "supabase" : "disabled",
    embedding_cache: EMBEDDINGS_ENABLED && getCacheStats ? getCacheStats() : null
  });
});

// Main chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { question, role, user_id, client_id } = req.body;

    console.log(`[API] Question: "${question}", Role: ${role}, User: ${user_id}`);

    const result = await handleChat({
      question,
      role,
      user_id,
      client_id
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("[API Error]", error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Semantic search endpoint (direct vector search)
app.post("/search", async (req, res) => {
  // Check if embeddings are enabled
  if (!EMBEDDINGS_ENABLED) {
    return res.status(400).json({
      success: false,
      error: "Vector search is disabled. Set ENABLE_EMBEDDINGS=yes in .env to enable."
    });
  }

  try {
    const { query, type, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required"
      });
    }

    console.log(`[API] Search: "${query}", Type: ${type || "all"}`);

    const results = await semanticSearch(query, type, limit);

    res.json({
      success: true,
      query,
      type: type || "all",
      results
    });
  } catch (error) {
    console.error("[API Error]", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Product recommendations endpoint
app.post("/search/products", async (req, res) => {
  if (!EMBEDDINGS_ENABLED) {
    return res.status(400).json({
      success: false,
      error: "Vector search is disabled. Set ENABLE_EMBEDDINGS=yes in .env to enable."
    });
  }

  try {
    const { needs, limit = 5 } = req.body;

    if (!needs) {
      return res.status(400).json({
        success: false,
        error: "Client needs description is required"
      });
    }

    console.log(`[API] Product search for: "${needs}"`);

    const products = await findProductOptions(needs, limit);

    res.json({
      success: true,
      needs,
      recommendations: products
    });
  } catch (error) {
    console.error("[API Error]", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Graph data endpoint for visualization
app.get("/graph", async (req, res) => {
  try {
    console.log("[API] Fetching graph data...");

    // Get all nodes and relationships
    const result = await runQuery(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT 500
    `);

    // Transform for visualization
    const nodesMap = new Map();
    const links = [];

    result.forEach(record => {
      // Add source node
      if (record.n) {
        const id = record.n.elementId || record.n.identity?.toString();
        if (!nodesMap.has(id)) {
          const labels = record.n.labels || [];
          const props = record.n.properties || record.n;
          nodesMap.set(id, {
            id,
            label: labels[0] || "Unknown",
            name: props.name || props.client_id || props.account_id || id.slice(-6),
            properties: props
          });
        }
      }

      // Add target node
      if (record.m) {
        const id = record.m.elementId || record.m.identity?.toString();
        if (!nodesMap.has(id)) {
          const labels = record.m.labels || [];
          const props = record.m.properties || record.m;
          nodesMap.set(id, {
            id,
            label: labels[0] || "Unknown",
            name: props.name || props.client_id || props.account_id || id.slice(-6),
            properties: props
          });
        }
      }

      // Add relationship
      if (record.r && record.n && record.m) {
        links.push({
          source: record.n.elementId || record.n.identity?.toString(),
          target: record.m.elementId || record.m.identity?.toString(),
          type: record.r.type
        });
      }
    });

    const nodes = Array.from(nodesMap.values());

    console.log(`[API] Graph: ${nodes.length} nodes, ${links.length} edges`);

    res.json({
      success: true,
      graph: { nodes, links },
      stats: {
        totalNodes: nodes.length,
        totalEdges: links.length
      }
    });
  } catch (error) {
    console.error("[API Error]", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Graceful shutdown
async function shutdown() {
  console.log("\n🛑 Shutting down...");
  await closeDriver();
  if (EMBEDDINGS_ENABLED && closePool) {
    await closePool();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           BANK-CHAT API SERVER (HYBRID)                  ║
║                                                          ║
║   🌐 Port: ${PORT}                                          ║
║   💾 Graph DB: Neo4j                                     ║
║   🔍 Vector DB: ${EMBEDDINGS_ENABLED ? "Supabase pgvector" : "Disabled"}                     ║
║   🤖 LLM: Groq                                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
});
