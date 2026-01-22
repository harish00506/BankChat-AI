# Backend - Banking Knowledge Graph API

## Setup
```bash
cd backend
npm install
```

## Run
```bash
npm start
# Runs on http://localhost:3001
```

## Seed Data
```bash
npm run seed:neo4j
```

## API Endpoints

### POST /api/chat
Query client banking data
```json
{
  "question": "What accounts does C001 have?",
  "role": "advisor",
  "user_id": "A001",
  "client_id": "C001"
}
```

### GET /api/users/advisors
Get all advisors

### GET /api/users/advisors/:advisorId/clients
Get clients for an advisor

### GET /api/users/clients/:clientId
Get client details

### GET /api/graph
Get full graph for visualization

### GET /health
Health check endpoint
