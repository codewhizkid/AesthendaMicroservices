const { ApolloServer, gql } = require('apollo-server');

// Define a simple schema
const typeDefs = gql`
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
  typeDefs,
  resolvers
});

// Start the server
server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 API Gateway ready at ${url}`);
});
