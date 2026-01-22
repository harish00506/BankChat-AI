/**
 * Seed Neo4j Database with Banking Data
 * Includes Advisors, Clients (5 per advisor), and relationships
 * 
 * Run: npm run seed:neo4j
 */
require("dotenv").config({ path: __dirname + "/../../.env" });

const { getDriver, closeDriver } = require("../db/neo4j");

async function seedDatabase() {
    const driver = getDriver();
    const session = driver.session();

    console.log("🔄 Clearing existing data...");

    try {
        // Clear existing data
        await session.run("MATCH (n) DETACH DELETE n");

        console.log("📊 Creating constraints and indexes...");

        // Create constraints (unique IDs)
        await session.run("CREATE CONSTRAINT advisor_id IF NOT EXISTS FOR (a:Advisor) REQUIRE a.advisor_id IS UNIQUE");
        await session.run("CREATE CONSTRAINT client_id IF NOT EXISTS FOR (c:Client) REQUIRE c.client_id IS UNIQUE");
        await session.run("CREATE CONSTRAINT account_id IF NOT EXISTS FOR (a:Account) REQUIRE a.account_id IS UNIQUE");
        await session.run("CREATE CONSTRAINT transaction_id IF NOT EXISTS FOR (t:Transaction) REQUIRE t.transaction_id IS UNIQUE");
        await session.run("CREATE CONSTRAINT loan_id IF NOT EXISTS FOR (l:Loan) REQUIRE l.loan_id IS UNIQUE");

        console.log("💼 Creating advisors...");

        // Create Advisors (3 advisors)
        await session.run(`
      CREATE (a1:Advisor {
        advisor_id: "A001",
        name: "Sarah Chen",
        specialty: "Wealth Management",
        phone: "555-1001",
        email: "sarah.chen@bank.com",
        license_number: "FA-12345"
      })
      CREATE (a2:Advisor {
        advisor_id: "A002",
        name: "Michael Roberts",
        specialty: "Investment Banking",
        phone: "555-1002",
        email: "michael.roberts@bank.com",
        license_number: "FA-23456"
      })
      CREATE (a3:Advisor {
        advisor_id: "A003",
        name: "Emily Watson",
        specialty: "Retail Banking",
        phone: "555-1003",
        email: "emily.watson@bank.com",
        license_number: "FA-34567"
      })
    `);

        console.log("👤 Creating clients...");

        // Create Clients - 5 clients per advisor (15 total)
        // Sarah Chen's clients (C001-C005)
        await session.run(`
      CREATE (c1:Client {
        client_id: "C001",
        name: "John Doe",
        age: 45,
        occupation: "Software Engineer",
        account_type: "Premium",
        phone: "555-0101",
        email: "john.doe@email.com",
        member_since: "2021",
        status: "Active"
      })
      CREATE (c2:Client {
        client_id: "C002",
        name: "Jane Smith",
        age: 38,
        occupation: "Marketing Director",
        account_type: "Gold",
        phone: "555-0102",
        email: "jane.smith@email.com",
        member_since: "2022",
        status: "Active"
      })
      CREATE (c3:Client {
        client_id: "C003",
        name: "Robert Johnson",
        age: 62,
        occupation: "Retired Executive",
        account_type: "Platinum",
        phone: "555-0103",
        email: "robert.j@email.com",
        member_since: "2019",
        status: "Active"
      })
      CREATE (c4:Client {
        client_id: "C004",
        name: "Lisa Anderson",
        age: 29,
        occupation: "Entrepreneur",
        account_type: "Business",
        phone: "555-0104",
        email: "lisa.a@email.com",
        member_since: "2023",
        status: "Active"
      })
      CREATE (c5:Client {
        client_id: "C005",
        name: "David Wilson",
        age: 55,
        occupation: "Real Estate Agent",
        account_type: "Premium",
        phone: "555-0105",
        email: "david.w@email.com",
        member_since: "2020",
        status: "Active"
      })
    `);

        // Michael Roberts' clients (C006-C010)
        await session.run(`
      CREATE (c6:Client {
        client_id: "C006",
        name: "Emma Thompson",
        age: 67,
        occupation: "Retired Teacher",
        account_type: "Senior",
        phone: "555-0106",
        email: "emma.t@email.com",
        member_since: "2018",
        status: "Active"
      })
      CREATE (c7:Client {
        client_id: "C007",
        name: "James Martinez",
        age: 52,
        occupation: "Business Owner",
        account_type: "Business Premium",
        phone: "555-0107",
        email: "james.m@email.com",
        member_since: "2019",
        status: "Active"
      })
      CREATE (c8:Client {
        client_id: "C008",
        name: "Maria Garcia",
        age: 44,
        occupation: "Doctor",
        account_type: "Professional",
        phone: "555-0108",
        email: "maria.g@email.com",
        member_since: "2021",
        status: "Active"
      })
      CREATE (c9:Client {
        client_id: "C009",
        name: "William Brown",
        age: 71,
        occupation: "Retired Banker",
        account_type: "Platinum",
        phone: "555-0109",
        email: "william.b@email.com",
        member_since: "2015",
        status: "Active"
      })
      CREATE (c10:Client {
        client_id: "C010",
        name: "Jennifer Davis",
        age: 48,
        occupation: "Attorney",
        account_type: "Professional",
        phone: "555-0110",
        email: "jennifer.d@email.com",
        member_since: "2020",
        status: "Active"
      })
    `);

        // Emily Watson's clients (C011-C015)
        await session.run(`
      CREATE (c11:Client {
        client_id: "C011",
        name: "Christopher Lee",
        age: 35,
        occupation: "Consultant",
        account_type: "Gold",
        phone: "555-0111",
        email: "chris.l@email.com",
        member_since: "2022",
        status: "Active"
      })
      CREATE (c12:Client {
        client_id: "C012",
        name: "Amanda White",
        age: 41,
        occupation: "Architect",
        account_type: "Premium",
        phone: "555-0112",
        email: "amanda.w@email.com",
        member_since: "2021",
        status: "Active"
      })
      CREATE (c13:Client {
        client_id: "C013",
        name: "Daniel Harris",
        age: 58,
        occupation: "CFO",
        account_type: "Corporate",
        phone: "555-0113",
        email: "daniel.h@email.com",
        member_since: "2019",
        status: "Active"
      })
      CREATE (c14:Client {
        client_id: "C014",
        name: "Sophia Clark",
        age: 33,
        occupation: "Data Scientist",
        account_type: "Digital Premium",
        phone: "555-0114",
        email: "sophia.c@email.com",
        member_since: "2023",
        status: "Active"
      })
      CREATE (c15:Client {
        client_id: "C015",
        name: "Andrew Taylor",
        age: 49,
        occupation: "Surgeon",
        account_type: "Professional",
        phone: "555-0115",
        email: "andrew.t@email.com",
        member_since: "2020",
        status: "Active"
      })
    `);

        console.log("🔗 Creating advisor-client relationships...");

        // Create MANAGES relationships between advisors and clients
        await session.run(`
      MATCH (a:Advisor {advisor_id: "A001"})
      MATCH (c1:Client {client_id: "C001"})
      MATCH (c2:Client {client_id: "C002"})
      MATCH (c3:Client {client_id: "C003"})
      MATCH (c4:Client {client_id: "C004"})
      MATCH (c5:Client {client_id: "C005"})
      CREATE (a)-[:MANAGES {since: "2023-01-15", primary: true}]->(c1)
      CREATE (a)-[:MANAGES {since: "2023-03-20", primary: true}]->(c2)
      CREATE (a)-[:MANAGES {since: "2022-11-10", primary: true}]->(c3)
      CREATE (a)-[:MANAGES {since: "2024-02-01", primary: true}]->(c4)
      CREATE (a)-[:MANAGES {since: "2023-08-15", primary: true}]->(c5)
    `);

        await session.run(`
      MATCH (a:Advisor {advisor_id: "A002"})
      MATCH (c6:Client {client_id: "C006"})
      MATCH (c7:Client {client_id: "C007"})
      MATCH (c8:Client {client_id: "C008"})
      MATCH (c9:Client {client_id: "C009"})
      MATCH (c10:Client {client_id: "C010"})
      CREATE (a)-[:MANAGES {since: "2023-05-10", primary: true}]->(c6)
      CREATE (a)-[:MANAGES {since: "2022-09-25", primary: true}]->(c7)
      CREATE (a)-[:MANAGES {since: "2024-01-05", primary: true}]->(c8)
      CREATE (a)-[:MANAGES {since: "2023-07-18", primary: true}]->(c9)
      CREATE (a)-[:MANAGES {since: "2023-12-01", primary: true}]->(c10)
    `);

        await session.run(`
      MATCH (a:Advisor {advisor_id: "A003"})
      MATCH (c11:Client {client_id: "C011"})
      MATCH (c12:Client {client_id: "C012"})
      MATCH (c13:Client {client_id: "C013"})
      MATCH (c14:Client {client_id: "C014"})
      MATCH (c15:Client {client_id: "C015"})
      CREATE (a)-[:MANAGES {since: "2023-04-22", primary: true}]->(c11)
      CREATE (a)-[:MANAGES {since: "2022-12-15", primary: true}]->(c12)
      CREATE (a)-[:MANAGES {since: "2023-09-08", primary: true}]->(c13)
      CREATE (a)-[:MANAGES {since: "2024-01-20", primary: true}]->(c14)
      CREATE (a)-[:MANAGES {since: "2023-06-30", primary: true}]->(c15)
    `);

        console.log("💳 Creating accounts...");

        // Create Accounts
        await session.run(`
      CREATE (acc1:Account {account_id: "ACC001", type: "Checking", balance: 15420.50, currency: "USD", status: "Active", opened_date: "2021-03-15"})
      CREATE (acc2:Account {account_id: "ACC002", type: "Savings", balance: 85000.00, currency: "USD", status: "Active", opened_date: "2021-03-15"})
      CREATE (acc3:Account {account_id: "ACC003", type: "Checking", balance: 8750.25, currency: "USD", status: "Active", opened_date: "2022-06-20"})
      CREATE (acc4:Account {account_id: "ACC004", type: "Money Market", balance: 125000.00, currency: "USD", status: "Active", opened_date: "2019-01-10"})
      CREATE (acc5:Account {account_id: "ACC005", type: "Business Checking", balance: 45600.75, currency: "USD", status: "Active", opened_date: "2023-02-01"})
      CREATE (acc6:Account {account_id: "ACC006", type: "Savings", balance: 230000.00, currency: "USD", status: "Active", opened_date: "2020-05-15"})
      CREATE (acc7:Account {account_id: "ACC007", type: "IRA", balance: 450000.00, currency: "USD", status: "Active", opened_date: "2018-01-20"})
      CREATE (acc8:Account {account_id: "ACC008", type: "Business Savings", balance: 175000.00, currency: "USD", status: "Active", opened_date: "2019-08-10"})
      CREATE (acc9:Account {account_id: "ACC009", type: "Checking", balance: 12300.00, currency: "USD", status: "Active", opened_date: "2021-11-05"})
      CREATE (acc10:Account {account_id: "ACC010", type: "Certificate of Deposit", balance: 50000.00, currency: "USD", status: "Active", opened_date: "2023-06-01"})
    `);

        console.log("🏠 Creating loans...");

        // Create Loans
        await session.run(`
      CREATE (l1:Loan {loan_id: "LOAN001", type: "Mortgage", principal: 450000, interest_rate: 6.5, term_months: 360, monthly_payment: 2844.82, status: "Active", start_date: "2022-01-15"})
      CREATE (l2:Loan {loan_id: "LOAN002", type: "Auto Loan", principal: 35000, interest_rate: 5.9, term_months: 60, monthly_payment: 675.34, status: "Active", start_date: "2023-06-01"})
      CREATE (l3:Loan {loan_id: "LOAN003", type: "Personal Loan", principal: 15000, interest_rate: 8.5, term_months: 36, monthly_payment: 473.52, status: "Active", start_date: "2023-09-15"})
      CREATE (l4:Loan {loan_id: "LOAN004", type: "Business Loan", principal: 250000, interest_rate: 7.25, term_months: 120, monthly_payment: 2947.25, status: "Active", start_date: "2021-03-01"})
      CREATE (l5:Loan {loan_id: "LOAN005", type: "Mortgage", principal: 680000, interest_rate: 6.25, term_months: 360, monthly_payment: 4186.78, status: "Active", start_date: "2023-02-20"})
      CREATE (l6:Loan {loan_id: "LOAN006", type: "Home Equity", principal: 75000, interest_rate: 7.0, term_months: 180, monthly_payment: 674.38, status: "Active", start_date: "2022-08-10"})
    `);

        console.log("💳 Creating credit cards...");

        // Create Credit Cards
        await session.run(`
      CREATE (cc1:CreditCard {card_id: "CC001", type: "Platinum Rewards", credit_limit: 25000, balance: 3420.50, apr: 18.99, rewards_points: 45000, status: "Active"})
      CREATE (cc2:CreditCard {card_id: "CC002", type: "Cash Back", credit_limit: 15000, balance: 1250.00, apr: 19.99, cash_back_balance: 125.50, status: "Active"})
      CREATE (cc3:CreditCard {card_id: "CC003", type: "Business Platinum", credit_limit: 50000, balance: 8750.25, apr: 16.99, rewards_points: 120000, status: "Active"})
      CREATE (cc4:CreditCard {card_id: "CC004", type: "Travel Rewards", credit_limit: 30000, balance: 5600.00, apr: 17.99, travel_miles: 85000, status: "Active"})
      CREATE (cc5:CreditCard {card_id: "CC005", type: "Student Card", credit_limit: 2500, balance: 450.00, apr: 21.99, rewards_points: 2500, status: "Active"})
      CREATE (cc6:CreditCard {card_id: "CC006", type: "Premium Elite", credit_limit: 100000, balance: 15000.00, apr: 15.99, rewards_points: 350000, status: "Active"})
    `);

        console.log("📈 Creating investments...");

        // Create Investments
        await session.run(`
      CREATE (inv1:Investment {investment_id: "INV001", type: "Mutual Fund", name: "Growth Fund A", value: 75000, units: 1500, return_rate: 12.5, status: "Active"})
      CREATE (inv2:Investment {investment_id: "INV002", type: "Stocks", name: "Tech Portfolio", value: 125000, shares: 450, return_rate: 18.2, status: "Active"})
      CREATE (inv3:Investment {investment_id: "INV003", type: "Bonds", name: "Government Bonds", value: 50000, units: 500, return_rate: 4.5, status: "Active"})
      CREATE (inv4:Investment {investment_id: "INV004", type: "ETF", name: "S&P 500 Index", value: 200000, shares: 400, return_rate: 15.8, status: "Active"})
      CREATE (inv5:Investment {investment_id: "INV005", type: "Real Estate Fund", name: "REIT Portfolio", value: 80000, units: 800, return_rate: 8.5, status: "Active"})
      CREATE (inv6:Investment {investment_id: "INV006", type: "Cryptocurrency", name: "Digital Assets", value: 35000, units: 2.5, return_rate: 45.0, status: "Active"})
    `);

        console.log("💸 Creating transactions...");

        // Create Transactions
        await session.run(`
      CREATE (t1:Transaction {transaction_id: "TXN001", type: "Deposit", amount: 5000.00, date: "2024-01-15", description: "Payroll Deposit", status: "Completed"})
      CREATE (t2:Transaction {transaction_id: "TXN002", type: "Withdrawal", amount: 500.00, date: "2024-01-16", description: "ATM Withdrawal", status: "Completed"})
      CREATE (t3:Transaction {transaction_id: "TXN003", type: "Transfer", amount: 2000.00, date: "2024-01-17", description: "Transfer to Savings", status: "Completed"})
      CREATE (t4:Transaction {transaction_id: "TXN004", type: "Payment", amount: 1500.00, date: "2024-01-18", description: "Mortgage Payment", status: "Completed"})
      CREATE (t5:Transaction {transaction_id: "TXN005", type: "Purchase", amount: 250.50, date: "2024-01-19", description: "Online Shopping", status: "Completed"})
      CREATE (t6:Transaction {transaction_id: "TXN006", type: "Deposit", amount: 10000.00, date: "2024-01-20", description: "Investment Return", status: "Completed"})
      CREATE (t7:Transaction {transaction_id: "TXN007", type: "Wire Transfer", amount: 25000.00, date: "2024-01-21", description: "International Transfer", status: "Completed"})
      CREATE (t8:Transaction {transaction_id: "TXN008", type: "Bill Payment", amount: 350.00, date: "2024-01-22", description: "Utility Bill", status: "Completed"})
    `);

        console.log("🔗 Creating client-account relationships...");

        // Client-Account relationships (HAS_ACCOUNT)
        await session.run(`
      MATCH (c1:Client {client_id: "C001"}), (acc1:Account {account_id: "ACC001"}), (acc2:Account {account_id: "ACC002"})
      CREATE (c1)-[:HAS_ACCOUNT {role: "Primary", since: "2021-03-15"}]->(acc1)
      CREATE (c1)-[:HAS_ACCOUNT {role: "Primary", since: "2021-03-15"}]->(acc2)
    `);
        await session.run(`
      MATCH (c2:Client {client_id: "C002"}), (acc3:Account {account_id: "ACC003"})
      CREATE (c2)-[:HAS_ACCOUNT {role: "Primary", since: "2022-06-20"}]->(acc3)
    `);
        await session.run(`
      MATCH (c3:Client {client_id: "C003"}), (acc4:Account {account_id: "ACC004"}), (acc7:Account {account_id: "ACC007"})
      CREATE (c3)-[:HAS_ACCOUNT {role: "Primary", since: "2019-01-10"}]->(acc4)
      CREATE (c3)-[:HAS_ACCOUNT {role: "Primary", since: "2018-01-20"}]->(acc7)
    `);
        await session.run(`
      MATCH (c4:Client {client_id: "C004"}), (acc5:Account {account_id: "ACC005"})
      CREATE (c4)-[:HAS_ACCOUNT {role: "Primary", since: "2023-02-01"}]->(acc5)
    `);
        await session.run(`
      MATCH (c5:Client {client_id: "C005"}), (acc6:Account {account_id: "ACC006"})
      CREATE (c5)-[:HAS_ACCOUNT {role: "Primary", since: "2020-05-15"}]->(acc6)
    `);
        await session.run(`
      MATCH (c7:Client {client_id: "C007"}), (acc8:Account {account_id: "ACC008"})
      CREATE (c7)-[:HAS_ACCOUNT {role: "Primary", since: "2019-08-10"}]->(acc8)
    `);
        await session.run(`
      MATCH (c8:Client {client_id: "C008"}), (acc9:Account {account_id: "ACC009"})
      CREATE (c8)-[:HAS_ACCOUNT {role: "Primary", since: "2021-11-05"}]->(acc9)
    `);
        await session.run(`
      MATCH (c14:Client {client_id: "C014"}), (acc10:Account {account_id: "ACC010"})
      CREATE (c14)-[:HAS_ACCOUNT {role: "Primary", since: "2023-06-01"}]->(acc10)
    `);

        console.log("🏠 Creating client-loan relationships...");

        // Client-Loan relationships (HAS_LOAN)
        await session.run(`
      MATCH (c1:Client {client_id: "C001"}), (l1:Loan {loan_id: "LOAN001"})
      CREATE (c1)-[:HAS_LOAN {co_borrower: false}]->(l1)
    `);
        await session.run(`
      MATCH (c2:Client {client_id: "C002"}), (l2:Loan {loan_id: "LOAN002"})
      CREATE (c2)-[:HAS_LOAN {co_borrower: false}]->(l2)
    `);
        await session.run(`
      MATCH (c4:Client {client_id: "C004"}), (l3:Loan {loan_id: "LOAN003"}), (l4:Loan {loan_id: "LOAN004"})
      CREATE (c4)-[:HAS_LOAN {co_borrower: false}]->(l3)
      CREATE (c4)-[:HAS_LOAN {co_borrower: false}]->(l4)
    `);
        await session.run(`
      MATCH (c7:Client {client_id: "C007"}), (l5:Loan {loan_id: "LOAN005"})
      CREATE (c7)-[:HAS_LOAN {co_borrower: false}]->(l5)
    `);
        await session.run(`
      MATCH (c3:Client {client_id: "C003"}), (l6:Loan {loan_id: "LOAN006"})
      CREATE (c3)-[:HAS_LOAN {co_borrower: false}]->(l6)
    `);

        console.log("💳 Creating client-credit card relationships...");

        // Client-CreditCard relationships (OWNS_CARD)
        await session.run(`
      MATCH (c1:Client {client_id: "C001"}), (cc1:CreditCard {card_id: "CC001"})
      CREATE (c1)-[:OWNS_CARD {since: "2021-05-01", is_primary: true}]->(cc1)
    `);
        await session.run(`
      MATCH (c2:Client {client_id: "C002"}), (cc2:CreditCard {card_id: "CC002"})
      CREATE (c2)-[:OWNS_CARD {since: "2022-08-15", is_primary: true}]->(cc2)
    `);
        await session.run(`
      MATCH (c4:Client {client_id: "C004"}), (cc3:CreditCard {card_id: "CC003"})
      CREATE (c4)-[:OWNS_CARD {since: "2023-03-01", is_primary: true}]->(cc3)
    `);
        await session.run(`
      MATCH (c5:Client {client_id: "C005"}), (cc4:CreditCard {card_id: "CC004"})
      CREATE (c5)-[:OWNS_CARD {since: "2020-07-20", is_primary: true}]->(cc4)
    `);
        await session.run(`
      MATCH (c14:Client {client_id: "C014"}), (cc5:CreditCard {card_id: "CC005"})
      CREATE (c14)-[:OWNS_CARD {since: "2023-09-01", is_primary: true}]->(cc5)
    `);
        await session.run(`
      MATCH (c3:Client {client_id: "C003"}), (cc6:CreditCard {card_id: "CC006"})
      CREATE (c3)-[:OWNS_CARD {since: "2019-02-01", is_primary: true}]->(cc6)
    `);

        console.log("📈 Creating client-investment relationships...");

        // Client-Investment relationships (HAS_INVESTMENT)
        await session.run(`
      MATCH (c1:Client {client_id: "C001"}), (inv1:Investment {investment_id: "INV001"})
      CREATE (c1)-[:HAS_INVESTMENT {since: "2022-01-15"}]->(inv1)
    `);
        await session.run(`
      MATCH (c3:Client {client_id: "C003"}), (inv2:Investment {investment_id: "INV002"}), (inv3:Investment {investment_id: "INV003"}), (inv4:Investment {investment_id: "INV004"})
      CREATE (c3)-[:HAS_INVESTMENT {since: "2019-06-01"}]->(inv2)
      CREATE (c3)-[:HAS_INVESTMENT {since: "2020-03-15"}]->(inv3)
      CREATE (c3)-[:HAS_INVESTMENT {since: "2021-01-10"}]->(inv4)
    `);
        await session.run(`
      MATCH (c7:Client {client_id: "C007"}), (inv5:Investment {investment_id: "INV005"})
      CREATE (c7)-[:HAS_INVESTMENT {since: "2020-08-20"}]->(inv5)
    `);
        await session.run(`
      MATCH (c14:Client {client_id: "C014"}), (inv6:Investment {investment_id: "INV006"})
      CREATE (c14)-[:HAS_INVESTMENT {since: "2023-11-01"}]->(inv6)
    `);

        console.log("💸 Creating account-transaction relationships...");

        // Account-Transaction relationships (MADE_TRANSACTION)
        await session.run(`
      MATCH (acc1:Account {account_id: "ACC001"}), (t1:Transaction {transaction_id: "TXN001"})
      CREATE (acc1)-[:MADE_TRANSACTION]->(t1)
    `);
        await session.run(`
      MATCH (acc1:Account {account_id: "ACC001"}), (t2:Transaction {transaction_id: "TXN002"})
      CREATE (acc1)-[:MADE_TRANSACTION]->(t2)
    `);
        await session.run(`
      MATCH (acc1:Account {account_id: "ACC001"}), (t3:Transaction {transaction_id: "TXN003"})
      CREATE (acc1)-[:MADE_TRANSACTION]->(t3)
    `);
        await session.run(`
      MATCH (acc1:Account {account_id: "ACC001"}), (t4:Transaction {transaction_id: "TXN004"})
      CREATE (acc1)-[:MADE_TRANSACTION]->(t4)
    `);
        await session.run(`
      MATCH (acc3:Account {account_id: "ACC003"}), (t5:Transaction {transaction_id: "TXN005"})
      CREATE (acc3)-[:MADE_TRANSACTION]->(t5)
    `);
        await session.run(`
      MATCH (acc4:Account {account_id: "ACC004"}), (t6:Transaction {transaction_id: "TXN006"})
      CREATE (acc4)-[:MADE_TRANSACTION]->(t6)
    `);
        await session.run(`
      MATCH (acc8:Account {account_id: "ACC008"}), (t7:Transaction {transaction_id: "TXN007"})
      CREATE (acc8)-[:MADE_TRANSACTION]->(t7)
    `);
        await session.run(`
      MATCH (acc9:Account {account_id: "ACC009"}), (t8:Transaction {transaction_id: "TXN008"})
      CREATE (acc9)-[:MADE_TRANSACTION]->(t8)
    `);

        console.log("🔗 Creating transfer relationships...");

        // Transfer relationships (TRANSFERRED_TO)
        await session.run(`
      MATCH (acc1:Account {account_id: "ACC001"}), (acc2:Account {account_id: "ACC002"})
      CREATE (acc1)-[:TRANSFERRED_TO {amount: 2000.00, date: "2024-01-17", reference: "INT-TRF-001"}]->(acc2)
    `);

        console.log("✅ Database seeded successfully!");
        console.log("\n📊 Summary:");
        console.log("   - 3 Advisors");
        console.log("   - 15 Clients (5 per advisor)");
        console.log("   - 10 Accounts");
        console.log("   - 6 Loans");
        console.log("   - 6 Credit Cards");
        console.log("   - 6 Investments");
        console.log("   - 8 Transactions");
        console.log("   - Multiple relationships between entities");

    } catch (error) {
        console.error("❌ Error seeding database:", error);
        throw error;
    } finally {
        await session.close();
        await closeDriver();
    }
}

seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
