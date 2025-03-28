const { gql } = require('apollo-server');
const salonTypeDefs = require('./salonTypeDefs');

const baseTypeDefs = gql`
  """
  User type with basic profile information
  """
  type User {
    id: ID!
    name: String!
    email: String!
    role: SystemRole!
    tenantId: String
    customRoles: [CustomRole]
    isVerified: Boolean
    profileImage: String
    phone: String
    oauthProviders: OAuthProviders
    createdAt: String
    firstName: String!
    lastName: String!
    stylist_id: String
    profile: UserProfile
    services: [ServiceOffering]
    isActive: Boolean
    updatedAt: String
    fullName: String
  }

  """
  OAuth provider information for a user
  """
  type OAuthProviders {
    google: OAuthProvider
    facebook: OAuthProvider
  }

  """
  Information about a specific OAuth provider for a user
  """
  type OAuthProvider {
    id: String
  }

  """
  Available system roles in the system
  """
  enum SystemRole {
    client
    stylist
    salon_admin
    system_admin
  }

  """
  Custom role assigned to a user within a tenant
  """
  type CustomRole {
    name: String!
    tenantId: String!
    permissions: [String!]!
  }

  """
  Role type for tenant-specific roles
  """
  type Role {
    id: ID!
    name: String!
    description: String
    tenantId: String!
    permissions: [String!]!
    isDefault: Boolean!
    isCustom: Boolean!
    createdBy: User
    createdAt: String!
    updatedAt: String!
  }

  """
  Available OAuth providers
  """
  enum OAuthProviderType {
    google
    facebook
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
  Available salon plans
  """
  enum SalonPlan {
    free
    basic
    premium
    enterprise
  }

  """
  Salon status options
  """
  enum SalonStatus {
    active
    inactive
    suspended
    trial
  }

  """
  Trial information for a salon
  """
  type TrialInfo {
    isInTrial: Boolean!
    remainingDays: Int
  }

  """
  Input type for user registration
  """
  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: SystemRole
    tenantId: String
  }

  """
  Input type for salon registration
  """
  input SalonRegistrationInput {
    businessName: String!
    ownerName: String!
    email: String!
    password: String!
    planId: String!
  }

  """
  Input for salon onboarding steps
  """
  input OnboardingStepInput {
    tenantId: String!
    step: Int!
    data: String! # JSON stringified data for the step
  }

  """
  Input for creating a new custom role
  """
  input RoleInput {
    name: String!
    description: String
    permissions: [String!]!
    tenantId: String!
  }

  """
  Input type for OAuth authentication
  """
  input OAuthInput {
    provider: OAuthProviderType!
    token: String!
    profile: String! # JSON stringified profile data
  }

  type UserProfile {
    phoneNumber: String
    title: String
    bio: String
    avatar: String
    preferences: UserPreferences
  }

  type UserPreferences {
    language: String
    notifications: NotificationPreferences
    theme: String
  }

  type NotificationPreferences {
    email: Boolean
    sms: Boolean
    push: Boolean
  }

  type ServiceOffering {
    serviceId: ID
    name: String!
    duration: Int!
    price: Float!
  }

  input ServiceOfferingInput {
    serviceId: ID
    name: String!
    duration: Int!
    price: Float!
  }

  input UserProfileInput {
    phoneNumber: String
    title: String
    bio: String
    avatar: String
    preferences: UserPreferencesInput
  }

  input UserPreferencesInput {
    language: String
    notifications: NotificationPreferencesInput
    theme: String
  }

  input NotificationPreferencesInput {
    email: Boolean
    sms: Boolean
    push: Boolean
  }

  input StylistProfileUpdateInput {
    role: String
    profile: UserProfileInput
    services: [ServiceOfferingInput]
    isActive: Boolean
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  # Base types for extending in other schema files
  type Query {
    _empty: String
    me: User
    user(id: ID!): User
    userByStylistId(stylist_id: String!, tenantId: String): User
    stylistsByTenant(tenantId: String): [User]
  }

  type Mutation {
    _empty: String
    register(email: String!, password: String!, firstName: String!, lastName: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    refreshToken(refreshToken: String!): AuthPayload
    updateProfile(id: ID!, profile: UserProfileInput!): User
    updateStylistProfile(id: ID!, input: StylistProfileUpdateInput!): User
  }
`;

// Combine the base typeDefs with the salon typeDefs
const typeDefs = [baseTypeDefs, salonTypeDefs];

module.exports = typeDefs;