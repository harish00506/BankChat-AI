/**
 * Search Routes
 * POST /api/search - Semantic search
 * POST /api/search/products - Get product recommendations for a client
 */
const { Router } = require("express");
const searchController = require("../controllers/search.controller");

const router = Router();

// POST /api/search - Perform semantic search on documents
router.post("/", searchController.semanticSearch);

// POST /api/search/products - Get product recommendations
router.post("/products", searchController.findProducts);

module.exports = router;
