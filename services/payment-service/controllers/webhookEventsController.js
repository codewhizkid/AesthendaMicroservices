/**
 * Webhook Events Controller
 * 
 * Provides API endpoints to retrieve and manage webhook events
 * Used by the admin interface to display and filter webhook events
 */

const WebhookEvent = require('../models/WebhookEvent');

/**
 * Get webhook events with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWebhookEvents = async (req, res) => {
  try {
    const {
      tenantId,
      provider,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'receivedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Tenant filter is mandatory for security
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    query.tenantId = tenantId;
    
    // Optional filters
    if (provider) {
      query.provider = provider;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.receivedAt = {};
      
      if (startDate) {
        query.receivedAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.receivedAt.$lte = new Date(endDate);
      }
    }
    
    // Handle pagination
    const skip = (page - 1) * limit;
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const events = await WebhookEvent.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await WebhookEvent.countDocuments(query);
    
    // Return data with pagination info
    res.json({
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`Error retrieving webhook events: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve webhook events' });
  }
};

/**
 * Get a specific webhook event by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWebhookEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    
    // Tenant ID is required for security
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const event = await WebhookEvent.findOne({
      _id: id,
      tenantId
    }).lean();
    
    if (!event) {
      return res.status(404).json({ error: 'Webhook event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error(`Error retrieving webhook event: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve webhook event' });
  }
};

/**
 * Get event counts grouped by status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWebhookEventStats = async (req, res) => {
  try {
    const { tenantId, startDate, endDate } = req.query;
    
    // Tenant ID is required for security
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Build match query
    const matchQuery = { tenantId };
    
    // Date range filter
    if (startDate || endDate) {
      matchQuery.receivedAt = {};
      
      if (startDate) {
        matchQuery.receivedAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        matchQuery.receivedAt.$lte = new Date(endDate);
      }
    }
    
    // Aggregate counts by status
    const statusCounts = await WebhookEvent.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Aggregate counts by provider
    const providerCounts = await WebhookEvent.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$provider', count: { $sum: 1 } } }
    ]);
    
    // Format the response
    const stats = {
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      providerCounts: providerCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      total: await WebhookEvent.countDocuments(matchQuery)
    };
    
    res.json(stats);
  } catch (error) {
    console.error(`Error retrieving webhook event stats: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve webhook event statistics' });
  }
};

/**
 * Retry processing a failed webhook event
 * This is useful for events that failed due to temporary issues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const retryWebhookEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.body;
    
    // Tenant ID is required for security
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Find the webhook event
    const event = await WebhookEvent.findOne({
      _id: id,
      tenantId,
      status: { $in: ['failed', 'invalid_signature'] }
    });
    
    if (!event) {
      return res.status(404).json({ 
        error: 'Webhook event not found or not eligible for retry' 
      });
    }
    
    // Import webhook controller functions
    const { 
      processStripeEvent, 
      processSquareEvent, 
      processPayPalEvent 
    } = require('./webhookController');
    
    // Process based on provider
    switch (event.provider) {
      case 'stripe':
        await processStripeEvent(tenantId, event.payload, event);
        break;
        
      case 'square':
        await processSquareEvent(tenantId, event.payload, event);
        break;
        
      case 'paypal':
        await processPayPalEvent(tenantId, event.payload, event);
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    // Update event status
    event.status = 'processed';
    event.processedAt = new Date();
    event.processingError = null;
    await event.save();
    
    res.json({ 
      message: 'Webhook event successfully reprocessed',
      event: event
    });
  } catch (error) {
    console.error(`Error retrying webhook event: ${error.message}`);
    res.status(500).json({ error: 'Failed to retry webhook event' });
  }
};

module.exports = {
  getWebhookEvents,
  getWebhookEventById,
  getWebhookEventStats,
  retryWebhookEvent
}; 