const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');
const amqp = require('amqplib');

// MongoDB Connection
mongoose.connect('mongodb://mongo-appointment:27017/appointmentdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// RabbitMQ Connection (for notifications)
let channel;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://rabbitmq:5672');
    channel = await connection.createChannel();
    await channel.assertQueue('appointment_notifications');
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
  }
}
connectRabbitMQ();

// Define GraphQL Schema
const typeDefs = gql`
  type Appointment {
    id: ID!
    userId: ID!
    serviceType: String!
    date: String!
    time: String!
    status: String!
  }

  type Query {
    appointments: [Appointment]
    appointment(id: ID!): Appointment
    userAppointments(userId: ID!): [Appointment]
  }

  type Mutation {
    createAppointment(userId: ID!, serviceType: String!, date: String!, time: String!): Appointment
    updateAppointmentStatus(id: ID!, status: String!): Appointment
    cancelAppointment(id: ID!): Appointment
  }
`;

// Resolvers
const resolvers = {
  Query: {
    appointments: () => [], // Placeholder
    appointment: (_, { id }) => null, // Placeholder
    userAppointments: (_, { userId }) => [] // Placeholder
  },
  Mutation: {
    createAppointment: (_, args) => {
      // Placeholder - would create the appointment and then notify
      if (channel) {
        channel.sendToQueue('appointment_notifications', Buffer.from(JSON.stringify({
          type: 'NEW_APPOINTMENT',
          data: { ...args }
        })));
      }
      return null;
    },
    updateAppointmentStatus: (_, args) => null, // Placeholder
    cancelAppointment: (_, args) => null // Placeholder
  }
};

// Initialize Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server
server.listen({ port: 5002 }).then(({ url }) => {
  console.log(`🚀 Appointment Service ready at ${url}`);
});
