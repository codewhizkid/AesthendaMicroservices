import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents($filter: CalendarViewFilter, $pagination: PaginationInput) {
    events(filter: $filter, pagination: $pagination) {
      edges {
        id
        title
        startTime
        endTime
        status
        allDay
        tenantId
        location
        description
        metadata
      }
      pageInfo {
        currentPage
        totalPages
        totalItems
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      startTime
      endTime
      status
      allDay
      tenantId
      location
      description
      metadata
    }
  }
`;

export const GET_RESOURCES = gql`
  query GetResources($type: String, $pagination: PaginationInput) {
    resources(type: $type, pagination: $pagination) {
      edges {
        id
        title
        type
        description
        availability {
          dayOfWeek
          startTime
          endTime
        }
        metadata
      }
      pageInfo {
        currentPage
        totalPages
        totalItems
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_RESOURCE = gql`
  query GetResource($id: ID!) {
    resource(id: $id) {
      id
      title
      type
      description
      availability {
        dayOfWeek
        startTime
        endTime
      }
      metadata
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: EventInput!) {
    createEvent(input: $input) {
      id
      title
      startTime
      endTime
      status
      allDay
      description
      location
      metadata
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: EventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      startTime
      endTime
      status
      allDay
      description
      location
      metadata
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

export const BATCH_UPDATE_EVENT_STATUS = gql`
  mutation BatchUpdateEventStatus($ids: [ID!]!, $status: EventStatus!) {
    batchUpdateEventStatus(ids: $ids, status: $status) {
      id
      status
    }
  }
`;

export const CREATE_RESOURCE = gql`
  mutation CreateResource($input: ResourceInput!) {
    createResource(input: $input) {
      id
      title
      type
      description
      availability {
        dayOfWeek
        startTime
        endTime
      }
      metadata
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation UpdateResource($id: ID!, $input: ResourceInput!) {
    updateResource(id: $id, input: $input) {
      id
      title
      type
      description
      availability {
        dayOfWeek
        startTime
        endTime
      }
      metadata
    }
  }
`;

export const DELETE_RESOURCE = gql`
  mutation DeleteResource($id: ID!) {
    deleteResource(id: $id)
  }
`;

export const EVENT_UPDATED = gql`
  subscription EventUpdated($tenantId: String!) {
    eventUpdated(tenantId: $tenantId) {
      id
      title
      startTime
      endTime
      status
      allDay
      description
      location
      metadata
    }
  }
`;

export const RESOURCE_UPDATED = gql`
  subscription ResourceUpdated($tenantId: String!) {
    resourceUpdated(tenantId: $tenantId) {
      id
      title
      type
      description
      availability {
        dayOfWeek
        startTime
        endTime
      }
      metadata
    }
  }
`;