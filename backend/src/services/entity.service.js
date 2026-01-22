/**
 * Entity Service
 * Extract entities (client IDs, query types, etc.) from natural language
 */

/**
 * Extract client ID (C001, C002, etc.)
 */
function extractClientId(text) {
  const match = text.match(/C\d{3,}/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Determine query type from question keywords
 */
function determineQueryType(question) {
  const q = question.toLowerCase();

  const typeMap = [
    { keywords: ["account", "checking", "savings", "balance", "deposit"], type: "accounts" },
    { keywords: ["transaction", "transfer", "payment", "withdrawal", "purchase"], type: "transactions" },
    { keywords: ["loan", "mortgage", "borrow", "lending", "principal"], type: "loans" },
    { keywords: ["credit card", "card", "credit limit", "apr"], type: "credit_cards" },
    { keywords: ["investment", "portfolio", "stock", "bond", "mutual fund", "etf"], type: "investments" },
    { keywords: ["history", "past", "previous", "recent"], type: "history" },
    { keywords: ["profile", "info", "detail", "who is", "client"], type: "profile" },
  ];

  for (const { keywords, type } of typeMap) {
    if (keywords.some((kw) => q.includes(kw))) {
      return type;
    }
  }

  return "full";
}

/**
 * Check if query needs semantic/vector search
 */
function needsSemanticSearch(question) {
  const semanticKeywords = [
    "similar", "like", "related", "recommend", "suggest", "find",
    "search", "best", "suitable", "compare", "alternative",
    "clients with", "accounts like", "comparable", "options",
  ];
  const q = question.toLowerCase();
  return semanticKeywords.some((kw) => q.includes(kw));
}

/**
 * Detect content type for vector search
 */
function detectContentType(question) {
  const q = question.toLowerCase();
  const types = {
    account: ["account", "checking", "savings"],
    loan: ["loan", "mortgage", "lending"],
    investment: ["investment", "stock", "bond", "portfolio"],
    client: ["client", "customer"],
    transaction: ["transaction", "transfer", "payment"],
  };

  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some((kw) => q.includes(kw))) {
      return type;
    }
  }
  return null;
}

/**
 * Extract account type from text
 */
function extractAccountType(text) {
  const accountTypes = [
    "checking", "savings", "money market", "ira", "certificate of deposit",
    "business checking", "business savings", "retirement",
  ];
  const q = text.toLowerCase();
  return accountTypes.find((t) => q.includes(t)) || null;
}

/**
 * Extract loan type from text
 */
function extractLoanType(text) {
  const loanTypes = [
    "mortgage", "auto loan", "personal loan", "business loan",
    "home equity", "student loan", "credit line",
  ];
  const q = text.toLowerCase();
  return loanTypes.find((t) => q.includes(t)) || null;
}

module.exports = {
  extractClientId,
  determineQueryType,
  needsSemanticSearch,
  detectContentType,
  extractAccountType,
  extractLoanType,
};
