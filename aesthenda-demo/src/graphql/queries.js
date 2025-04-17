import { gql } from '@apollo/client';

// Get tenant information by ID
export const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      id
      businessName
      description
      phone
      email
      address {
        street
        city
        state
        zip
        country
      }
      settings {
        branding {
          primaryColor
          logoUrl
          fontFamily
        }
        businessHours {
          monday {
            open
            close
          }
          tuesday {
            open
            close
          }
          wednesday {
            open
            close
          }
          thursday {
            open
            close
          }
          friday {
            open
            close
          }
          saturday {
            open
            close
          }
          sunday {
            open
            close
          }
        }
      }
    }
  }
`;

// Get available time slots for booking
export const GET_AVAILABLE_SLOTS = gql`
  query GetAvailableSlots($tenantId: ID!, $date: String!, $duration: Int!, $serviceIds: [ID!]) {
    availableTimeSlots(
      tenantId: $tenantId,
      date: $date,
      duration: $duration,
      serviceIds: $serviceIds
    ) {
      time
      available
      stylistId
      stylistName
    }
  }
`;

// Get available stylists for booking
export const GET_AVAILABLE_STYLISTS = gql`
  query GetAvailableStylists($tenantId: ID!, $date: String!, $time: String!, $serviceIds: [ID!]) {
    availableStylists(
      tenantId: $tenantId,
      date: $date,
      time: $time,
      serviceIds: $serviceIds
    ) {
      id
      firstName
      lastName
      profileImage
      specialties
      bio
      rating
      reviews {
        id
        rating
        comment
      }
    }
  }
`;

// Other queries can be added here as needed 