const validateCategory = (category) => {
  const errors = [];
  
  if (!category || typeof category !== 'object') {
    errors.push('Service category must be an object');
    return errors;
  }

  // Validate name
  if (!category.name || typeof category.name !== 'string' || category.name.length === 0) {
    errors.push('Category name is required and must be a non-empty string');
  }

  // Validate description
  if (category.description !== undefined && 
      (typeof category.description !== 'string' || category.description.length === 0)) {
    errors.push('Category description must be a non-empty string if provided');
  }

  // Validate image URL
  if (category.imageUrl !== undefined) {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(category.imageUrl)) {
      errors.push('Invalid image URL format');
    }
  }

  // Validate order
  if (category.order !== undefined) {
    if (!Number.isInteger(category.order) || category.order < 0) {
      errors.push('Category order must be a non-negative integer');
    }
  }

  // Validate active status
  if (category.isActive !== undefined && typeof category.isActive !== 'boolean') {
    errors.push('Category active status must be a boolean');
  }

  return errors;
};

const validatePricingTier = (tier) => {
  const errors = [];
  
  if (!tier || typeof tier !== 'object') {
    errors.push('Pricing tier must be an object');
    return errors;
  }

  // Validate name
  if (!tier.name || typeof tier.name !== 'string' || tier.name.length === 0) {
    errors.push('Tier name is required and must be a non-empty string');
  }

  // Validate description
  if (tier.description !== undefined && 
      (typeof tier.description !== 'string' || tier.description.length === 0)) {
    errors.push('Tier description must be a non-empty string if provided');
  }

  // Validate base price
  if (typeof tier.basePrice !== 'number' || tier.basePrice < 0) {
    errors.push('Base price must be a non-negative number');
  }

  // Validate duration
  if (!Number.isInteger(tier.duration) || tier.duration <= 0 || tier.duration > 480) {
    errors.push('Duration must be a positive integer between 1 and 480 minutes');
  }

  // Validate capacity
  if (tier.capacity !== undefined) {
    if (!Number.isInteger(tier.capacity) || tier.capacity <= 0 || tier.capacity > 10) {
      errors.push('Capacity must be a positive integer between 1 and 10');
    }
  }

  // Validate deposit required
  if (tier.requiresDeposit !== undefined && typeof tier.requiresDeposit !== 'boolean') {
    errors.push('Requires deposit must be a boolean');
  }

  // Validate deposit amount
  if (tier.depositAmount !== undefined) {
    if (typeof tier.depositAmount !== 'number' || 
        tier.depositAmount < 0 || 
        tier.depositAmount > tier.basePrice) {
      errors.push('Deposit amount must be a non-negative number not exceeding the base price');
    }
  }

  // Validate active status
  if (tier.isActive !== undefined && typeof tier.isActive !== 'boolean') {
    errors.push('Tier active status must be a boolean');
  }

  return errors;
};

const validateSpecialOffer = (offer) => {
  const errors = [];
  
  if (!offer || typeof offer !== 'object') {
    errors.push('Special offer must be an object');
    return errors;
  }

  // Validate name
  if (!offer.name || typeof offer.name !== 'string' || offer.name.length === 0) {
    errors.push('Offer name is required and must be a non-empty string');
  }

  // Validate description
  if (offer.description !== undefined && 
      (typeof offer.description !== 'string' || offer.description.length === 0)) {
    errors.push('Offer description must be a non-empty string if provided');
  }

  // Validate discount type
  const validDiscountTypes = ['percentage', 'fixed_amount'];
  if (!offer.discountType || !validDiscountTypes.includes(offer.discountType)) {
    errors.push('Invalid discount type');
  }

  // Validate discount value
  if (typeof offer.discountValue !== 'number' || offer.discountValue <= 0) {
    errors.push('Discount value must be a positive number');
  }
  if (offer.discountType === 'percentage' && offer.discountValue > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }

  // Validate validity period
  if (offer.validFrom && !(offer.validFrom instanceof Date)) {
    errors.push('Valid from date must be a valid date');
  }
  if (offer.validUntil && !(offer.validUntil instanceof Date)) {
    errors.push('Valid until date must be a valid date');
  }
  if (offer.validFrom && offer.validUntil && offer.validFrom >= offer.validUntil) {
    errors.push('Valid until date must be after valid from date');
  }

  // Validate usage limits
  if (offer.maxUses !== undefined) {
    if (!Number.isInteger(offer.maxUses) || offer.maxUses <= 0) {
      errors.push('Maximum uses must be a positive integer');
    }
  }

  if (offer.maxUsesPerClient !== undefined) {
    if (!Number.isInteger(offer.maxUsesPerClient) || offer.maxUsesPerClient <= 0) {
      errors.push('Maximum uses per client must be a positive integer');
    }
  }

  // Validate minimum booking requirements
  if (offer.minimumBookingAmount !== undefined) {
    if (typeof offer.minimumBookingAmount !== 'number' || offer.minimumBookingAmount < 0) {
      errors.push('Minimum booking amount must be a non-negative number');
    }
  }

  if (offer.minimumBookingDuration !== undefined) {
    if (!Number.isInteger(offer.minimumBookingDuration) || offer.minimumBookingDuration <= 0) {
      errors.push('Minimum booking duration must be a positive integer');
    }
  }

  // Validate service restrictions
  if (offer.applicableServices !== undefined) {
    if (!Array.isArray(offer.applicableServices)) {
      errors.push('Applicable services must be an array');
    } else {
      offer.applicableServices.forEach(serviceId => {
        if (typeof serviceId !== 'string' || serviceId.length === 0) {
          errors.push('Invalid service ID in applicable services');
        }
      });
    }
  }

  // Validate active status
  if (offer.isActive !== undefined && typeof offer.isActive !== 'boolean') {
    errors.push('Offer active status must be a boolean');
  }

  return errors;
};

const validateServiceSettings = {
  category: validateCategory,
  pricingTier: validatePricingTier,
  specialOffer: validateSpecialOffer
};

module.exports = validateServiceSettings; 