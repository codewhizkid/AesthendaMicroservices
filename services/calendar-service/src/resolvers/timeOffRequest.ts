import { IResolvers } from '@graphql-tools/utils';
import TimeOffRequest, { TimeOffRequestStatus, ITimeOffRequest } from '../models/TimeOffRequest';
import { pubsub } from '../utils/pubsub';
import { validateToken, checkPermission, getContext } from '../utils/auth';
import { buildPagination, buildFilters } from '../utils/queryHelpers';
import { GraphQLError } from 'graphql';
import { Document } from 'mongoose';

// Event names for pub/sub
const TIME_OFF_REQUEST_UPDATED = 'TIME_OFF_REQUEST_UPDATED';
const MY_TIME_OFF_REQUEST_STATUS_CHANGED = 'MY_TIME_OFF_REQUEST_STATUS_CHANGED';

// Resolver map
const resolvers: IResolvers = {
  Query: {
    // Get a single time-off request by ID
    timeOffRequest: async (_, { id }, context) => {
      const { userId, tenantId } = await getContext(context);
      
      const timeOffRequest = await TimeOffRequest.findById(id);
      
      if (!timeOffRequest) {
        throw new GraphQLError('Time-off request not found');
      }
      
      // Ensure tenant-level access control
      if (timeOffRequest.tenantId !== tenantId) {
        throw new GraphQLError('Access denied');
      }
      
      // Allow access if user is the staff member or has appropriate permissions
      if (timeOffRequest.staffId !== userId) {
        await checkPermission(context, 'manage_staff');
      }
      
      return timeOffRequest;
    },
    
    // Get time-off requests with filtering and pagination
    timeOffRequests: async (_, { filter, pagination, sortBy, sortOrder }, context) => {
      const { tenantId } = await getContext(context);
      
      // Check permission
      await checkPermission(context, 'view_staff');
      
      // Build query filters with tenant isolation
      const queryFilter = buildFilters({ ...filter, tenantId });
      
      // Get pagination params or use defaults
      const { limit, skip } = buildPagination(pagination);
      
      // Define sort options
      const sort: Record<string, number> = {};
      sort[sortBy || 'startDate'] = sortOrder === 'DESC' ? -1 : 1;
      
      // Execute query with pagination
      const edges = await TimeOffRequest.find(queryFilter)
        .sort(sort)
        .limit(limit)
        .skip(skip);
      
      const totalCount = await TimeOffRequest.countDocuments(queryFilter);
      
      return {
        edges,
        pageInfo: {
          hasNextPage: skip + limit < totalCount,
          hasPreviousPage: skip > 0,
          startCursor: skip.toString(),
          endCursor: Math.min(skip + limit, totalCount).toString()
        },
        totalCount
      };
    },
    
    // Get pending time-off requests for approval
    pendingTimeOffRequests: async (_, { pagination }, context) => {
      const { tenantId } = await getContext(context);
      
      // Check permission
      await checkPermission(context, 'manage_staff');
      
      // Get pagination params or use defaults
      const { limit, skip } = buildPagination(pagination);
      
      // Query for pending requests
      const filter = {
        tenantId,
        status: TimeOffRequestStatus.PENDING
      };
      
      const edges = await TimeOffRequest.find(filter)
        .sort({ startDate: 1 })
        .limit(limit)
        .skip(skip);
      
      const totalCount = await TimeOffRequest.countDocuments(filter);
      
      return {
        edges,
        pageInfo: {
          hasNextPage: skip + limit < totalCount,
          hasPreviousPage: skip > 0,
          startCursor: skip.toString(),
          endCursor: Math.min(skip + limit, totalCount).toString()
        },
        totalCount
      };
    },
    
    // Check if a staff member has time-off during a specific date range
    staffHasTimeOff: async (_, { staffId, startDate, endDate }, context) => {
      const { tenantId } = await getContext(context);
      
      // Ensure dates are properly formatted
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Query for approved time-off requests in the date range
      const timeOffRequest = await TimeOffRequest.findOne({
        tenantId,
        staffId,
        status: TimeOffRequestStatus.APPROVED,
        $or: [
          { startDate: { $lte: end }, endDate: { $gte: start } },
          { startDate: { $gte: start, $lte: end } },
          { endDate: { $gte: start, $lte: end } }
        ]
      });
      
      return timeOffRequest !== null;
    }
  },
  
  Mutation: {
    // Create a new time-off request
    createTimeOffRequest: async (_, { input }, context) => {
      const { userId, tenantId } = await getContext(context);
      
      // Staff can create their own time-off requests, admins can create for others
      if (input.staffId !== userId) {
        await checkPermission(context, 'manage_staff');
      }
      
      // Create the time-off request
      const timeOffRequest = new TimeOffRequest({
        ...input,
        tenantId,
        requestedAt: new Date()
      });
      
      // Check for conflicts if this is a new request
      const conflictCheck = await TimeOffRequest.findOne({
        tenantId,
        staffId: input.staffId,
        status: TimeOffRequestStatus.APPROVED,
        $or: [
          { startDate: { $lte: input.endDate }, endDate: { $gte: input.startDate } },
          { startDate: { $gte: input.startDate, $lte: input.endDate } },
          { endDate: { $gte: input.startDate, $lte: input.endDate } }
        ]
      });
      
      if (conflictCheck) {
        throw new GraphQLError('This request conflicts with an existing approved time-off request');
      }
      
      await timeOffRequest.save();
      
      // Publish event for subscribers
      pubsub.publish(TIME_OFF_REQUEST_UPDATED, {
        timeOffRequestUpdated: timeOffRequest,
        tenantId
      });
      
      return timeOffRequest;
    },
    
    // Update an existing time-off request
    updateTimeOffRequest: async (_, { id, input }, context) => {
      const { userId, tenantId } = await getContext(context);
      
      // Find the time-off request
      const timeOffRequest = await TimeOffRequest.findById(id);
      
      if (!timeOffRequest) {
        throw new GraphQLError('Time-off request not found');
      }
      
      // Ensure tenant-level access control
      if (timeOffRequest.tenantId !== tenantId) {
        throw new GraphQLError('Access denied');
      }
      
      // Staff can update their own time-off requests, admins can update any
      if (timeOffRequest.staffId !== userId) {
        await checkPermission(context, 'manage_staff');
      }
      
      // Staff can't change the status directly
      if (input.status && timeOffRequest.staffId === userId) {
        await checkPermission(context, 'manage_staff');
      }
      
      // Only allow pending requests to be updated by the staff who created them
      if (timeOffRequest.staffId === userId && 
          timeOffRequest.status !== TimeOffRequestStatus.PENDING) {
        throw new GraphQLError('Only pending requests can be updated');
      }
      
      // Update the time-off request
      Object.assign(timeOffRequest, input);
      
      // If date range is changing, check for conflicts
      if (input.startDate || input.endDate) {
        const startDate = input.startDate ? new Date(input.startDate) : timeOffRequest.startDate;
        const endDate = input.endDate ? new Date(input.endDate) : timeOffRequest.endDate;
        
        const conflictCheck = await TimeOffRequest.findOne({
          tenantId,
          staffId: timeOffRequest.staffId,
          _id: { $ne: id },
          status: TimeOffRequestStatus.APPROVED,
          $or: [
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } }
          ]
        });
        
        if (conflictCheck) {
          throw new GraphQLError('This request conflicts with an existing approved time-off request');
        }
      }
      
      // Process status change events
      const statusChanged = input.status && timeOffRequest.isModified('status');
      const oldStatus = timeOffRequest.status;
      
      await timeOffRequest.save();
      
      // Publish events for subscribers
      pubsub.publish(TIME_OFF_REQUEST_UPDATED, {
        timeOffRequestUpdated: timeOffRequest,
        tenantId
      });
      
      // Publish status change event if applicable
      if (statusChanged) {
        pubsub.publish(MY_TIME_OFF_REQUEST_STATUS_CHANGED, {
          myTimeOffRequestStatusChanged: timeOffRequest,
          tenantId,
          userId: timeOffRequest.staffId,
          oldStatus
        });
      }
      
      return timeOffRequest;
    },
    
    // Approve a time-off request
    approveTimeOffRequest: async (_, { id, reviewNotes }, context) => {
      const { userId, tenantId } = await getContext(context);
      
      // Check permission
      await checkPermission(context, 'manage_staff');
      
      // Find the time-off request
      const timeOffRequest = await TimeOffRequest.findById(id);
      
      if (!timeOffRequest) {
        throw new GraphQLError('Time-off request not found');
      }
      
      // Ensure tenant-level access control
      if (timeOffRequest.tenantId !== tenantId) {
        throw new GraphQLError('Access denied');
      }
      
      // Only pending requests can be approved
      if (timeOffRequest.status !== TimeOffRequestStatus.PENDING) {
        throw new GraphQLError('Only pending requests can be approved');
      }
      
      // Check for conflicts with other approved time-off
      const conflictCheck = await TimeOffRequest.findOne({
        tenantId,
        staffId: timeOffRequest.staffId,
        _id: { $ne: id },
        status: TimeOffRequestStatus.APPROVED,
        $or: [
          { startDate: { $lte: timeOffRequest.endDate }, endDate: { $gte: timeOffRequest.startDate } },
          { startDate: { $gte: timeOffRequest.startDate, $lte: timeOffRequest.endDate } },
          { endDate: { $gte: timeOffRequest.startDate, $lte: timeOffRequest.endDate } }
        ]
      });
      
      if (conflictCheck) {
        throw new GraphQLError('This request conflicts with an existing approved time-off request');
      }
      
      // Approve the request
      const oldStatus = timeOffRequest.status;
      
      // Update the status directly if method not available
      timeOffRequest.status = TimeOffRequestStatus.APPROVED;
      timeOffRequest.reviewedBy = userId;
      timeOffRequest.reviewedAt = new Date();
      timeOffRequest.reviewNotes = reviewNotes || '';
      await timeOffRequest.save();
      
      // Publish events
      pubsub.publish(TIME_OFF_REQUEST_UPDATED, {
        timeOffRequestUpdated: timeOffRequest,
        tenantId
      });
      
      pubsub.publish(MY_TIME_OFF_REQUEST_STATUS_CHANGED, {
        myTimeOffRequestStatusChanged: timeOffRequest,
        tenantId,
        userId: timeOffRequest.staffId,
        oldStatus
      });
      
      return timeOffRequest;
    },
    
    // Deny a time-off request
    denyTimeOffRequest: async (_, { id, reviewNotes }, context) => {
      const { userId, tenantId } = await getContext(context);
      
      // Check permission
      await checkPermission(context, 'manage_staff');
      
      // Find the time-off request
      const timeOffRequest = await TimeOffRequest.findById(id);
      
      if (!timeOffRequest) {
        throw new GraphQLError('Time-off request not found');
      }
      
      // Ensure tenant-level access control
      if (timeOffRequest.tenantId !== tenantId) {
        throw new GraphQLError('Access denied');
      }
      
      // Only pending requests can be denied
      if (timeOffRequest.status !== TimeOffRequestStatus.PENDING) {
        throw new GraphQLError('Only pending requests can be denied');
      }
      
      // Deny the request
      const oldStatus = timeOffRequest.status;
      
      // Update the status directly if method not available
      timeOffRequest.status = TimeOffRequestStatus.DENIED;
      timeOffRequest.reviewedBy = userId;
      timeOffRequest.reviewedAt = new Date();
      timeOffRequest.reviewNotes = reviewNotes || '';
      await timeOffRequest.save();
      
      // Publish events
      pubsub.publish(TIME_OFF_REQUEST_UPDATED, {
        timeOffRequestUpdated: timeOffRequest,
        tenantId
      });
      
      pubsub.publish(MY_TIME_OFF_REQUEST_STATUS_CHANGED, {
        myTimeOffRequestStatusChanged: timeOffRequest,
        tenantId,
        userId: timeOffRequest.staffId,
        oldStatus
      });
      
      return timeOffRequest;
    },
    
    // Cancel a time-off request
    cancelTimeOffRequest: async (_, { id }, context) => {
      const { userId, tenantId } = await getContext(context);
      
      // Find the time-off request
      const timeOffRequest = await TimeOffRequest.findById(id);
      
      if (!timeOffRequest) {
        throw new GraphQLError('Time-off request not found');
      }
      
      // Ensure tenant-level access control
      if (timeOffRequest.tenantId !== tenantId) {
        throw new GraphQLError('Access denied');
      }
      
      // Staff can cancel their own, admins can cancel any
      if (timeOffRequest.staffId !== userId) {
        await checkPermission(context, 'manage_staff');
      }
      
      // Only certain statuses can be cancelled
      if (timeOffRequest.status !== TimeOffRequestStatus.PENDING && 
          timeOffRequest.status !== TimeOffRequestStatus.APPROVED) {
        throw new GraphQLError('Only pending or approved requests can be cancelled');
      }
      
      // Cancel the request
      const oldStatus = timeOffRequest.status;
      
      // Update the status directly if method not available
      timeOffRequest.status = TimeOffRequestStatus.CANCELLED;
      await timeOffRequest.save();
      
      // Publish events
      pubsub.publish(TIME_OFF_REQUEST_UPDATED, {
        timeOffRequestUpdated: timeOffRequest,
        tenantId
      });
      
      pubsub.publish(MY_TIME_OFF_REQUEST_STATUS_CHANGED, {
        myTimeOffRequestStatusChanged: timeOffRequest,
        tenantId,
        userId: timeOffRequest.staffId,
        oldStatus
      });
      
      return timeOffRequest;
    }
  },
  
  Subscription: {
    // Subscribe to time-off request updates for a tenant
    timeOffRequestUpdated: {
      subscribe: async (_, { tenantId }, context) => {
        // Validate token and ensure tenant access
        const { userId } = await validateToken(context.token);
        await checkPermission(context, 'view_staff', tenantId);
        
        return pubsub.asyncIterator([TIME_OFF_REQUEST_UPDATED]);
      },
      resolve: (payload, _, __) => {
        // Only return if tenant matches
        if (payload.tenantId === _.tenantId) {
          return payload.timeOffRequestUpdated;
        }
        return null;
      }
    },
    
    // Subscribe to own time-off request status changes
    myTimeOffRequestStatusChanged: {
      subscribe: async (_, __, context) => {
        // Validate token
        const { userId } = await validateToken(context.token);
        
        return pubsub.asyncIterator([MY_TIME_OFF_REQUEST_STATUS_CHANGED]);
      },
      resolve: (payload, _, context) => {
        // Only return if the request belongs to the user
        if (payload.userId === context.userId) {
          return payload.myTimeOffRequestStatusChanged;
        }
        return null;
      }
    }
  },
  
  // Field resolvers
  TimeOffRequest: {
    // Resolve the staff (user) field
    staff: async (parent, _, context) => {
      // This would require a dataloader or service to fetch user details
      // Assuming a userService is available through context
      if (context.userService) {
        return context.userService.getUserById(parent.staffId);
      }
      return null;
    },
    
    // Resolve the reviewer field
    reviewer: async (parent, _, context) => {
      if (!parent.reviewedBy) return null;
      
      // This would require a dataloader or service to fetch user details
      if (context.userService) {
        return context.userService.getUserById(parent.reviewedBy);
      }
      return null;
    }
  }
};

export default resolvers; 