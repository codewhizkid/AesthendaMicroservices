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
  User profile information
  """
  type User implements Node {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    status: String!
    phoneNumber: String
    profileImage: String
    preferences: UserPreferences
    lastLogin: String
    emailVerified: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  """
  User preferences
  """
  type UserPreferences {
    language: String!
    timezone: String
    notifications: NotificationPreferences
  }

  """
  Notification preferences
  """
  type NotificationPreferences {
    email: Boolean!
    sms: Boolean!
    push: Boolean!
  }

  """
  Authentication response
  """
  type AuthResponse {
    token: String!
    refreshToken: String!
    expiresIn: Float!
    user: User!
  }

  """
  Refresh token response
  """
  type RefreshTokenResponse {
    token: String!
    expiresIn: Float!
    success: Boolean!
  }

  """
  Password reset response
  """
  type PasswordResetResponse {
    success: Boolean!
    message: String
  }

  """
  Registration input
  """
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    role: UserRole = CLIENT
    phoneNumber: String
    tenantId: ID!
  }

  """
  Update user input
  """
  input UpdateUserInput {
    firstName: String
    lastName: String
    phoneNumber: String
    profileImage: String
    preferences: UserPreferencesInput
    status: String
  }

  """
  User preferences input
  """
  input UserPreferencesInput {
    language: String
    timezone: String
    notifications: NotificationPreferencesInput
  }

  """
  Notification preferences input
  """
  input NotificationPreferencesInput {
    email: Boolean
    sms: Boolean
    push: Boolean
  }

  """
  OAuth login input
  """
  input OAuthLoginInput {
    provider: OAuthProvider!
    token: String!
    profile: String!
  }

  """
  OAuth provider
  """
  enum OAuthProvider {
    GOOGLE
    FACEBOOK
  }

  type Query {
    """
    Get current authenticated user
    """
    me: User!

    """
    Get a user by ID
    """
    user(id: ID!): User

    """
    Verify password reset token
    """
    verifyResetToken(token: String!): PasswordResetResponse
  }

  type Mutation {
    """
    Register a new user
    """
    register(input: RegisterInput!): AuthResponse!

    """
    Login with email and password
    """
    login(email: String!, password: String!, tenantId: ID!): AuthResponse!

    """
    Login with OAuth provider
    """
    oauthLogin(input: OAuthLoginInput!): AuthResponse!

    """
    Refresh access token
    """
    refreshToken(refreshToken: String!): RefreshTokenResponse!

    """
    Logout (revoke a specific refresh token)
    """
    logout(refreshToken: String!): Boolean!

    """
    Logout from all devices (revoke all refresh tokens)
    """
    logoutAll: Boolean!

    """
    Request password reset
    """
    requestPasswordReset(email: String!, tenantId: ID!): PasswordResetResponse!

    """
    Reset password with token
    """
    resetPassword(token: String!, newPassword: String!): PasswordResetResponse!

    """
    Verify email with token
    """
    verifyEmail(token: String!): PasswordResetResponse!

    """
    Resend verification email
    """
    resendVerification(email: String!, tenantId: ID!): PasswordResetResponse!

    """
    Update user profile
    """
    updateProfile(input: UpdateUserInput!): User!

    """
    Change password
    """
    changePassword(currentPassword: String!, newPassword: String!): Boolean!

    """
    Update user role (admin only)
    """
    updateUserRole(userId: ID!, role: UserRole!): User!
  }
`; 