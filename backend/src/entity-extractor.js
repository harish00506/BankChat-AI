// Entity Extractor - Extract client ID and query type from natural language
// Rule-based extraction for POC

// Extract client ID (C001, C002, etc.)
function extractClientId(text) {
  const match = text.match(/C\d{3,}/i);
  return match ? match[0].toUpperCase() : null;
}

// Determine query type based on keywords
function determineQueryType(question) {
  const q = question.toLowerCase();

  if (q.includes("account") || q.includes("checking") || q.includes("savings") || q.includes("balance")) {
    return "accounts";
  }
  if (q.includes("transaction") || q.includes("transfer") || q.includes("deposit") || q.includes("withdrawal") || q.includes("payment")) {
    return "transactions";
  }
  if (q.includes("loan") || q.includes("mortgage") || q.includes("borrow") || q.includes("debt")) {
    return "loans";
  }
  if (q.includes("credit card") || q.includes("card") || q.includes("credit limit")) {
    return "credit_cards";
  }
  if (q.includes("invest") || q.includes("portfolio") || q.includes("stock") || q.includes("fund") || q.includes("bond")) {
    return "investments";
  }
  if (q.includes("profile") || q.includes("info") || q.includes("detail") || q.includes("who is")) {
    return "profile";
  }

  // Default: return full profile
  return "full";
}

// Extract account type if mentioned
function extractAccountType(text) {
  const accountTypes = [
    "checking", "savings", "money market", "ira", "cd",
    "business checking", "business savings"
  ];

  const q = text.toLowerCase();
  for (const type of accountTypes) {
    if (q.includes(type)) {
      return type;
    }
  }
  return null;
}

// Extract loan type if mentioned
function extractLoanType(text) {
  const loanTypes = [
    "mortgage", "auto loan", "personal loan", "business loan",
    "home equity", "student loan"
  ];

  const q = text.toLowerCase();
  for (const type of loanTypes) {
    if (q.includes(type)) {
      return type;
    }
  }
  return null;
}

// Extract investment type if mentioned
function extractInvestmentType(text) {
  const investmentTypes = [
    "mutual fund", "stock", "bond", "etf", "crypto",
    "index fund", "retirement"
  ];

  const q = text.toLowerCase();
  for (const type of investmentTypes) {
    if (q.includes(type)) {
      return type;
    }
  }
  return null;
}

module.exports = {
  extractClientId,
  determineQueryType,
  extractAccountType,
  extractLoanType,
  extractInvestmentType
};
