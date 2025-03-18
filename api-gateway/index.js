const { ApolloServer, gql } = require('apollo-server');
const { authenticateToken } = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Define a local schema for the gateway
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type AuthResponse {
    token: String!
    refreshToken: String!
    user: User!
  }

  type RefreshTokenResponse {
    token: String!
    success: Boolean!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: String
  }

  type Query {
    gatewayHealth: String
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse
    login(email: String!, password: String!): AuthResponse
    refreshToken(refreshToken: String!): RefreshTokenResponse
    logout(refreshToken: String!): Boolean
    logoutAll: Boolean
  }
`;

// Create resolvers that forward requests to the user service
const resolvers = {
  Query: {
    gatewayHealth: () => "API Gateway is operational!",
    me: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const query = `
          query {
            me {
              id
              name
              email
              role
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.headers.authorization || ''
          },
          body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.me;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
      }
    }
  },
  Mutation: {
    register: async (_, { input }, context) => {
      try {
        const mutation = `
          mutation {
            register(input: {
              name: "${input.name}",
              email: "${input.email}",
              password: "${input.password}",
              role: ${input.role || 'client'}
            }) {
              token
              refreshToken
              user {
                id
                name
                email
                role
              }
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.register;
      } catch (error) {
        console.error('Error registering user:', error);
        throw new Error('Failed to register user');
      }
    },
    login: async (_, { email, password }, context) => {
      try {
        const mutation = `
          mutation {
            login(email: "${email}", password: "${password}") {
              token
              refreshToken
              user {
                id
                name
                email
                role
              }
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.login;
      } catch (error) {
        console.error('Error logging in:', error);
        throw new Error('Failed to login');
      }
    },
    refreshToken: async (_, { refreshToken }, context) => {
      try {
        const mutation = `
          mutation {
            refreshToken(refreshToken: "${refreshToken}") {
              token
              success
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.refreshToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh token');
      }
    },
    logout: async (_, { refreshToken }, context) => {
      try {
        const mutation = `
          mutation {
            logout(refreshToken: "${refreshToken}")
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.headers.authorization || ''
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.logout;
      } catch (error) {
        console.error('Error logging out:', error);
        throw new Error('Failed to logout');
      }
    },
    logoutAll: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const mutation = `
          mutation {
            logoutAll
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.headers.authorization || ''
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.logoutAll;
      } catch (error) {
        console.error('Error logging out from all devices:', error);
        throw new Error('Failed to logout from all devices');
      }
    }
  }
};

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
};

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get authenticated user from token
    const user = authenticateToken(req);
    
    return {
      user,
      headers: req.headers
    };
  },
  formatError: (err) => {
    // Log errors for debugging
    console.error('GraphQL Error:', err);
    
    // Return formatted error to client
    return {
      message: err.message,
      code: err.extensions?.code || 'SERVER_ERROR',
      path: err.path
    };
  },
  cors: corsOptions
});

// Start the server
server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 API Gateway ready with authentication at ${url}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
}).catch(err => {
  console.error('Error starting API Gateway:', err);
});
