/**
 * useUsers Hook
 * Fetches advisors and clients from the database
 */
import { useState, useEffect, useCallback } from 'react';
import { getAllAdvisors, getAdvisorClients } from '../api';

/**
 * Sanitize data by converting non-serializable objects to strings
 */
function sanitizeData(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }

  const sanitized = {};
  for (const key in obj) {
    const value = obj[key];
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Check if it's a Neo4j BigInt object with {low, high}
      if ('low' in value && 'high' in value) {
        // Convert BigInt to a proper number if possible
        const num = (value.high << 32) + value.low;
        sanitized[key] = num;
      } else if (value.toString && value.toString() !== '[object Object]') {
        // Use toString for any object that has a proper toString
        sanitized[key] = value.toString();
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeData(value);
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Custom hook for managing advisors and clients data
 * @returns {object} Users state and methods
 */
export function useUsers() {
  const [advisors, setAdvisors] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all advisors on mount
  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        setLoading(true);
        const response = await getAllAdvisors();
        if (response.success) {
          const sanitizedAdvisors = sanitizeData(response.advisors);
          setAdvisors(sanitizedAdvisors);
          // Auto-select first advisor
          if (sanitizedAdvisors.length > 0) {
            setSelectedAdvisor(sanitizedAdvisors[0]);
          }
        } else {
          setError(response.error || 'Failed to fetch advisors');
        }
      } catch (err) {
        setError(`Connection error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisors();
  }, []);

  // Fetch clients when advisor changes
  useEffect(() => {
    const fetchClients = async () => {
      if (!selectedAdvisor) {
        setClients([]);
        return;
      }

      try {
        const response = await getAdvisorClients(selectedAdvisor.id);
        if (response.success) {
          const sanitizedClients = sanitizeData(response.clients);
          setClients(sanitizedClients);
          // Auto-select first client
          if (sanitizedClients.length > 0) {
            setSelectedClient(sanitizedClients[0]);
          } else {
            setSelectedClient(null);
          }
        } else {
          setClients([]);
          setError(response.error || 'Failed to fetch clients');
        }
      } catch (err) {
        setClients([]);
        setError(`Connection error: ${err.message}`);
      }
    };

    fetchClients();
  }, [selectedAdvisor]);

  /**
   * Change the selected advisor
   * @param {string} advisorId - Advisor ID to select
   */
  const selectAdvisor = useCallback((advisorId) => {
    const advisor = advisors.find(a => a.id === advisorId);
    if (advisor) {
      setSelectedAdvisor(advisor);
    }
  }, [advisors]);

  /**
   * Change the selected client
   * @param {string} clientId - Client ID to select
   */
  const selectClient = useCallback((clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
    }
  }, [clients]);

  /**
   * Refresh advisors list
   */
  const refreshAdvisors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllAdvisors();
      if (response.success) {
        setAdvisors(response.advisors);
      }
    } catch (err) {
      setError(`Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Data
    advisors,
    clients,
    selectedAdvisor,
    selectedClient,
    // State
    loading,
    error,
    // Actions
    selectAdvisor,
    selectClient,
    refreshAdvisors,
    // Setters for direct control
    setSelectedAdvisor,
    setSelectedClient,
  };
}

export default useUsers;
