/**
 * Graph Controller
 * Handles graph visualization requests
 */
const { getAllNodesAndEdges, getGraphByAdvisor, getGraphByClient } = require("../../db/neo4j");

/**
 * GET /api/graph
 * Fetch all nodes and edges for visualization
 * Query params:
 *   - advisorId: Filter by advisor's clients
 *   - clientId: Filter by specific client
 */
async function getGraph(req, res, next) {
  try {
    const { advisorId, clientId } = req.query;

    let result;
    let filterInfo = "all";

    if (clientId) {
      console.log(`[API] Fetching graph data for client: ${clientId}...`);
      result = await getGraphByClient(clientId);
      filterInfo = `client:${clientId}`;
    } else if (advisorId) {
      console.log(`[API] Fetching graph data for advisor: ${advisorId}...`);
      result = await getGraphByAdvisor(advisorId);
      filterInfo = `advisor:${advisorId}`;
    } else {
      console.log("[API] Fetching complete graph data...");
      result = await getAllNodesAndEdges();
    }

    const { nodes, links, nodeTypes } = result;

    console.log(`[API] Graph (${filterInfo}): ${nodes.length} nodes, ${links.length} edges`);

    res.json({
      success: true,
      graph: { nodes, links },
      nodeTypes,
      filter: filterInfo,
      stats: {
        totalNodes: nodes.length,
        totalEdges: links.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGraph,
};
