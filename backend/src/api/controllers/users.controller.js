/**
 * Users Controller
 * Handles advisor and client data retrieval
 */
const neo4j = require("../../db/neo4j");

/**
 * Get all advisors
 */
async function getAllAdvisors(req, res, next) {
    try {
        const advisors = await neo4j.getAllAdvisors();
        res.json({
            success: true,
            advisors,
            count: advisors.length,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get advisor by ID
 */
async function getAdvisorById(req, res, next) {
    try {
        const { advisorId } = req.params;
        const advisors = await neo4j.getAdvisorById(advisorId);

        if (!advisors.length) {
            return res.status(404).json({
                success: false,
                error: "Advisor not found",
            });
        }

        res.json({
            success: true,
            advisor: advisors[0],
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get clients for a specific advisor
 */
async function getAdvisorClients(req, res, next) {
    try {
        const { advisorId } = req.params;
        const clients = await neo4j.getAdvisorClients(advisorId);

        res.json({
            success: true,
            advisorId,
            clients,
            count: clients.length,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all clients
 */
async function getAllClients(req, res, next) {
    try {
        const clients = await neo4j.getAllClients();
        res.json({
            success: true,
            clients,
            count: clients.length,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get client by ID
 */
async function getClientById(req, res, next) {
    try {
        const { clientId } = req.params;
        const profiles = await neo4j.getClientProfile(clientId);

        if (!profiles.length) {
            return res.status(404).json({
                success: false,
                error: "Client not found",
            });
        }

        res.json({
            success: true,
            client: profiles[0],
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllAdvisors,
    getAdvisorById,
    getAdvisorClients,
    getAllClients,
    getClientById,
};
