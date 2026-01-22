/**
 * Users Routes
 * Routes for advisor and client data
 */
const express = require("express");
const usersController = require("../controllers/users.controller");

const router = express.Router();

// Advisor routes
router.get("/advisors", usersController.getAllAdvisors);
router.get("/advisors/:advisorId", usersController.getAdvisorById);
router.get("/advisors/:advisorId/clients", usersController.getAdvisorClients);

// Client routes
router.get("/clients", usersController.getAllClients);
router.get("/clients/:clientId", usersController.getClientById);

module.exports = router;
