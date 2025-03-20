// Apollo Client configuration
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { gql } from '@apollo/client';

// Create the http link to our GraphQL API
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include'
});

// Auth link middleware to add the token to requests
const authLink = new ApolloLink((operation, forward) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('accessToken');
  
  // Add the authorization header to the operation
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }));

  return forward(operation);
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
  link: roleNormalizationLink.concat(authLink.concat(httpLink)),
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

// GraphQL API helpers
export const executeQuery = async (query, variables = {}) => {
  try {
    const { data, errors } = await client.query({
      query: gql`${query}`,
      variables
    });
    
    if (errors) {
      throw new Error(errors[0].message);
    }
    
    return { data, success: true };
  } catch (error) {
    return { 
      error: error.message, 
      success: false 
    };
  }
};

export const executeMutation = async (mutation, variables = {}) => {
  try {
    const { data, errors } = await client.mutate({
      mutation: gql`${mutation}`,
      variables
    });
    
    if (errors) {
      throw new Error(errors[0].message);
    }
    
    return { data, success: true };
  } catch (error) {
    return { 
      error: error.message, 
      success: false 
    };
  }
};

export { client, gql };