import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';

// Create an HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: process.env.REACT_APP_GRAPHQL_HTTP_URL || 'http://localhost:5002/graphql'
});

// Create a WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: process.env.REACT_APP_GRAPHQL_WS_URL || 'ws://localhost:5002/graphql',
  connectionParams: {
    // Add authentication token if available
    authToken: localStorage.getItem('token'),
  }
}));

// Add authentication headers to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Split links based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Configure the cache
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        appointments: {
          // Merge function for pagination
          keyArgs: ['tenantId', ['filter']],
          merge(existing = { edges: [], pageInfo: {} }, incoming) {
            return {
              ...incoming,
              edges: [...(existing.edges || []), ...incoming.edges],
              pageInfo: incoming.pageInfo
            };
          }
        }
      }
    }
  }
});

// Create the Apollo Client instance
const client = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    }
  }
});

export default client;