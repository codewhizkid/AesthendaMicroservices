// Login form handling - simplified version without ES modules

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    // Check if already logged in
    if (window.AuthService && window.AuthService.isLoggedIn()) {
        // Redirect to home or dashboard
        window.location.href = '/calendar';
        return;
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get input values
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Validate inputs
            if (!email || !password) {
                showAlert('Please enter both email and password', 'error');
                return;
            }
            
            try {
                // Use our simplified auth service if available
                if (window.AuthService) {
                    const result = window.AuthService.login(email, password);
                    
                    if (result.success) {
                        showAlert('Login successful! Redirecting...', 'success');
                        
                        // Redirect to dashboard after short delay
                        setTimeout(() => {
                            window.location.href = '/calendar';
                        }, 1000);
                    } else {
                        showAlert(result.message || 'Invalid credentials', 'error');
                    }
                } else {
                    // Fall back to alert if auth service not available
                    alert('Auth service not available. Please include login-handler.js');
                }
            } catch (error) {
                console.error('Login error:', error);
                showAlert('An error occurred during login. Please try again.', 'error');
            }
        });
    }

    // Handle OAuth login buttons
    const googleLoginBtn = document.getElementById('googleLogin');
    const facebookLoginBtn = document.getElementById('facebookLogin');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAlert('Google login is not available in development mode', 'info');
            
            // For demo purposes, log in as admin
            if (window.AuthService) {
                const result = window.AuthService.login('admin@aesthenda.com', 'Admin123!');
                if (result.success) {
                    showAlert('Logged in as admin! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/calendar';
                    }, 1000);
                }
            }
        });
    }

    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAlert('Facebook login is not available in development mode', 'info');
        });
    }

    // Handle "Forgot Password" link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/reset-password.html';
        });
    }
});

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    if (!alertContainer || !alertMessage) return;
    
    alertMessage.textContent = message;
    alertContainer.className = 'p-4 rounded-md mb-4';
    
    if (type === 'error') {
        alertContainer.classList.add('bg-red-100', 'text-red-800');
    } else if (type === 'success') {
        alertContainer.classList.add('bg-green-100', 'text-green-800');
    } else {
        alertContainer.classList.add('bg-blue-100', 'text-blue-800');
    }
    
    alertContainer.classList.remove('hidden');
}

function clearAlerts() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.classList.add('hidden');
}