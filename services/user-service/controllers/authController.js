/**
 * Create a salon and owner account
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const registerSalon = async (req, res) => {
  try {
    const { businessName, ownerEmail, ownerPassword, ownerFirstName, ownerLastName, plan = 'basic' } = req.body;

    // Validate required fields
    if (!businessName || !ownerEmail || !ownerPassword || !ownerFirstName || !ownerLastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Generate tenant ID
    const tenantId = businessName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-6);

    // Create salon owner user with salon_admin role
    const owner = new User({
      firstName: ownerFirstName,
      lastName: ownerLastName,
      email: ownerEmail.toLowerCase(),
      password: ownerPassword,
      role: 'salon_admin',
      tenantId
    });

    // Save user and generate stylist_id automatically via pre-save hook
    await owner.save();

    // Create salon record
    const salon = new Salon({
      businessName,
      tenantId,
      owner: owner._id,
      plan,
      status: 'active'
    });

    await salon.save();

    // Generate tokens
    const token = owner.generateAuthToken();
    const { token: refreshToken } = owner.generateRefreshToken();
    await owner.save(); // Save to store refresh token

    res.status(201).json({
      success: true,
      message: 'Salon registered successfully',
      data: {
        user: {
          id: owner._id,
          stylist_id: owner.stylist_id,
          email: owner.email,
          role: owner.role,
          firstName: owner.firstName,
          lastName: owner.lastName,
          tenantId
        },
        salon: {
          id: salon._id,
          businessName: salon.businessName,
          tenantId: salon.tenantId,
          plan: salon.plan,
          status: salon.status
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error in salon registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register salon',
      error: error.message
    });
  }
}; 