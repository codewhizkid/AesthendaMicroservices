const { gql } = require('apollo-server');

const typeDefs = gql`
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
  Salon/Tenant information
  """
  type Salon {
    id: ID!
    businessName: String!
    tenantId: String!
    owner: User!
    plan: SalonPlan!
    status: SalonStatus!
    settings: SalonSettings
    subscription: SubscriptionInfo
    onboardingStatus: OnboardingStatus
    createdAt: String!
  }

  """
  Salon business settings
  """
  type SalonSettings {
    businessHours: BusinessHours
    serviceCategories: [String]
    branding: BrandingSettings
  }
  
  """
  Business hours configuration
  """
  type BusinessHours {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
  }
  
  """
  Day schedule
  """
  type DaySchedule {
    open: String
    close: String
    isOpen: Boolean
  }
  
  """
  Branding settings for salon
  """
  type BrandingSettings {
    logoUrl: String
    primaryColor: String
    secondaryColor: String
    accentColor: String
  }
  
  """
  Subscription information
  """
  type SubscriptionInfo {
    stripeCustomerId: String
    planId: String
    status: String
    currentPeriodEnd: String
  }
  
  """
  Onboarding status tracking
  """
  type OnboardingStatus {
    step1Completed: Boolean
    step2Completed: Boolean
    step3Completed: Boolean
    step4Completed: Boolean
    completed: Boolean
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
  
  """
  Input for salon settings update
  """
  input SalonSettingsInput {
    businessHours: BusinessHoursInput
    serviceCategories: [String]
    branding: BrandingSettingsInput
  }
  
  """
  Input for business hours
  """
  input BusinessHoursInput {
    monday: DayScheduleInput
    tuesday: DayScheduleInput
    wednesday: DayScheduleInput
    thursday: DayScheduleInput
    friday: DayScheduleInput
    saturday: DayScheduleInput
    sunday: DayScheduleInput
  }
  
  """
  Input for day schedule
  """
  input DayScheduleInput {
    open: String
    close: String
    isOpen: Boolean
  }
  
  """
  Input for branding settings
  """
  input BrandingSettingsInput {
    logoUrl: String
    primaryColor: String
    secondaryColor: String
    accentColor: String
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
    usersByRole(role: SystemRole!): [User]!

    """
    Get a specific user by ID (admin only)
    """
    user(id: ID!): User
    
    """
    Get all salons (system admin only)
    """
    salons: [Salon]!
    
    """
    Get a specific salon by tenant ID (system admin or salon admin only)
    """
    salon(tenantId: String!): Salon
    
    """
    Get trial information for a salon
    """
    trialInfo(tenantId: String!): TrialInfo!
    
    """
    Get all users for a specific tenant (salon admin only)
    """
    tenantUsers(tenantId: String!): [User]!
    
    """
    Get all roles for a specific tenant
    """
    tenantRoles(tenantId: String!): [Role]!
    
    """
    Get a specific role by ID
    """
    role(id: ID!): Role
    
    """
    Get all available permissions that can be assigned to roles
    """
    availablePermissions: [String!]!
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
    Authenticate with OAuth
    """
    oauthLogin(input: OAuthInput!): AuthResponse!

    """
    Connect an OAuth provider to an existing account (must be authenticated)
    """
    connectOAuthProvider(input: OAuthInput!): User!

    """
    Disconnect an OAuth provider from an account (must be authenticated)
    """
    disconnectOAuthProvider(provider: OAuthProviderType!): User!

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
    updateUserRole(userId: ID!, role: SystemRole!): User!

    """
    Update current user's profile
    """
    updateProfile(name: String, email: String, password: String, phone: String, profileImage: String): User!

    """
    Delete a user (admin only or self)
    """
    deleteUser(userId: ID!): Boolean!
    
    """
    Register a new salon (creates tenant)
    """
    registerSalon(input: SalonRegistrationInput!): String! # Returns paymentIntentClientSecret
    
    """
    Confirm salon registration after payment (webhook)
    """
    confirmSalonRegistration(paymentIntentId: String!): Boolean!
    
    """
    Complete an onboarding step for a salon
    """
    completeSalonOnboardingStep(input: OnboardingStepInput!): Boolean!
    
    """
    Update salon settings
    """
    updateSalonSettings(tenantId: String!, settings: SalonSettingsInput!): Salon!
    
    """
    Create a new role for a tenant
    """
    createRole(input: RoleInput!): Role!
    
    """
    Update an existing role
    """
    updateRole(id: ID!, input: RoleInput!): Role!
    
    """
    Delete a role
    """
    deleteRole(id: ID!): Boolean!
    
    """
    Assign a role to a user
    """
    assignRoleToUser(userId: ID!, roleId: ID!): User!
    
    """
    Remove a role from a user
    """
    removeRoleFromUser(userId: ID!, roleId: ID!): User!
    
    """
    Create a staff member for a salon
    """
    createStaffMember(
      tenantId: String!, 
      name: String!, 
      email: String!, 
      password: String, 
      roleIds: [ID!]
    ): User!
  }
`;

module.exports = typeDefs;