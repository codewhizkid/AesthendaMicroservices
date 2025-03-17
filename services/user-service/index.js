const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('mongodb://mongo-user:27017/userdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Define GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type Query {
    users: [User]
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!, role: String!): User
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: () => [], // Placeholder
    user: (_, { id }) => null // Placeholder
  },
  Mutation: {
    createUser: (_, args) => null // Placeholder
  }
};

// Initialize Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server
server.listen({ port: 5001 }).then(({ url }) => {
  console.log(`🚀 User Service ready at ${url}`);
});
