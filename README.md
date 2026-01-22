# Bank-Chat: Hybrid Banking Knowledge Graph with Vector Search

🏦 **RAG-based Banking Chat Assistant** leveraging Neo4j Knowledge Graph + Supabase pgvector for semantic search, powered by Groq LLM and HuggingFace embeddings.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                      │
│              Port 5000 - Chat & Graph Visualization             │
│  - Chat Interface (RAG QA)                                      │
│  - Neo4j Graph Visualization (interactive force graph)          │
│  - Dark/Light Theme                                             │
└────────────────────────────┬──────────────────────────────────┘
                             │ REST API (JSON)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                        │
│                    Port 3001 - Hybrid Engine                    │
├──────────────────────────────────────────────────────────────────┤
│ 🧠 RAG Pipeline                                                 │
│  ├─ User Question                                               │
│  ├─ Neo4j Graph Query (Cypher)                                  │
│  ├─ Semantic Vector Search (if enabled)                         │
│  ├─ Context Enrichment                                          │
│  └─ Groq LLM Response Generation                                │
└─────┬────────────────────────────┬─────────────────────┬────────┘
      │                            │                     │
      ↓                            ↓                     ↓
  ┌─────────────┐        ┌──────────────────┐    ┌──────────────┐
  │  Neo4j DB   │        │  Supabase        │    │  Groq API    │
  │  (Graph)    │        │  pgvector        │    │  (LLM)       │
  │  Banking    │        │  (Semantic)      │    │              │
  │  Knowledge  │        │  Embeddings      │    │              │
  └─────────────┘        └──────────────────┘    └──────────────┘
                                │
                                ↓
                    ┌──────────────────────┐
                    │  HuggingFace API     │
                    │  (Free Embeddings)   │
                    │  all-MiniLM-L6-v2    │
                    └──────────────────────┘
```

## 📊 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + React Router | Chat UI + Graph Visualization |
| **Graph Rendering** | react-force-graph-2d | Interactive 2D force-directed graph |
| **Backend API** | Node.js + Express | REST endpoints & RAG engine |
| **Graph DB** | Neo4j 5.14 | Banking knowledge graph |
| **Vector DB** | Supabase PostgreSQL + pgvector | Semantic search embeddings |
| **LLM** | Groq (openai/gpt-oss-120b) | Fast response generation |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) | Free semantic embeddings (384-dim) |
| **Styling** | CSS3 + CSS Variables | Dark/Light themes |

## 🏦 Banking Data Model

### Entities (Nodes)
- **Advisor** - Financial advisors managing clients
- **Client** - Bank customers with accounts
- **Account** - Checking, Savings, Money Market, IRA, etc.
- **Transaction** - Deposits, withdrawals, transfers, payments
- **Loan** - Mortgages, auto loans, personal loans, business loans
- **CreditCard** - Various credit card types with limits and balances
- **Investment** - Mutual funds, stocks, bonds, ETFs, crypto

### Relationships (Edges)
- `MANAGES` - Advisor manages Client
- `HAS_ACCOUNT` - Client has Account
- `MADE_TRANSACTION` - Account made Transaction
- `HAS_LOAN` - Client has Loan
- `OWNS_CARD` - Client owns CreditCard
- `HAS_INVESTMENT` - Client has Investment
- `TRANSFERRED_TO` - Account transferred to Account

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Neo4j cloud/local instance running
- Supabase PostgreSQL instance (pgvector pre-enabled)
- Groq API key
- HuggingFace API token (free tier)

### Terminal 1: Start Backend
```bash
cd backend
npm install
npm run dev    # Uses nodemon for auto-reload
# Runs on http://localhost:3001
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5001 (or next available port)
```

Visit **http://localhost:5001** in your browser

## 🔑 Environment Configuration

Create `backend/.env`:
```env
# Neo4j
NEO4J_URI=neo4j+s://your-instance-uri.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Supabase (PostgreSQL with pgvector)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_URL=postgres://user:password@db.your-project.supabase.co:5432/postgres

# Groq LLM
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b

# HuggingFace (for free embeddings)
HF_API_TOKEN=your-huggingface-token

# Feature flags
EMBEDDINGS_ENABLED=true
```

## 💬 Sample Queries

### Account Queries
- "What accounts does C001 have?"
- "Show me C002's account balances"
- "What is the total balance for C003?"

### Transaction Queries
- "What are C001's recent transactions?"
- "Show me deposits for C002"
- "List all withdrawals for C001"

### Loan Queries
- "What loans does C004 have?"
- "Show me C007's mortgage details"
- "What is the monthly payment for C001's loan?"

### Investment Queries
- "What investments does C003 have?"
- "Show me C001's portfolio"
- "What is the return rate for C003's investments?"

### Credit Card Queries
- "What credit cards does C001 have?"
- "Show me credit limit for C003"
- "What is the balance on C002's card?"

## 📁 Project Structure

```
Bank-Chat/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # API client functions
│   │   ├── hooks/           # Custom React hooks
│   │   └── pages/           # Page components
│   └── package.json
│
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── api/             # Express routes & controllers
│   │   ├── db/              # Database drivers (Neo4j, Supabase)
│   │   ├── services/        # Business logic services
│   │   ├── scripts/         # Seed scripts
│   │   └── config/          # Configuration
│   └── package.json
│
└── README.md
```

## 🗂️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/chat` | POST | RAG chat query |
| `/graph` | GET | Full graph data |
| `/graph/advisors` | GET | List all advisors |
| `/graph/advisors/:id/clients` | GET | Advisor's clients |
| `/users/clients/:id` | GET | Client details |

## 🎨 Features

- **Interactive Chat** - Natural language queries about banking data
- **Graph Visualization** - Interactive force-directed graph of banking entities
- **Advisor/Client Filtering** - Filter data by advisor or client
- **Dark/Light Mode** - Theme toggle for comfortable viewing
- **Real-time Status** - Backend connection monitoring
- **Quick Queries** - Pre-built query buttons for common requests

## 🛠️ Development

### Seed the Database
```bash
cd backend
npm run seed:neo4j    # Seed Neo4j with banking data
npm run seed:vectors  # Seed vector embeddings (if enabled)
```

### Run Tests
```bash
npm test
```

## 📄 License

MIT License - See LICENSE file for details
