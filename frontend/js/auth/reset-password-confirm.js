// Password reset confirmation handling
import { executeQuery } from '../../graphql-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const successState = document.getElementById('successState');
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Reset token is missing. Please check your email link.');
        return;
    }
    
    // Verify token validity
    verifyResetToken(token);
    
    // Handle password strength meter
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordStrength);
    }
    
    // Handle form submission
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();
        
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        
        try {
            // Validate inputs
            if (!password || !passwordConfirm) {
                showAlert('Please fill in all required fields', 'error');
                return;
            }
            
            if (password.length < 8) {
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }
            
            if (password !== passwordConfirm) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = document.getElementById('resetButton');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting password...
            `;
            
            // Execute reset password mutation
            const resetPasswordMutation = `
                mutation ResetPassword($token: String!, $newPassword: String!) {
                    resetPassword(token: $token, newPassword: $newPassword) {
                        success
                        message
                    }
                }
            `;
            
            const response = await executeQuery(resetPasswordMutation, { 
                token, 
                newPassword: password 
            });
            
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            if (response.errors) {
                throw new Error(response.errors[0].message || 'Password reset failed');
            }
            
            if (response.data.resetPassword.success) {
                // Show success state
                resetPasswordForm.classList.add('hidden');
                successState.classList.remove('hidden');
            } else {
                showAlert(response.data.resetPassword.message || 'Password reset failed', 'error');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            showAlert(error.message || 'An unexpected error occurred', 'error');
        }
    });
});

async function verifyResetToken(token) {
    try {
        const verifyTokenQuery = `
            query VerifyResetToken($token: String!) {
                verifyResetToken(token: $token) {
                    valid
                    message
                }
            }
        `;
        
        const response = await executeQuery(verifyTokenQuery, { token });
        
        if (response.errors) {
            throw new Error(response.errors[0].message || 'Invalid reset token');
        }
        
        if (response.data.verifyResetToken.valid) {
            // Token is valid, show reset form
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('resetPasswordForm').classList.remove('hidden');
        } else {
            throw new Error(response.data.verifyResetToken.message || 'Invalid reset token');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        showError(error.message || 'This password reset link is invalid or has expired');
    }
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

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('resetPasswordForm').classList.add('hidden');
    
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
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