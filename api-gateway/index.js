const { ApolloServer } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

// Define a simple schema
const typeDefs = `
  type Query {
    gatewayHealth: String
  }
`;

// Resolvers
const resolvers = {
  Query: {
    gatewayHealth: () => "API Gateway is operational!"
  }
};

// Initialize Apollo Server
const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  context: ({ req }) => {
    return { headers: req.headers };
  }
});

// Start the server
server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 API Gateway ready at ${url}`);
});
