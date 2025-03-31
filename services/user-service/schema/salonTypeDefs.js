const { gql } = require('apollo-server');

const salonTypeDefs = gql`
  type SocialMedia {
    facebook: String
    instagram: String
    twitter: String
    linkedin: String
  }

  type ContactInfo {
    email: String
    phone: String
    website: String
    socialMedia: SocialMedia
  }

  type Coordinates {
    latitude: Float
    longitude: Float
  }

  type Address {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
    coordinates: Coordinates
  }

  type BusinessHoursDay {
    open: String
    close: String
    isOpen: Boolean
  }

  type BusinessHours {
    monday: BusinessHoursDay
    tuesday: BusinessHoursDay
    wednesday: BusinessHoursDay
    thursday: BusinessHoursDay
    friday: BusinessHoursDay
    saturday: BusinessHoursDay
    sunday: BusinessHoursDay
  }

  type Branding {
    logoUrl: String
    favicon: String
    primaryColor: String
    secondaryColor: String
    accentColor: String
    fontFamily: String
    customCSS: String
  }

  type NotificationSettings {
    emailEnabled: Boolean
    smsEnabled: Boolean
    reminderHours: Int
  }

  type SalonSettings {
    businessHours: BusinessHours
    serviceCategories: [String]
    branding: Branding
    notifications: NotificationSettings
  }

  type BookingDisplayOptions {
    showPrices: Boolean
    showDuration: Boolean
    enableClientLogin: Boolean
    requireDeposit: Boolean
    depositAmount: Float
    maxBookingWindow: Int
    minNoticeTime: Int
  }

  type SeoSettings {
    metaDescription: String
    metaKeywords: String
    ogImage: String
  }

  type BookingPageConfig {
    slug: String
    pageTitle: String
    welcomeMessage: String
    thankYouMessage: String
    displayOptions: BookingDisplayOptions
    seoSettings: SeoSettings
    customDomain: String
  }

  type Subscription {
    stripeCustomerId: String
    planId: String
    status: String
    currentPeriodEnd: String
  }

  type OnboardingStatus {
    step1Completed: Boolean
    step2Completed: Boolean
    step3Completed: Boolean
    step4Completed: Boolean
    completed: Boolean
  }

  type Salon {
    id: ID!
    businessName: String!
    tenantId: String!
    owner: User!
    plan: String!
    status: String!
    contactInfo: ContactInfo
    address: Address
    settings: SalonSettings
    bookingPageConfig: BookingPageConfig
    subscription: Subscription
    onboardingStatus: OnboardingStatus
    createdAt: String
    updatedAt: String
  }

  # Public view of a salon without sensitive information
  type PublicSalon {
    businessName: String!
    contactInfo: ContactInfo
    address: Address
    settings: SalonSettings
    bookingPageConfig: BookingPageConfig
  }

  input SocialMediaInput {
    facebook: String
    instagram: String
    twitter: String
    linkedin: String
  }

  input ContactInfoInput {
    email: String
    phone: String
    website: String
    socialMedia: SocialMediaInput
  }

  input CoordinatesInput {
    latitude: Float
    longitude: Float
  }

  input AddressInput {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
    coordinates: CoordinatesInput
  }

  input BusinessHoursDayInput {
    open: String
    close: String
    isOpen: Boolean
  }

  input BusinessHoursInput {
    monday: BusinessHoursDayInput
    tuesday: BusinessHoursDayInput
    wednesday: BusinessHoursDayInput
    thursday: BusinessHoursDayInput
    friday: BusinessHoursDayInput
    saturday: BusinessHoursDayInput
    sunday: BusinessHoursDayInput
  }

  input BrandingInput {
    logoUrl: String
    favicon: String
    primaryColor: String
    secondaryColor: String
    accentColor: String
    fontFamily: String
    customCSS: String
  }

  input NotificationSettingsInput {
    emailEnabled: Boolean
    smsEnabled: Boolean
    reminderHours: Int
  }

  input SalonSettingsInput {
    businessHours: BusinessHoursInput
    serviceCategories: [String]
    branding: BrandingInput
    notifications: NotificationSettingsInput
  }

  input BookingDisplayOptionsInput {
    showPrices: Boolean
    showDuration: Boolean
    enableClientLogin: Boolean
    requireDeposit: Boolean
    depositAmount: Float
    maxBookingWindow: Int
    minNoticeTime: Int
  }

  input SeoSettingsInput {
    metaDescription: String
    metaKeywords: String
    ogImage: String
  }

  input BookingPageConfigInput {
    slug: String
    pageTitle: String
    welcomeMessage: String
    thankYouMessage: String
    displayOptions: BookingDisplayOptionsInput
    seoSettings: SeoSettingsInput
    customDomain: String
  }

  # Input types for updates
  input UpdateSalonInfoInput {
    businessName: String
    contactInfo: ContactInfoInput
    address: AddressInput
  }

  extend type Query {
    # Get salon by tenantId - requires authentication
    getSalon(tenantId: String!): Salon
    
    # Get a public view of a salon by slug - no auth required
    getPublicSalon(slug: String!): PublicSalon
  }

  extend type Mutation {
    # Update salon info - requires admin or owner
    updateSalonInfo(tenantId: String!, input: UpdateSalonInfoInput!): Salon
    
    # Update salon branding - requires admin or owner
    updateSalonBranding(tenantId: String!, branding: BrandingInput!): Salon
    
    # Update business hours - requires admin or owner
    updateBusinessHours(tenantId: String!, businessHours: BusinessHoursInput!): Salon
    
    # Update booking page config - requires admin or owner
    updateBookingPageConfig(tenantId: String!, bookingConfig: BookingPageConfigInput!): Salon
  }
`;

module.exports = salonTypeDefs;