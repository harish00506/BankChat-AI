/**
 * Server Entry Point
 * Initializes database connections and starts the HTTP server
 * 
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                    APPLICATION ARCHITECTURE                       ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║                                                                   ║
 * ║  server.js (Entry Point)                                          ║
 * ║      │                                                            ║
 * ║      ├──► config/index.js (Environment Configuration)             ║
 * ║      │                                                            ║
 * ║      ├──► db/ (Database Layer)                                    ║
 * ║      │     ├── neo4j/driver.js (Graph Database)                   ║
 * ║      │     └── supabase/driver.js (Vector Database)               ║
 * ║      │                                                            ║
 * ║      └──► app.js (Express Application)                            ║
 * ║            │                                                      ║
 * ║            ├──► api/middleware/ (Request Processing)              ║
 * ║            │     ├── logger.middleware.js                         ║
 * ║            │     ├── validation.middleware.js                     ║
 * ║            │     └── error.middleware.js                          ║
 * ║            │                                                      ║
 * ║            └──► api/routes/ (Route Definitions)                   ║
 * ║                  ├── chat.routes.js    ──► controllers ──► services
 * ║                  ├── graph.routes.js   ──► controllers ──► services
 * ║                  ├── search.routes.js  ──► controllers ──► services
 * ║                  └── health.routes.js  ──► controllers            ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 * 
 * Services Layer:
 * ───────────────
 *   services/
 *   ├── chat.service.js       - Main chat orchestration (RAG pipeline)
 *   ├── llm.service.js        - Groq LLM integration
 *   ├── entity.service.js     - Entity extraction (client ID, query type)
 *   ├── embedding.service.js  - HuggingFace embeddings (optional)
 *   └── vector.service.js     - Vector search with Neo4j enrichment
 */

require("dotenv").config();

const app = require("./app");
const config = require("./config");
const db = require("./db");

// ─────────────────────────────────────────────────────────────
// Server Configuration
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────────────
// Startup Function
// ─────────────────────────────────────────────────────────────
async function startServer() {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                    BANK-CHAT SERVER STARTING                      ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
  console.log();

  try {
    // ───────────────────────────────────────────────────────────
    // 1. Connect to Neo4j
    // ───────────────────────────────────────────────────────────
    console.log("📊 Connecting to Neo4j...");
    await db.neo4j.verifyConnectivity();
    console.log("✅ Neo4j connected successfully");
    console.log();

    // ───────────────────────────────────────────────────────────
    // 2. Initialize Vector Store (if embeddings enabled)
    // ───────────────────────────────────────────────────────────
    if (config.features.EMBEDDINGS_ENABLED) {
      console.log("🔍 Embeddings ENABLED - Initializing vector store...");
      await db.supabase.initVectorTable();
      console.log("✅ Supabase/pgvector initialized");
    } else {
      console.log("⚠️  Embeddings DISABLED - Running in Neo4j-only mode");
    }
    console.log();

    // ───────────────────────────────────────────────────────────
    // 3. Start HTTP Server
    // ───────────────────────────────────────────────────────────
    app.listen(PORT, () => {
      console.log("╔═══════════════════════════════════════════════════════════════════╗");
      console.log("║                     🚀 SERVER RUNNING                             ║");
      console.log("╠═══════════════════════════════════════════════════════════════════╣");
      console.log(`║  URL:        http://localhost:${PORT}                              ║`);
      console.log(`║  Health:     http://localhost:${PORT}/api/health                   ║`);
      console.log("╠═══════════════════════════════════════════════════════════════════╣");
      console.log("║  ENDPOINTS:                                                       ║");
      console.log("║    POST /api/chat       - Chat with banking AI                    ║");
      console.log("║    POST /api/search     - Semantic search                         ║");
      console.log("║    POST /api/products   - Get product recommendations             ║");
      console.log("║    GET  /api/graph      - Get graph for visualization             ║");
      console.log("║    GET  /api/health     - Health check                            ║");
      console.log("╠═══════════════════════════════════════════════════════════════════╣");
      console.log("║  CONFIGURATION:                                                   ║");
      console.log(`║    LLM Model:    ${config.groq.MODEL.padEnd(35)}       ║`);
      console.log(`║    Embeddings:   ${(config.features.EMBEDDINGS_ENABLED ? "Enabled" : "Disabled").padEnd(35)}       ║`);
      if (config.features.EMBEDDINGS_ENABLED) {
        console.log(`║    Embed Model:  ${config.huggingface.MODEL.padEnd(35)}       ║`);
      }
      console.log("╚═══════════════════════════════════════════════════════════════════╝");
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await db.neo4j.closeDriver();
    console.log("✅ Neo4j connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 SIGTERM received, shutting down...");
  try {
    await db.neo4j.closeDriver();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});

// ─────────────────────────────────────────────────────────────
// Start the Server
// ─────────────────────────────────────────────────────────────
startServer();
