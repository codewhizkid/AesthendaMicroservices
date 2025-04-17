/**
 * Simple Authentication Service for Aesthenda
 * This is a simplified version that works without backend dependencies
 */

// Create a global AuthService object
window.AuthService = (function() {
    // Default admin credentials
    const ADMIN_EMAIL = 'admin@aesthenda.com';
    const ADMIN_PASSWORD = 'Admin123!';
    
    // Storage keys
    const AUTH_TOKEN_KEY = 'aesthenda_auth_token';
    const USER_DATA_KEY = 'aesthenda_user';
    
    // Admin user template
    const ADMIN_USER = {
        id: '1',
        email: ADMIN_EMAIL,
        name: 'Admin User',
        role: 'ADMIN',
        tenantId: 'default'
    };
    
    // Check if user is logged in
    function isLoggedIn() {
        return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
    }
    
    // Get current user data
    function getCurrentUser() {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    
    // Login function
    function login(email, password) {
        console.log(`Login attempt: ${email}`);
        
        // Clear any existing data
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        
        // Check credentials - for demo, only admin works
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Generate a fake token
            const token = `demo_token_${Date.now()}`;
            
            // Store auth data
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(ADMIN_USER));
            
            console.log('Login successful');
            return { 
                success: true, 
                user: ADMIN_USER,
                token: token
            };
        } else {
            console.log('Login failed: Invalid credentials');
            return { 
                success: false, 
                message: 'Invalid email or password'
            };
        }
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        console.log('User logged out');
        return { success: true };
    }
    
    // Redirect if not authenticated
    function requireAuth() {
        if (!isLoggedIn()) {
            console.log('Authentication required, redirecting to login');
            window.location.href = '/login';
            return false;
        }
        return true;
    }
    
    // Handle login form submission
    function setupLoginForm() {
        console.log('Setting up login form handler');
        const loginForm = document.getElementById('loginForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const alertContainer = document.getElementById('alertContainer');
                const alertMessage = document.getElementById('alertMessage');
                
                // Clear any existing alerts
                if (alertContainer) {
                    alertContainer.classList.add('hidden');
                }
                
                const result = login(email, password);
                
                if (result.success) {
                    console.log('Login successful, redirecting');
                    window.location.href = '/calendar';
                } else {
                    console.log('Login failed');
                    if (alertContainer && alertMessage) {
                        alertMessage.textContent = result.message || 'Login failed';
                        alertContainer.classList.remove('hidden');
                    }
                }
            });
        } else {
            console.log('Login form not found on this page');
        }
    }
    
    // Initialize auth handlers when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Auth handler initialized');
        setupLoginForm();
        
        // Add logout button handler if present
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
                window.location.href = '/login';
            });
        }
    });
    
    // Public API
    return {
        isLoggedIn,
        login,
        logout,
        getCurrentUser,
        requireAuth
    };
})(); 