const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');
const typeDefs = require('./schema/typeDefs');
const authResolvers = require('./resolvers/authResolvers');
const userResolvers = require('./resolvers/userResolvers');
const { getUser } = require('./middleware/authMiddleware');

// MongoDB Connection
mongoose.connect('mongodb://mongo-user:27017/userdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Merge resolvers
const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation
  }
};

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get user from JWT token in request headers
    const user = getUser(req);
    
    return { user };
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
  console.log(`🚀 User Service ready with authentication at ${url}`);
});
