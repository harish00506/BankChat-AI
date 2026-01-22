/**
 * useAuth Hook
 * Manages user authentication state (role, IDs)
 */
import { useState, useCallback } from 'react';

/**
 * Custom hook for authentication state management
 * @returns {object} Auth state and handlers
 */
export function useAuth() {
    const [role, setRole] = useState('advisor');
    const [userId, setUserId] = useState('A001');
    const [clientId, setClientId] = useState('C001');

    /**
     * Handle role change - also updates default userId
     * @param {string} newRole - 'advisor' or 'client'
     */
    const handleRoleChange = useCallback((newRole) => {
        setRole(newRole);
        setUserId(newRole === 'advisor' ? 'A001' : 'C001');
    }, []);

    /**
     * Get the effective client ID based on role
     * @returns {string} Client ID to use in queries
     */
    const getEffectiveClientId = useCallback(() => {
        return role === 'advisor' ? clientId : userId;
    }, [role, clientId, userId]);

    return {
        role,
        userId,
        clientId,
        setRole: handleRoleChange,
        setUserId,
        setClientId,
        getEffectiveClientId,
    };
}

export default useAuth;
