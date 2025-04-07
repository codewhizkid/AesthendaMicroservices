import { gql } from '@apollo/client';

// Fragment for appointment fields
export const APPOINTMENT_FIELDS = gql`
  fragment AppointmentFields on Appointment {
    id
    date
    startTime
    duration
    totalPrice
    status
    notes
    client {
      id
      firstName
      lastName
      email
      phone
    }
    stylist {
      id
      firstName
      lastName
    }
    services {
      id
      name
      price
      duration
    }
    cancellationReason
    cancellationDate
    createdAt
    updatedAt
  }
`;

// Query to fetch appointments
export const GET_APPOINTMENTS = gql`
  query GetAppointments(
    $tenantId: ID!
    $first: Int
    $after: String
    $filter: AppointmentFilter
  ) {
    appointments(
      tenantId: $tenantId
      first: $first
      after: $after
      filter: $filter
    ) {
      edges {
        node {
          ...AppointmentFields
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Query to fetch a single appointment
export const GET_APPOINTMENT = gql`
  query GetAppointment($id: ID!) {
    appointment(id: $id) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Query to fetch available time slots
export const GET_AVAILABLE_TIME_SLOTS = gql`
  query GetAvailableTimeSlots(
    $tenantId: ID!
    $date: String!
    $serviceIds: [ID!]!
    $stylistId: ID
  ) {
    availableTimeSlots(
      tenantId: $tenantId
      date: $date
      serviceIds: $serviceIds
      stylistId: $stylistId
    )
  }
`;

// Query to fetch services
export const GET_SERVICES = gql`
  query GetServices($tenantId: ID!) {
    services(tenantId: $tenantId) {
      id
      name
      description
      duration
      price
    }
  }
`;

// Query to fetch stylists
export const GET_STYLISTS = gql`
  query GetStylists($tenantId: ID!) {
    stylists(tenantId: $tenantId) {
      id
      firstName
      lastName
      specialties
      availability {
        dayOfWeek
        startTime
        endTime
      }
    }
  }
`;

// Mutation to create an appointment
export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($tenantId: ID!, $input: AppointmentInput!) {
    createAppointment(tenantId: $tenantId, input: $input) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Mutation to update an appointment
export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: ID!, $input: AppointmentUpdateInput!) {
    updateAppointment(id: $id, input: $input) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Mutation to cancel an appointment
export const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: ID!, $reason: String) {
    cancelAppointment(id: $id, reason: $reason) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Subscription for appointment updates
export const APPOINTMENT_UPDATED = gql`
  subscription OnAppointmentUpdated($tenantId: ID!) {
    appointmentUpdated(tenantId: $tenantId) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Subscription for new appointments
export const APPOINTMENT_CREATED = gql`
  subscription OnAppointmentCreated($tenantId: ID!) {
    appointmentCreated(tenantId: $tenantId) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;

// Subscription for cancelled appointments
export const APPOINTMENT_CANCELLED = gql`
  subscription OnAppointmentCancelled($tenantId: ID!) {
    appointmentCancelled(tenantId: $tenantId) {
      ...AppointmentFields
    }
  }
  ${APPOINTMENT_FIELDS}
`;