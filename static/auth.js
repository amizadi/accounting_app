// Authentication utilities
window.AuthUtils = {
    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            return false;
        }
        
        try {
            const response = await axios.get('/auth/me');
            return response.data;
        } catch (error) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            return false;
        }
    },

    logout() {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        window.location.reload();
    },

    hasManagerRole() {
        return window.AppState.user && window.AppState.user.role === 'manager';
    }
};

// Setup axios interceptor for token handling
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            window.AuthUtils.logout();
        }
        return Promise.reject(error);
    }
);
