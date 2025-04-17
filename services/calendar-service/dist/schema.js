"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `#graphql
  """
  DateTime scalar for handling dates and times in ISO 8601 format
  """
  scalar DateTime

  """
  JSON scalar for handling arbitrary metadata
  """
  scalar JSON

  """
  Event represents a calendar event within a specific tenant's context.
  Events can be one-time or recurring, and may involve multiple attendees.
  """
  type Event {
    """
    Unique identifier for the event
    """
    id: ID!

    """
    Title or name of the event
    """
    title: String!

    """
    Optional detailed description of the event
    """
    description: String

    """
    Start time of the event in ISO 8601 format
    """
    startTime: DateTime!

    """
    End time of the event in ISO 8601 format
    """
    endTime: DateTime!

    """
    Indicates if the event is an all-day event
    """
    allDay: Boolean!

    """
    Optional iCal-format recurring rule for repeating events
    """
    recurringRule: String

    """
    Tenant identifier for multi-tenancy support
    """
    tenantId: String!

    """
    ID of the user who created the event
    """
    createdBy: String!

    """
    Optional list of attendee IDs
    """
    attendees: [String!]

    """
    Optional location information for the event
    """
    location: String

    """
    Current status of the event
    """
    status: EventStatus!

    """
    Optional metadata for storing additional event information
    """
    metadata: JSON

    """
    Timestamp when the event was created
    """
    createdAt: DateTime!

    """
    Timestamp when the event was last updated
    """
    updatedAt: DateTime!
  }

  """
  Resource represents a bookable entity (room, equipment, etc.) within a tenant's context
  """
  type Resource {
    """
    Unique identifier for the resource
    """
    id: ID!

    """
    Name or title of the resource
    """
    title: String!

    """
    Type of resource (e.g., 'ROOM', 'EQUIPMENT')
    """
    type: String!

    """
    Optional detailed description of the resource
    """
    description: String

    """
    Tenant identifier for multi-tenancy support
    """
    tenantId: String!

    """
    Weekly availability schedule for the resource
    """
    availability: [Availability!]!

    """
    Optional metadata for storing additional resource information
    """
    metadata: JSON

    """
    Timestamp when the resource was created
    """
    createdAt: DateTime!

    """
    Timestamp when the resource was last updated
    """
    updatedAt: DateTime!
  }

  """
  Represents a time slot in a resource's weekly availability
  """
  type Availability {
    """
    Day of week (0-6, where 0 is Sunday)
    """
    dayOfWeek: Int!

    """
    Start time in 24-hour format (HH:mm)
    """
    startTime: String!

    """
    End time in 24-hour format (HH:mm)
    """
    endTime: String!
  }

  """
  Pagination information for list queries
  """
  type PageInfo {
    """
    Current page number
    """
    currentPage: Int!

    """
    Total number of pages available
    """
    totalPages: Int!

    """
    Total number of items across all pages
    """
    totalItems: Int!

    """
    Number of items per page
    """
    itemsPerPage: Int!

    """
    Whether there is a next page available
    """
    hasNextPage: Boolean!

    """
    Whether there is a previous page available
    """
    hasPreviousPage: Boolean!
  }

  """
  Connection type for paginated events
  """
  type EventConnection {
    """
    List of events for the current page
    """
    edges: [Event!]!

    """
    Pagination information
    """
    pageInfo: PageInfo!
  }

  """
  Connection type for paginated resources
  """
  type ResourceConnection {
    """
    List of resources for the current page
    """
    edges: [Resource!]!

    """
    Pagination information
    """
    pageInfo: PageInfo!
  }

  """
  Status options for an event
  """
  enum EventStatus {
    """
    Event is confirmed and will take place
    """
    CONFIRMED

    """
    Event is tentatively scheduled
    """
    TENTATIVE

    """
    Event has been cancelled
    """
    CANCELLED
  }

  """
  Input for creating or updating an event
  """
  input EventInput {
    """
    Title or name of the event
    """
    title: String!

    """
    Optional detailed description
    """
    description: String

    """
    Start time in ISO 8601 format
    """
    startTime: DateTime!

    """
    End time in ISO 8601 format
    """
    endTime: DateTime!

    """
    Whether this is an all-day event
    """
    allDay: Boolean

    """
    Optional iCal-format recurring rule
    """
    recurringRule: String

    """
    Optional list of attendee IDs
    """
    attendees: [String!]

    """
    Optional location information
    """
    location: String

    """
    Event status
    """
    status: EventStatus

    """
    Optional additional metadata
    """
    metadata: JSON
  }

  """
  Input for creating or updating a resource
  """
  input ResourceInput {
    """
    Name or title of the resource
    """
    title: String!

    """
    Type of resource
    """
    type: String!

    """
    Optional detailed description
    """
    description: String

    """
    Weekly availability schedule
    """
    availability: [AvailabilityInput!]!

    """
    Optional additional metadata
    """
    metadata: JSON
  }

  """
  Input for specifying a time slot in resource availability
  """
  input AvailabilityInput {
    """
    Day of week (0-6, where 0 is Sunday)
    """
    dayOfWeek: Int!

    """
    Start time in 24-hour format (HH:mm)
    """
    startTime: String!

    """
    End time in 24-hour format (HH:mm)
    """
    endTime: String!
  }

  """
  Input for pagination parameters
  """
  input PaginationInput {
    """
    Page number (1-based)
    """
    page: Int = 1

    """
    Number of items per page
    """
    limit: Int = 20
  }

  """
  Input for filtering events in a calendar view
  """
  input CalendarViewFilter {
    """
    Start date for the view range
    """
    startDate: DateTime!

    """
    End date for the view range
    """
    endDate: DateTime!

    """
    Optional status filter
    """
    status: EventStatus

    """
    Optional resource ID filter
    """
    resourceId: ID
  }

  type Query {
    """
    Get a list of events with optional filtering and pagination
    """
    events(filter: CalendarViewFilter, pagination: PaginationInput): EventConnection!
    
    """
    Get a single event by ID
    """
    event(id: ID!): Event

    """
    Get a list of resources with optional filtering and pagination
    """
    resources(type: String, pagination: PaginationInput): ResourceConnection!

    """
    Get a single resource by ID
    """
    resource(id: ID!): Resource
  }

  type Mutation {
    """
    Create a new event
    """
    createEvent(input: EventInput!): Event!

    """
    Update an existing event
    """
    updateEvent(id: ID!, input: EventInput!): Event!

    """
    Delete an event
    """
    deleteEvent(id: ID!): Boolean!

    """
    Create a new resource
    """
    createResource(input: ResourceInput!): Resource!

    """
    Update an existing resource
    """
    updateResource(id: ID!, input: ResourceInput!): Resource!

    """
    Delete a resource
    """
    deleteResource(id: ID!): Boolean!

    """
    Batch update event statuses
    """
    batchUpdateEventStatus(ids: [ID!]!, status: EventStatus!): [Event!]!
  }

  type Subscription {
    """
    Subscribe to event updates within a tenant
    """
    eventUpdated(tenantId: String!): Event!

    """
    Subscribe to resource updates within a tenant
    """
    resourceUpdated(tenantId: String!): Resource!
  }
`;
//# sourceMappingURL=schema.js.map