const { gql } = require('apollo-server');

const typeDefs = gql`
  """
  User type with basic profile information
  """
  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    createdAt: String
  }

  """
  Available user roles in the system
  """
  enum Role {
    client
    stylist
    admin
  }

  """
  Authentication response with token and user info
  """
  type AuthResponse {
    token: String!
    refreshToken: String!
    user: User!
  }

  """
  Token refresh response
  """
  type RefreshTokenResponse {
    token: String!
    success: Boolean!
  }

  """
  Input type for user registration
  """
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: Role
  }

  type Query {
    """
    Get the currently authenticated user
    """
    me: User

    """
    Get all users (admin only)
    """
    users: [User]!

    """
    Get users by specific role (admin only)
    """
    usersByRole(role: Role!): [User]!

    """
    Get a specific user by ID (admin only)
    """
    user(id: ID!): User
  }

  type Mutation {
    """
    Register a new user
    """
    register(input: RegisterInput!): AuthResponse!

    """
    Login an existing user
    """
    login(email: String!, password: String!): AuthResponse!

    """
    Refresh an expired access token using a refresh token
    """
    refreshToken(refreshToken: String!): RefreshTokenResponse!

    """
    Logout user (invalidate refresh token)
    """
    logout(refreshToken: String!): Boolean!

    """
    Logout from all devices (invalidate all refresh tokens)
    """
    logoutAll: Boolean!

    """
    Update a user's role (admin only)
    """
    updateUserRole(userId: ID!, role: Role!): User!

    """
    Update current user's profile
    """
    updateProfile(name: String, email: String, password: String): User!

    """
    Delete a user (admin only or self)
    """
    deleteUser(userId: ID!): Boolean!
  }
`;

module.exports = typeDefs;