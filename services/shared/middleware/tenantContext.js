const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');

/**
 * Extract tenant information from the request
 * Priority:
 * 1. Authorization header (JWT token)
 * 2. Query parameter (tenantId)
 * 3. Subdomain
 */
const extractTenantInfo = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        tenantId: decoded.tenantId,
        source: 'token'
      };
    } catch (error) {
      console.warn('Invalid JWT token:', error.message);
    }
  }

  // Check query parameter
  if (req.query.tenantId) {
    return {
      tenantId: req.query.tenantId,
      source: 'query'
    };
  }

  // Check subdomain
  const host = req.get('host');
  if (host && !host.startsWith('www.')) {
    const subdomain = host.split('.')[0];
    return {
      tenantSlug: subdomain,
      source: 'subdomain'
    };
  }

  return null;
};

/**
 * Middleware to set tenant context
 */
const tenantContext = async (req, res, next) => {
  try {
    const tenantInfo = extractTenantInfo(req);
    
    if (!tenantInfo) {
      return res.status(400).json({
        error: 'Tenant context not found'
      });
    }

    let tenant;
    if (tenantInfo.tenantId) {
      tenant = await Tenant.findById(tenantInfo.tenantId);
    } else if (tenantInfo.tenantSlug) {
      tenant = await Tenant.findOne({ slug: tenantInfo.tenantSlug });
    }

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found'
      });
    }

    if (!tenant.isActive()) {
      return res.status(403).json({
        error: 'Tenant is not active'
      });
    }

    // Set tenant context in request
    req.tenant = tenant;
    req.tenantId = tenant._id;

    // Add tenant headers for debugging/logging
    res.set('X-Tenant-ID', tenant._id.toString());
    res.set('X-Tenant-Name', tenant.name);
    res.set('X-Tenant-Source', tenantInfo.source);

    next();
  } catch (error) {
    console.error('Error in tenant context middleware:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

/**
 * GraphQL context middleware for Apollo Server
 */
const graphqlTenantContext = async ({ req }) => {
  try {
    const tenantInfo = extractTenantInfo(req);
    
    if (!tenantInfo) {
      throw new Error('Tenant context not found');
    }

    let tenant;
    if (tenantInfo.tenantId) {
      tenant = await Tenant.findById(tenantInfo.tenantId);
    } else if (tenantInfo.tenantSlug) {
      tenant = await Tenant.findOne({ slug: tenantInfo.tenantSlug });
    }

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.isActive()) {
      throw new Error('Tenant is not active');
    }

    return {
      tenant,
      tenantId: tenant._id
    };
  } catch (error) {
    throw new Error(`Tenant context error: ${error.message}`);
  }
};

/**
 * Mongoose middleware to enforce tenant isolation
 */
const tenantModel = (schema) => {
  // Add tenantId to schema
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    }
  });

  // Ensure tenantId is included in all queries
  schema.pre(/^find/, function(next) {
    if (!this._conditions.tenantId && !this._tenantBypass) {
      throw new Error('Tenant ID is required for all queries');
    }
    next();
  });

  // Ensure tenantId is included in all updates
  schema.pre(['updateOne', 'updateMany'], function(next) {
    if (!this._conditions.tenantId && !this._tenantBypass) {
      throw new Error('Tenant ID is required for all updates');
    }
    next();
  });

  // Ensure tenantId is included in all deletes
  schema.pre(['deleteOne', 'deleteMany'], function(next) {
    if (!this._conditions.tenantId && !this._tenantBypass) {
      throw new Error('Tenant ID is required for all deletes');
    }
    next();
  });

  // Add method to bypass tenant check (for admin operations)
  schema.static('bypassTenant', function() {
    const query = this.find();
    query._tenantBypass = true;
    return query;
  });
};

module.exports = {
  tenantContext,
  graphqlTenantContext,
  tenantModel
}; 