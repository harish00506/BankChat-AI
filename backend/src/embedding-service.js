// Embedding Service - Using Official HuggingFace Inference SDK
// Uses sentence-transformers model for banking text embeddings
const { HfInference } = require("@huggingface/inference");
require("dotenv").config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(HF_API_KEY);

// Simple in-memory cache to reduce API calls
const embeddingCache = new Map();
const CACHE_MAX_SIZE = 1000;

/**
 * Generate embedding for text using HuggingFace official SDK
 * Model: all-MiniLM-L6-v2 (384 dimensions)
 * Free tier: ~30,000 inference calls/month
 */
async function generateEmbedding(text) {
  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    // Use official HuggingFace SDK for feature extraction
    const result = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    // Result is already the embedding array
    let embedding = result;

    // If result is nested array, flatten it
    if (Array.isArray(result) && Array.isArray(result[0])) {
      embedding = result[0];
    }

    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(`Invalid embedding response`);
    }

    // Add to cache (with size limit)
    if (embeddingCache.size >= CACHE_MAX_SIZE) {
      // Remove oldest entry
      const firstKey = embeddingCache.keys().next().value;
      embeddingCache.delete(firstKey);
    }
    embeddingCache.set(cacheKey, embedding);

    return embedding;
  } catch (error) {
    console.error("❌ Embedding error:", error.message);

    // Retry once after short delay
    if (!error.retried) {
      console.log("⏳ Retrying embedding in 2s...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      error.retried = true;
      return generateEmbedding(text);
    }

    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * Handles rate limiting with delays
 */
async function generateEmbeddingsBatch(texts, delayMs = 200) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    console.log(`  Embedding ${i + 1}/${texts.length}: "${text.substring(0, 50)}..."`);

    const embedding = await generateEmbedding(text);
    embeddings.push({ text, embedding });

    // Rate limiting delay (except for last item)
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return embeddings;
}

/**
 * Build searchable text from banking entity
 * Combines relevant fields for better semantic search
 */
function buildSearchableText(entityType, data) {
  switch (entityType) {
    case "account":
      return `${data.type} account. Balance: ${data.balance || "unknown"}. Interest Rate: ${data.interest_rate || "unknown"}%`.trim();

    case "transaction":
      return `${data.type} transaction. Amount: ${data.amount}. Description: ${data.description || ""}`.trim();

    case "loan":
      return `${data.type} loan. Amount: ${data.amount}. Interest Rate: ${data.interest_rate}%. Term: ${data.term_months} months`.trim();

    case "credit_card":
      return `${data.type} credit card. Limit: ${data.credit_limit}. APR: ${data.apr}%. Rewards Rate: ${data.rewards_rate}%`.trim();

    case "client":
      return `Client ${data.name}. Occupation: ${data.occupation || "unknown"}. Member Since: ${data.member_since || "unknown"}`.trim();

    case "investment":
      return `${data.type} investment. Value: ${data.value}. Return Rate: ${data.return_rate}%. Risk Level: ${data.risk_level || "unknown"}`.trim();

    default:
      return JSON.stringify(data);
  }
}

/**
 * Clear embedding cache
 */
function clearCache() {
  embeddingCache.clear();
  console.log("🗑️ Embedding cache cleared");
}

/**
 * Get cache stats
 */
function getCacheStats() {
  return {
    size: embeddingCache.size,
    maxSize: CACHE_MAX_SIZE
  };
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  buildSearchableText,
  clearCache,
  getCacheStats
};
