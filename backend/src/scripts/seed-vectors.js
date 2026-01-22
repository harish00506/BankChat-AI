/**
 * Seed Vectors - Populate Supabase with embeddings from Neo4j data
 * 
 * Run: npm run seed:vectors
 * 
 * Note: Requires ENABLE_EMBEDDINGS=true in .env
 */
require("dotenv").config({ path: __dirname + "/../../.env" });

const config = require("../config");
const { runQuery, closeDriver } = require("../db/neo4j");
const { initVectorTable, upsertEmbedding, clearAllEmbeddings, closePool } = require("../db/supabase");
const { generateEmbedding, buildSearchableText } = require("../services/embedding.service");

async function seedVectors() {
  // Check if embeddings are enabled
  if (!config.features.EMBEDDINGS_ENABLED) {
    console.error("❌ Embeddings are disabled. Set ENABLE_EMBEDDINGS=true in .env to use vector seeding.");
    process.exit(1);
  }

  console.log("\n🚀 Starting vector seeding process...\n");

  try {
    // 1. Initialize vector table
    console.log("📦 Initializing vector table in Supabase...");
    await initVectorTable();

    // 2. Clear existing embeddings
    console.log("🗑️ Clearing existing embeddings...");
    try {
      await clearAllEmbeddings();
    } catch (e) {
      console.log("  (No existing data to clear)");
    }

    // 3. Fetch all entities from Neo4j
    console.log("\n📊 Fetching entities from Neo4j...\n");

    // Accounts
    console.log("🏦 Processing accounts...");
    const accounts = await runQuery("MATCH (a:Account) RETURN a");
    for (const record of accounts) {
      const account = record.a.properties;
      const text = buildSearchableText("account", account);
      console.log(`  → ${account.account_number || account.account_id}`);

      const embedding = await generateEmbedding(text);
      await upsertEmbedding({
        neo4jId: account.account_id,
        contentType: "account",
        contentText: text,
        embedding,
        metadata: { account_type: account.account_type, balance: account.balance }
      });

      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✅ ${accounts.length} accounts embedded\n`);

    // Transactions
    console.log("💳 Processing transactions...");
    const transactions = await runQuery("MATCH (t:Transaction) RETURN t");
    for (const record of transactions) {
      const transaction = record.t.properties;
      const text = buildSearchableText("transaction", transaction);
      console.log(`  → ${transaction.transaction_id}`);

      const embedding = await generateEmbedding(text);
      await upsertEmbedding({
        neo4jId: transaction.transaction_id,
        contentType: "transaction",
        contentText: text,
        embedding,
        metadata: { type: transaction.type, amount: transaction.amount }
      });

      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✅ ${transactions.length} transactions embedded\n`);

    // Loans
    console.log("📋 Processing loans...");
    const loans = await runQuery("MATCH (l:Loan) RETURN l");
    for (const record of loans) {
      const loan = record.l.properties;
      const text = buildSearchableText("loan", loan);
      console.log(`  → ${loan.loan_id}`);

      const embedding = await generateEmbedding(text);
      await upsertEmbedding({
        neo4jId: loan.loan_id,
        contentType: "loan",
        contentText: text,
        embedding,
        metadata: { loan_type: loan.loan_type, amount: loan.amount }
      });

      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✅ ${loans.length} loans embedded\n`);

    // Credit Cards
    console.log("💳 Processing credit cards...");
    const creditCards = await runQuery("MATCH (cc:CreditCard) RETURN cc");
    for (const record of creditCards) {
      const card = record.cc.properties;
      const text = buildSearchableText("credit_card", card);
      console.log(`  → ${card.card_id || card.card_number}`);

      const embedding = await generateEmbedding(text);
      await upsertEmbedding({
        neo4jId: card.card_id,
        contentType: "credit_card",
        contentText: text,
        embedding,
        metadata: { card_type: card.card_type, credit_limit: card.credit_limit }
      });

      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✅ ${creditCards.length} credit cards embedded\n`);

    // Investments
    console.log("📈 Processing investments...");
    const investments = await runQuery("MATCH (i:Investment) RETURN i");
    for (const record of investments) {
      const investment = record.i.properties;
      const text = buildSearchableText("investment", investment);
      console.log(`  → ${investment.investment_id}`);

      const embedding = await generateEmbedding(text);
      await upsertEmbedding({
        neo4jId: investment.investment_id,
        contentType: "investment",
        contentText: text,
        embedding,
        metadata: { investment_type: investment.investment_type, value: investment.value }
      });

      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✅ ${investments.length} investments embedded\n`);

    // Clients (basic profile for similarity search)
    console.log("👤 Processing clients...");
    const clients = await runQuery(`
      MATCH (c:Client)
      OPTIONAL MATCH (c)-[:HAS_ACCOUNT]->(a:Account)
      OPTIONAL MATCH (c)-[:HAS_LOAN]->(l:Loan)
      OPTIONAL MATCH (c)-[:HAS_INVESTMENT]->(i:Investment)
      RETURN c, 
             collect(DISTINCT a.account_type) as account_types,
             collect(DISTINCT l.loan_type) as loan_types,
             collect(DISTINCT i.investment_type) as investment_types
    `);
    for (const record of clients) {
      const client = record.c.properties;
      const accountTypes = record.account_types.filter(Boolean);
      const loanTypes = record.loan_types.filter(Boolean);
      const investmentTypes = record.investment_types.filter(Boolean);

      // Build comprehensive client text for embedding
      const text = `Client ${client.name}. Age: ${client.age || 'N/A'}. ` +
        `Occupation: ${client.occupation || 'N/A'}. ` +
        `Credit Score: ${client.credit_score || 'N/A'}. ` +
        `Account Types: ${accountTypes.length > 0 ? accountTypes.join(", ") : "None"}. ` +
        `Loan Types: ${loanTypes.length > 0 ? loanTypes.join(", ") : "None"}. ` +
        `Investment Types: ${investmentTypes.length > 0 ? investmentTypes.join(", ") : "None"}.`;

      console.log(`  → ${client.name}`);

      const embedding = await generateEmbedding(text);
      await upsertEmbedding({
        neo4jId: client.client_id,
        contentType: "client",
        contentText: text,
        embedding,
        metadata: {
          name: client.name,
          occupation: client.occupation,
          credit_score: client.credit_score,
          account_types: accountTypes,
          loan_types: loanTypes,
          investment_types: investmentTypes
        }
      });

      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✅ ${clients.length} clients embedded\n`);

    console.log(`
╔════════════════════════════════════════════════╗
║         VECTOR SEEDING COMPLETE!               ║
╠════════════════════════════════════════════════╣
║  Accounts:     ${accounts.length.toString().padEnd(30)}║
║  Transactions: ${transactions.length.toString().padEnd(30)}║
║  Loans:        ${loans.length.toString().padEnd(30)}║
║  Credit Cards: ${creditCards.length.toString().padEnd(30)}║
║  Investments:  ${investments.length.toString().padEnd(30)}║
║  Clients:      ${clients.length.toString().padEnd(30)}║
║                                                ║
║  Total embeddings: ${(accounts.length + transactions.length + loans.length + creditCards.length + investments.length + clients.length).toString().padEnd(26)}║
╚════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error("❌ Vector seeding error:", error.message);
    throw error;
  } finally {
    await closeDriver();
    await closePool();
  }
}

// Run if executed directly
if (require.main === module) {
  seedVectors();
}

module.exports = { seedVectors };
