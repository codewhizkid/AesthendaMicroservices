// Use standard graphql from dependencies
export const typeDefs = `
  """
  User role in the system
  """
  enum UserRole {
    ADMIN
    STYLIST
    CLIENT
    RECEPTIONIST
    SYSTEM
  }

  """
  Common fields for all types
  """
  interface Node {
    id: ID!
    createdAt: String!
    updatedAt: String!
  }

  """
  Pagination information
  """
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalCount: Int!
  }

  """
  User profile information
  """
  type User implements Node {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    isActive: Boolean!
    lastLogin: String
    createdAt: String!
    updatedAt: String!
  }

  """
  Paginated users result
  """
  type UsersConnection {
    edges: [User!]!
    pageInfo: PageInfo!
  }

  """
  Input for pagination
  """
  input PaginationInput {
    page: Int = 1
    limit: Int = 20
  }

  """
  Input for creating a user
  """
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: UserRole = CLIENT
  }

  """
  Input for updating a user
  """
  input UpdateUserInput {
    name: String
    email: String
    password: String
    role: UserRole
    isActive: Boolean
  }

  type Query {
    """
    Get the currently authenticated user
    """
    me: User!

    """
    Get a user by ID
    """
    user(id: ID!): User

    """
    List users with pagination
    """
    users(pagination: PaginationInput): UsersConnection!
  }

  type Mutation {
    """
    Create a new user
    """
    createUser(input: CreateUserInput!): User!

    """
    Update an existing user
    """
    updateUser(id: ID!, input: UpdateUserInput!): User!

    """
    Delete a user
    """
    deleteUser(id: ID!): Boolean!
  }
`; 