// Email verification handling
import { executeQuery } from '../../graphql-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get verification token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Verification token is missing. Please check your email link.');
        return;
    }
    
    verifyEmail(token);
});

async function verifyEmail(token) {
    try {
        const verifyEmailMutation = `
            mutation VerifyEmail($token: String!) {
                verifyEmail(token: $token) {
                    success
                    message
                }
            }
        `;
        
        const response = await executeQuery(verifyEmailMutation, { token });
        
        if (response.errors) {
            throw new Error(response.errors[0].message || 'Email verification failed');
        }
        
        if (response.data.verifyEmail.success) {
            showSuccess();
        } else {
            showError(response.data.verifyEmail.message || 'Email verification failed');
        }
    } catch (error) {
        console.error('Email verification error:', error);
        showError(error.message || 'An unexpected error occurred during verification');
    }
}

function showSuccess() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('successState').classList.remove('hidden');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('successState').classList.add('hidden');
    
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
    
    // Set up resend verification button
    const resendBtn = document.getElementById('resendVerificationBtn');
    resendBtn.addEventListener('click', handleResendVerification);
}

async function handleResendVerification() {
    const resendBtn = document.getElementById('resendVerificationBtn');
    resendBtn.disabled = true;
    resendBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Sending...
    `;
    
    try {
        // Get the email from localStorage if available
        const storedEmail = localStorage.getItem('userEmail');
        
        if (!storedEmail) {
            throw new Error('Email address not found. Please return to login and try again.');
        }
        
        const resendVerificationMutation = `
            mutation ResendVerification($email: String!) {
                resendVerificationEmail(email: $email) {
                    success
                    message
                }
            }
        `;
        
        const response = await executeQuery(resendVerificationMutation, { email: storedEmail });
        
        if (response.errors) {
            throw new Error(response.errors[0].message || 'Failed to resend verification email');
        }
        
        if (response.data.resendVerificationEmail.success) {
            document.getElementById('errorMessage').textContent = 'Verification email sent! Please check your inbox.';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Resend Verification Email';
            }, 3000);
        } else {
            throw new Error(response.data.resendVerificationEmail.message);
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        document.getElementById('errorMessage').textContent = error.message || 'Failed to resend verification email';
        
        // Reset button
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Verification Email';
    }
}