// Registration form handling
import { executeMutation } from '../../graphql-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    const googleLoginBtn = document.getElementById('googleLogin');
    const facebookLoginBtn = document.getElementById('facebookLogin');

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const termsAgreed = document.getElementById('terms').checked;

        try {
            // Validate inputs
            if (!name || !email || !password) {
                showAlert('Please fill in all required fields', 'error');
                return;
            }

            if (!termsAgreed) {
                showAlert('You must agree to the Terms and Privacy Policy', 'error');
                return;
            }

            if (password.length < 8) {
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('registerButton');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
            `;

            // Execute registration query
            const registerMutation = `
                mutation Register($input: RegisterInput!) {
                    register(input: $input) {
                        token
                        refreshToken
                        user {
                            id
                            email
                            name
                            role
                        }
                        success
                        message
                    }
                }
            `;

            const variables = {
                input: {
                    name,
                    email,
                    password,
                    role
                }
            };

            const response = await executeMutation(registerMutation, variables);

            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;

            if (!response.success) {
                // Check for duplicate email error and provide user-friendly message
                if (response.errors && response.errors.length > 0) {
                    const errorMsg = response.errors[0].message;
                    if (errorMsg.includes('email already exists')) {
                        showAlert('This email is already registered. Please login instead.', 'error');
                    } else {
                        showAlert(errorMsg, 'error');
                    }
                } else {
                    showAlert('Registration failed. Please try again.', 'error');
                }
                return;
            }

            if (response.data.register.success) {
                // Store tokens
                const token = response.data.register.token;
                const refreshToken = response.data.register.refreshToken;
                const user = response.data.register.user;
                
                // Store in localStorage to persist
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Save user email for verification resending if needed
                localStorage.setItem('userEmail', email);
                
                // Show success message and redirect to verification page
                showAlert('Registration successful! Please check your email for verification link.', 'success');
                
                // Clear form
                registerForm.reset();
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/verify-email.html';
                }, 2000);
            } else {
                showAlert(response.data.register.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
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

    // Password strength validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordStrength);
    }
});

function initiateOAuthLogin(provider) {
    // Store the current page as the return URL
    localStorage.setItem('returnUrl', window.location.href);
    
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/${provider}`;
}

function validatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!strengthIndicator) return;
    
    // Hide indicator if password is empty
    if (password.length === 0) {
        strengthIndicator.style.display = 'none';
        return;
    }
    
    // Show indicator
    strengthIndicator.style.display = 'block';
    
    // Calculate strength
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    if (password.match(/\d+/)) strength += 1;
    if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) strength += 1;
    
    // Update indicator
    strengthIndicator.style.width = (strength * 25) + '%';
    
    // Update color based on strength
    if (strength === 0) {
        strengthIndicator.classList.remove('bg-yellow-500', 'bg-green-500');
        strengthIndicator.classList.add('bg-red-500');
    } else if (strength < 3) {
        strengthIndicator.classList.remove('bg-red-500', 'bg-green-500');
        strengthIndicator.classList.add('bg-yellow-500');
    } else {
        strengthIndicator.classList.remove('bg-red-500', 'bg-yellow-500');
        strengthIndicator.classList.add('bg-green-500');
    }
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