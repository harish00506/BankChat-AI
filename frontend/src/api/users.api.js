/**
 * Users API
 * API calls for advisors and clients
 */
import { apiRequest } from './config';

/**
 * Fetch all advisors
 */
export async function getAllAdvisors() {
    return apiRequest('/api/users/advisors');
}

/**
 * Fetch a specific advisor by ID
 */
export async function getAdvisorById(advisorId) {
    return apiRequest(`/api/users/advisors/${advisorId}`);
}

/**
 * Fetch clients for a specific advisor
 */
export async function getAdvisorClients(advisorId) {
    return apiRequest(`/api/users/advisors/${advisorId}/clients`);
}

/**
 * Fetch all clients
 */
export async function getAllClients() {
    return apiRequest('/api/users/clients');
}

/**
 * Fetch a specific client by ID
 */
export async function getClientById(clientId) {
    return apiRequest(`/api/users/clients/${clientId}`);
}
