const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');
const typeDefs = require('./schema/typeDefs');
const authResolvers = require('./resolvers/authResolvers');
const userResolvers = require('./resolvers/userResolvers');
const salonResolvers = require('./resolvers/salonResolvers');
const roleResolvers = require('./resolvers/roleResolvers');
const { getUser } = require('./middleware/authMiddleware');
const { applyTenantIsolation, createApolloContext } = require('./middleware/tenantMiddleware');

// Import all models to ensure they're registered before applying tenant isolation
require('./models/User');
require('./models/Salon');
require('./models/Role');
require('./models/PendingSalon');

// MongoDB Connection
mongoose.connect('mongodb://mongo-user:27017/userdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected');
  
  // Apply tenant isolation to relevant models
  applyTenantIsolation();
})
.catch(err => console.log('MongoDB Connection Error:', err));

// Merge resolvers
const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...salonResolvers.Query,
    ...roleResolvers.Query
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...salonResolvers.Mutation,
    ...roleResolvers.Mutation
  }
};

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get user and tenant context from JWT token
    const contextData = createApolloContext()({ req });
    
    return {
      ...contextData,
      // For backward compatibility
      user: contextData.user
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
  }
});

// Start the server
server.listen({ port: 5001 }).then(({ url }) => {
  console.log(`🚀 User Service ready with multi-tenant authentication at ${url}`);
});
