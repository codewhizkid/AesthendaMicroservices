import { gql } from "apollo-server";

/**
 * GraphQL schema definition
 */
export const typeDefs = gql`
  enum AppointmentStatus {
    SCHEDULED
    CONFIRMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
    NO_SHOW
  }

  type Appointment {
    id: ID!
    tenantId: ID!
    userId: ID!
    stylistId: ID!
    serviceIds: [ID!]!
    date: String!
    startTime: String!
    endTime: String!
    duration: Int!
    status: AppointmentStatus!
    notes: String
    cancellationReason: String
    createdAt: String!
    updatedAt: String!
  }

  type AvailabilitySlot {
    stylistId: ID!
    date: String!
    startTime: String!
    endTime: String!
    available: Boolean!
  }

  input AppointmentInput {
    userId: ID!
    stylistId: ID!
    serviceIds: [ID!]!
    date: String!
    startTime: String!
    endTime: String!
    duration: Int!
    notes: String
  }

  input AppointmentUpdateInput {
    id: ID!
    stylistId: ID
    serviceIds: [ID!]
    date: String
    startTime: String
    endTime: String
    duration: Int
    status: AppointmentStatus
    notes: String
    cancellationReason: String
  }

  input AppointmentFilterInput {
    stylistId: ID
    userId: ID
    status: AppointmentStatus
    fromDate: String
    toDate: String
  }

  input CancelAppointmentInput {
    id: ID!
    cancellationReason: String
  }

  input AvailabilityInput {
    stylistId: ID!
    date: String!
  }

  type AppointmentResult {
    success: Boolean!
    message: String
    appointment: Appointment
  }

  type AppointmentsResult {
    appointments: [Appointment!]!
    totalCount: Int!
  }

  type AvailabilityResult {
    slots: [AvailabilitySlot!]!
    date: String!
    stylistId: ID!
  }

  type Query {
    # Get all appointments with optional filtering
    appointments(
      filter: AppointmentFilterInput
      page: Int
      limit: Int
    ): AppointmentsResult!

    # Get a single appointment by ID
    appointment(id: ID!): Appointment

    # Get all appointments for a user
    userAppointments(userId: ID!, status: AppointmentStatus): [Appointment!]!

    # Get all appointments for a stylist
    stylistAppointments(
      stylistId: ID!
      date: String
      status: AppointmentStatus
    ): [Appointment!]!

    # Get appointment availability for a stylist on a specific date
    stylistAvailability(input: AvailabilityInput!): AvailabilityResult!
  }

  type Mutation {
    # Create a new appointment
    createAppointment(input: AppointmentInput!): AppointmentResult!

    # Update an existing appointment
    updateAppointment(input: AppointmentUpdateInput!): AppointmentResult!

    # Cancel an appointment
    cancelAppointment(input: CancelAppointmentInput!): AppointmentResult!

    # Confirm an appointment
    confirmAppointment(id: ID!): AppointmentResult!

    # Mark an appointment as completed
    completeAppointment(id: ID!): AppointmentResult!

    # Mark an appointment as no-show
    markNoShow(id: ID!): AppointmentResult!
  }

  type Subscription {
    # Subscribe to appointment updates for a specific tenant
    appointmentUpdated: Appointment!
  }
`;

export default typeDefs;
