// Apollo Client configuration
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, fromPromise } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { gql } from '@apollo/client';

// API Gateway URL from environment or default
const API_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000/graphql';

// Create the http link to our GraphQL API
const httpLink = createHttpLink({
  uri: API_URL,
  credentials: 'include'
});

// Function to get the access token from storage
const getAccessToken = () => {
  // Try localStorage first, then sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
};

// Function to get the refresh token from storage
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || '';
};

// Function to handle token refresh
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    // Use fetch directly to avoid circular dependencies
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              token
              success
            }
          }
        `,
        variables: { refreshToken }
      })
    });
    
    const result = await response.json();
    
    if (result.data?.refreshToken?.success) {
      // Store the new token in the same storage that had the previous token
      if (localStorage.getItem('token')) {
        localStorage.setItem('token', result.data.refreshToken.token);
      } else if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('token', result.data.refreshToken.token);
      }
      
      return result.data.refreshToken.token;
    }
    
    // If refresh failed, clear tokens and return null
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Auth link middleware to add the token to requests
const authLink = new ApolloLink((operation, forward) => {
  // Get the authentication token
  const token = getAccessToken();
  
  // Add the authorization header to the operation
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }));

  return forward(operation);
});

// Error handling link with token refresh functionality
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    // Look for authentication errors
    const authError = graphQLErrors.find(
      error => error.extensions?.code === 'UNAUTHENTICATED' || 
               error.message.toLowerCase().includes('not authenticated') ||
               error.message.toLowerCase().includes('jwt expired')
    );
    
    if (authError) {
      // Return a promise that will retry the request with a new token
      return fromPromise(
        refreshAccessToken().then(newToken => {
          if (!newToken) {
            // Redirect to login if refresh failed
            window.location.href = '/login';
            return;
          }
          
          // Retry the operation with the new token
          const oldHeaders = operation.getContext().headers;
          operation.setContext({
            headers: {
              ...oldHeaders,
              authorization: `Bearer ${newToken}`,
            },
          });
          
          // Retry the request
          return forward(operation);
        })
      ).flatMap(() => forward(operation));
    }
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    // You can handle network errors here, e.g., show a toast message
  }
});

// Role normalization middleware to ensure roles are always lowercase
const roleNormalizationLink = new ApolloLink((operation, forward) => {
  const { variables } = operation;
  
  // Check if variables contain role fields and normalize them
  if (variables) {
    // For register mutation
    if (variables.input && variables.input.role) {
      variables.input.role = variables.input.role.toLowerCase();
    }
    
    // For updateUserRole mutation
    if (variables.role) {
      variables.role = variables.role.toLowerCase();
    }
  }
  
  return forward(operation);
});

// Create the Apollo Client
const client = new ApolloClient({
  link: roleNormalizationLink.concat(authLink.concat(errorLink.concat(httpLink))),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Standardized error response structure
const formatErrorResponse = (error) => {
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return {
      errors: error.graphQLErrors.map(e => ({
        message: e.message,
        code: e.extensions?.code || 'ERROR'
      })),
      success: false
    };
  }
  
  if (error.networkError) {
    return {
      errors: [{
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      }],
      success: false
    };
  }
  
  return {
    errors: [{
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    }],
    success: false
  };
};

// GraphQL API helpers with standardized error handling
export const executeQuery = async (query, variables = {}) => {
  try {
    const { data, errors } = await client.query({
      query: gql`${query}`,
      variables,
      fetchPolicy: 'network-only' // Ensure fresh data
    });
    
    if (errors && errors.length > 0) {
      return {
        errors: errors.map(e => ({
          message: e.message,
          code: e.extensions?.code || 'QUERY_ERROR'
        })),
        success: false
      };
    }
    
    return { data, success: true };
  } catch (error) {
    console.error('Query error:', error);
    return formatErrorResponse(error);
  }
};

export const executeMutation = async (mutation, variables = {}) => {
  try {
    const { data, errors } = await client.mutate({
      mutation: gql`${mutation}`,
      variables
    });
    
    if (errors && errors.length > 0) {
      return {
        errors: errors.map(e => ({
          message: e.message,
          code: e.extensions?.code || 'MUTATION_ERROR'
        })),
        success: false
      };
    }
    
    return { data, success: true };
  } catch (error) {
    console.error('Mutation error:', error);
    return formatErrorResponse(error);
  }
};

// Check authentication status
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// Logout helper
export const logout = async () => {
  const refreshToken = getRefreshToken();
  
  if (refreshToken) {
    try {
      // Call the logout mutation
      await executeMutation(`
        mutation Logout($refreshToken: String!) {
          logout(refreshToken: $refreshToken)
        }
      `, { refreshToken });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
  
  // Always clear tokens regardless of API success
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  
  // Clear user data
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // Optionally reset Apollo cache
  client.resetStore();
};

export { client, gql };