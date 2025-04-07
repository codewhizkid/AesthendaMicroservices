const { PubSub } = require('graphql-subscriptions');
const { withFilter } = require('graphql-subscriptions');
const moment = require('moment');
const Appointment = require('../models/Appointment');
const { checkAvailability } = require('../utils/availability');
const { validateAppointment } = require('../utils/validation');
const { publishEvent } = require('../utils/eventBus');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');

const pubsub = new PubSub();

const APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED';
const APPOINTMENT_CREATED = 'APPOINTMENT_CREATED';
const APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED';

// Permission check helper
const checkPermission = (user, permission) => {
  if (!user || !user.hasPermission(permission)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
};

// Tenant check helper
const checkTenant = (context) => {
  if (!context.tenant || !context.tenantId) {
    throw new AuthenticationError('Tenant context not found');
  }
  return context.tenantId;
};

const resolvers = {
  Query: {
    appointments: async (_, { first = 10, after, filter = {} }, context) => {
      const tenantId = checkTenant(context);
      checkPermission(context.user, 'view_appointments');

      try {
        // Build the filter query
        const query = { tenantId };
        
        if (filter.status?.length > 0) {
          query.status = { $in: filter.status };
        }
        
        if (filter.startDate || filter.endDate) {
          query.date = {};
          if (filter.startDate) {
            query.date.$gte = new Date(filter.startDate);
          }
          if (filter.endDate) {
            query.date.$lte = new Date(filter.endDate);
          }
        }
        
        // Apply role-based filters
        if (context.user.role === 'STYLIST') {
          query.stylistId = context.user._id;
        } else if (context.user.role === 'CLIENT') {
          query.clientId = context.user._id;
        } else if (filter.stylistId) {
          query.stylistId = filter.stylistId;
        }
        
        if (filter.clientId && (context.user.role === 'ADMIN' || context.user.role === 'MANAGER')) {
          query.clientId = filter.clientId;
        }

        // Handle cursor-based pagination
        if (after) {
          query._id = { $gt: after };
        }

        // Execute query with pagination
        const appointments = await Appointment.find(query)
          .limit(first + 1)
          .populate('client')
          .populate('stylist')
          .populate('services')
          .sort({ date: 1, startTime: 1 });

        const hasNextPage = appointments.length > first;
        const edges = appointments.slice(0, first).map(appointment => ({
          node: appointment,
          cursor: appointment._id.toString()
        }));

        const totalCount = await Appointment.countDocuments(query);

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: Boolean(after),
            startCursor: edges[0]?.cursor,
            endCursor: edges[edges.length - 1]?.cursor
          },
          totalCount
        };
      } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
    },

    appointment: async (_, { id }, context) => {
      const tenantId = checkTenant(context);
      checkPermission(context.user, 'view_appointment_details');

      try {
        const appointment = await Appointment.findOne({ _id: id, tenantId })
          .populate('client')
          .populate('stylist')
          .populate('services');

        if (!appointment) {
          throw new Error('Appointment not found');
        }

        // Check if user has permission to view this appointment
        if (context.user.role === 'STYLIST' && appointment.stylistId.toString() !== context.user._id.toString()) {
          throw new ForbiddenError('You can only view your own appointments');
        }
        if (context.user.role === 'CLIENT' && appointment.clientId.toString() !== context.user._id.toString()) {
          throw new ForbiddenError('You can only view your own appointments');
        }

        return appointment;
      } catch (error) {
        console.error('Error fetching appointment:', error);
        throw error;
      }
    },

    availableTimeSlots: async (_, { date, serviceIds, stylistId }, context) => {
      const tenantId = checkTenant(context);
      checkPermission(context.user, 'view_availability');

      try {
        return await checkAvailability(tenantId, date, serviceIds, stylistId);
      } catch (error) {
        console.error('Error checking availability:', error);
        throw error;
      }
    }
  },

  Mutation: {
    createAppointment: async (_, { input }, context) => {
      const tenantId = checkTenant(context);
      checkPermission(context.user, 'create_appointment');

      try {
        // Validate appointment data
        await validateAppointment(tenantId, input);

        // Check availability
        const isAvailable = await checkAvailability(
          tenantId,
          input.date,
          input.serviceIds,
          input.stylistId
        );

        if (!isAvailable) {
          throw new Error('Selected time slot is not available');
        }

        // Create appointment
        const appointment = new Appointment({
          tenantId,
          ...input,
          status: 'SCHEDULED'
        });

        await appointment.save();
        await appointment.populate('client stylist services');

        // Publish events
        pubsub.publish(APPOINTMENT_CREATED, {
          appointmentCreated: appointment,
          tenantId
        });

        // Publish to message queue for notifications
        await publishEvent('appointment.created', {
          appointmentId: appointment._id,
          tenantId,
          type: 'NEW_APPOINTMENT',
          data: appointment
        });

        return appointment;
      } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }
    },

    updateAppointment: async (_, { id, input }, context) => {
      const tenantId = checkTenant(context);
      checkPermission(context.user, 'update_appointment');

      try {
        const appointment = await Appointment.findOne({ _id: id, tenantId });
        if (!appointment) {
          throw new Error('Appointment not found');
        }

        // Check if user has permission to update this appointment
        if (context.user.role === 'STYLIST' && appointment.stylistId.toString() !== context.user._id.toString()) {
          throw new ForbiddenError('You can only update your own appointments');
        }
        if (context.user.role === 'CLIENT' && appointment.clientId.toString() !== context.user._id.toString()) {
          throw new ForbiddenError('You can only update your own appointments');
        }

        // If date/time/stylist is being updated, check availability
        if (input.date || input.startTime || input.stylistId) {
          const isAvailable = await checkAvailability(
            tenantId,
            input.date || appointment.date,
            input.serviceIds || appointment.serviceIds,
            input.stylistId || appointment.stylistId,
            id
          );

          if (!isAvailable) {
            throw new Error('Selected time slot is not available');
          }
        }

        // Update appointment
        Object.assign(appointment, input);
        await appointment.save();
        await appointment.populate('client stylist services');

        // Publish events
        pubsub.publish(APPOINTMENT_UPDATED, {
          appointmentUpdated: appointment,
          tenantId
        });

        // Publish to message queue for notifications
        await publishEvent('appointment.updated', {
          appointmentId: appointment._id,
          tenantId,
          type: 'APPOINTMENT_UPDATED',
          data: appointment
        });

        return appointment;
      } catch (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }
    },

    cancelAppointment: async (_, { id, reason }, context) => {
      const tenantId = checkTenant(context);
      checkPermission(context.user, 'cancel_appointment');

      try {
        const appointment = await Appointment.findOne({ _id: id, tenantId });
        if (!appointment) {
          throw new Error('Appointment not found');
        }

        // Check if user has permission to cancel this appointment
        if (context.user.role === 'STYLIST' && appointment.stylistId.toString() !== context.user._id.toString()) {
          throw new ForbiddenError('You can only cancel your own appointments');
        }
        if (context.user.role === 'CLIENT' && appointment.clientId.toString() !== context.user._id.toString()) {
          throw new ForbiddenError('You can only cancel your own appointments');
        }

        // Update appointment
        appointment.status = 'CANCELLED';
        appointment.cancellationReason = reason;
        appointment.cancellationDate = new Date();
        await appointment.save();
        await appointment.populate('client stylist services');

        // Publish events
        pubsub.publish(APPOINTMENT_CANCELLED, {
          appointmentCancelled: appointment,
          tenantId
        });

        // Publish to message queue for notifications
        await publishEvent('appointment.cancelled', {
          appointmentId: appointment._id,
          tenantId,
          type: 'APPOINTMENT_CANCELLED',
          data: appointment
        });

        return appointment;
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        throw error;
      }
    }
  },

  Subscription: {
    appointmentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(APPOINTMENT_UPDATED),
        (payload, variables, context) => {
          return payload.tenantId.toString() === context.tenantId.toString();
        }
      )
    },

    appointmentCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(APPOINTMENT_CREATED),
        (payload, variables, context) => {
          return payload.tenantId.toString() === context.tenantId.toString();
        }
      )
    },

    appointmentCancelled: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(APPOINTMENT_CANCELLED),
        (payload, variables, context) => {
          return payload.tenantId.toString() === context.tenantId.toString();
        }
      )
    }
  }
};

module.exports = resolvers;