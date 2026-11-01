// Base API configuration for ElectroSL Backend
const API_BASE_URL = 'http://localhost:5000/api';

export const fetchJobs = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching jobs:", error);
        throw error;
    }
};