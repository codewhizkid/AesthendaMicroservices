// Import Apollo Client
import { client, gql, executeQuery, executeMutation } from './graphql-client.js';

// Application state
const appState = {
  loading: false,
  error: null,
  data: null,
  user: JSON.parse(localStorage.getItem('user') || 'null')
};

// DOM Elements references
const elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  elements.queryInput = document.getElementById('queryInput');
  elements.responseOutput = document.getElementById('response');
  elements.executeButton = document.getElementById('executeButton');
  elements.loginStatus = document.getElementById('loginStatus');
  elements.userInfo = document.getElementById('userInfo');
  
  // Add event listeners
  document.querySelectorAll('[data-query]').forEach(button => {
    button.addEventListener('click', () => loadSampleQuery(button.dataset.query));
  });
  
  if (elements.executeButton) {
    elements.executeButton.addEventListener('click', handleExecuteQuery);
  }
  
  // Update UI based on current state
  updateUI();
});

// Load a sample query
function loadSampleQuery(queryName) {
  const sampleQueries = {
    health: `{
  gatewayHealth
}`,
    introspection: `{
  __schema {
    types {
      name
      kind
      description
    }
  }
}`,
    appointment: `mutation {
  createAppointment(
    userId: "1", 
    serviceType: "Haircut", 
    date: "2025-04-01", 
    time: "10:00"
  ) {
    id
    userId
    serviceType
    date
    time
    status
  }
}`,
    me: `{
  me {
    id
    name
    email
    role
  }
}`
  };
  
  if (elements.queryInput && sampleQueries[queryName]) {
    elements.queryInput.value = sampleQueries[queryName];
  }
}

// Execute the current query
async function handleExecuteQuery() {
  if (!elements.queryInput || !elements.responseOutput) return;
  
  const query = elements.queryInput.value.trim();
  if (!query) return;
  
  try {
    // Update state
    appState.loading = true;
    appState.error = null;
    updateUI();
    
    // Determine if this is a query or mutation
    const isMutation = query.trim().toLowerCase().startsWith('mutation');
    
    // Execute the operation
    const result = isMutation 
      ? await executeMutation(query)
      : await executeQuery(query);
    
    // Update state with result
    appState.loading = false;
    if (result.success) {
      appState.data = result.data;
    } else {
      appState.error = result.error;
    }
  } catch (error) {
    // Handle errors
    appState.loading = false;
    appState.error = error.message;
  }
  
  // Update UI with new state
  updateUI();
}

// Update the UI based on current state
function updateUI() {
  // Update response area
  if (elements.responseOutput) {
    if (appState.loading) {
      elements.responseOutput.textContent = 'Loading...';
      elements.responseOutput.className = 'animate-pulse bg-gray-100 p-4 rounded text-sm';
    } else if (appState.error) {
      elements.responseOutput.textContent = `Error: ${appState.error}`;
      elements.responseOutput.className = 'bg-red-50 text-red-600 p-4 rounded text-sm';
    } else if (appState.data) {
      elements.responseOutput.textContent = JSON.stringify(appState.data, null, 2);
      elements.responseOutput.className = 'bg-gray-100 p-4 rounded text-sm';
    }
  }
  
  // Update login status if element exists
  if (elements.loginStatus) {
    if (appState.user) {
      elements.loginStatus.textContent = `Logged in as ${appState.user.name}`;
      elements.loginStatus.className = 'text-green-600 font-medium';
    } else {
      elements.loginStatus.textContent = 'Not logged in';
      elements.loginStatus.className = 'text-gray-500';
    }
  }
  
  // Update user info area if element exists
  if (elements.userInfo && appState.user) {
    elements.userInfo.innerHTML = `
      <div class="p-4 border border-green-200 rounded bg-green-50">
        <h3 class="font-medium text-green-800">User Profile</h3>
        <p class="text-sm text-green-700">Name: ${appState.user.name}</p>
        <p class="text-sm text-green-700">Email: ${appState.user.email}</p>
        <p class="text-sm text-green-700">Role: ${appState.user.role}</p>
      </div>
    `;
  } else if (elements.userInfo) {
    elements.userInfo.innerHTML = `
      <div class="p-4 border border-gray-200 rounded bg-gray-50">
        <p class="text-sm text-gray-500">You are not logged in.</p>
      </div>
    `;
  }
}

// Export functions for global use
window.loadSampleQuery = loadSampleQuery;
window.executeQuery = handleExecuteQuery;