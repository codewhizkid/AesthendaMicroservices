const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');

mongoose.connect('mongodb://mongo-appointment:27017/appointmentdb', { useNewUrlParser: true, useUnifiedTopology: true });

const typeDefs = gql`
  type Appointment {
    id: ID!
    clientName: String!
    stylistName: String!
    time: String!
  }
  type Query {
    appointments: [Appointment]
  }
`;

const resolvers = {
  Query: {
    appointments: () => [{ id: 1, clientName: 'Alice', stylistName: 'Bob', time: '10:00 AM' }],
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen(5002).then(({ url }) => {
  console.log(`🚀 Appointment Service running at ${url}`);
});
