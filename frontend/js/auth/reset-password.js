// Password reset handling
import { executeQuery } from '../../graphql-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('resetForm');
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    const successContainer = document.getElementById('successContainer');

    // Handle form submission
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();

        const email = document.getElementById('email').value.trim();

        try {
            // Validate input
            if (!email) {
                showAlert('Please enter your email address', 'error');
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
                Sending...
            `;

            // Execute password reset mutation
            const resetPasswordMutation = `
                mutation ResetPassword($email: String!) {
                    requestPasswordReset(email: $email) {
                        success
                        message
                    }
                }
            `;

            const response = await executeQuery(resetPasswordMutation, { email });

            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;

            if (response.errors) {
                throw new Error(response.errors[0].message || 'Password reset request failed');
            }

            if (response.data.requestPasswordReset.success) {
                // Show success message
                resetForm.classList.add('hidden');
                successContainer.classList.remove('hidden');
                
                // Store email for reference
                localStorage.setItem('resetEmail', email);
            } else {
                showAlert(response.data.requestPasswordReset.message || 'Password reset request failed', 'error');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            showAlert(error.message || 'An unexpected error occurred', 'error');
        }
    });
});

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