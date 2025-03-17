const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');

mongoose.connect('mongodb://mongo-user:27017/userdb', { useNewUrlParser: true, useUnifiedTopology: true });

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }
  type Query {
    users: [User]
  }
`;

const resolvers = {
  Query: {
    users: () => [{ id: 1, name: 'John Doe', email: 'john@example.com' }],
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(5001).then(({ url }) => {
  console.log(`🚀 User Service running at ${url}`);
});
