// Login form handling
import { executeQuery, executeMutation } from '../../graphql-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    const googleLoginBtn = document.getElementById('googleLogin');
    const facebookLoginBtn = document.getElementById('facebookLogin');

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        try {
            // Validate inputs
            if (!email || !password) {
                showAlert('Please fill in all required fields', 'error');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('loginButton');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
            `;

            // Execute login query
            const loginMutation = `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                        refreshToken
                        user {
                            id
                            email
                            name
                            role
                            isVerified
                        }
                        success
                        message
                    }
                }
            `;

            const response = await executeMutation(loginMutation, { email, password });

            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;

            if (!response.success) {
                // Handle errors from the standardized error format
                if (response.errors && response.errors.length > 0) {
                    showAlert(response.errors[0].message, 'error');
                } else {
                    showAlert('Login failed. Please try again.', 'error');
                }
                return;
            }

            if (response.data.login.success) {
                // Save authentication tokens
                const token = response.data.login.token;
                const refreshToken = response.data.login.refreshToken;
                const user = response.data.login.user;
                
                if (rememberMe) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('token', token);
                    sessionStorage.setItem('refreshToken', refreshToken);
                    sessionStorage.setItem('user', JSON.stringify(user));
                }

                // Store email for verification resending if needed
                localStorage.setItem('userEmail', email);

                // Check if email is verified
                if (!user.isVerified) {
                    showAlert('Please verify your email address to access all features.', 'warning');
                    // Redirect after a short delay to allow user to see the message
                    setTimeout(() => {
                        window.location.href = '/verify-email.html';
                    }, 2000);
                    return;
                }

                // Redirect to dashboard or home
                window.location.href = '/';
            } else {
                showAlert(response.data.login.message || 'Invalid credentials', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'An unexpected error occurred', 'error');
        }
    });

    // Handle OAuth login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            initiateOAuthLogin('google');
        });
    }

    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', () => {
            initiateOAuthLogin('facebook');
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

function initiateOAuthLogin(provider) {
    // Store the current page as the return URL
    localStorage.setItem('returnUrl', window.location.href);
    
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/${provider}`;
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    alertMessage.textContent = message;
    alertContainer.classList.remove('hidden');
    
    // Set appropriate color based on type
    alertContainer.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-yellow-100', 'text-yellow-800');
    
    switch (type) {
        case 'success':
            alertContainer.classList.add('bg-green-100', 'text-green-800');
            break;
        case 'error':
            alertContainer.classList.add('bg-red-100', 'text-red-800');
            break;
        case 'warning':
            alertContainer.classList.add('bg-yellow-100', 'text-yellow-800');
            break;
        default:
            alertContainer.classList.add('bg-blue-100', 'text-blue-800');
    }
}

function clearAlerts() {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.classList.add('hidden');
}