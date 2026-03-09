// Profile Service for Employee Profile Management
// Handles CRUD operations with backend API

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api-gateway-url';

/**
 * Get all employee profiles
 * @returns {Promise<Array>} - Array of employee profiles
 */
export async function getAllProfiles() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profiles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch profiles: ${response.statusText}`);
        }

        const data = await response.json();
        return data.profiles || [];
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
    }
}

/**
 * Get a single employee profile
 * @param {string} employeeId - Employee ID or email
 * @returns {Promise<Object>} - Employee profile data
 */
export async function getProfile(employeeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profiles/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Profile doesn't exist yet
            }
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
}

/**
 * Create a new employee profile
 * @param {Object} profileData - Profile data to create
 * @returns {Promise<Object>} - Created profile
 */
export async function createProfile(profileData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profiles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create profile: ${response.statusText}`);
        }

        const data = await response.json();
        return data.profile;
    } catch (error) {
        console.error('Error creating profile:', error);
        throw error;
    }
}

/**
 * Update an existing employee profile
 * @param {string} employeeId - Employee ID or email
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated profile
 */
export async function updateProfile(employeeId, profileData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profiles/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error(`Failed to update profile: ${response.statusText}`);
        }

        const data = await response.json();
        return data.profile;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

/**
 * Delete an employee profile (soft delete)
 * @param {string} employeeId - Employee ID or email
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteProfile(employeeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profiles/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete profile: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting profile:', error);
        throw error;
    }
}

/**
 * Save profile (create or update)
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} - Saved profile
 */
export async function saveProfile(profileData) {
    const employeeId = profileData.employeeId || profileData.email;
    
    // Check if profile exists
    const existingProfile = await getProfile(employeeId);
    
    if (existingProfile) {
        // Update existing profile
        return await updateProfile(employeeId, profileData);
    } else {
        // Create new profile
        return await createProfile(profileData);
    }
}

export default {
    getAllProfiles,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    saveProfile
};
