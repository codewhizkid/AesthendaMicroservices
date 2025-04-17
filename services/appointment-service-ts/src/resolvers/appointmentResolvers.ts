import { IResolvers } from "@graphql-tools/utils";
import Appointment, { AppointmentStatus } from "../models/Appointment";
import {
  GraphQLContext,
  AppointmentInput,
  AppointmentUpdateInput,
  CancelAppointmentInput,
  AppointmentFilterInput,
  AvailabilityInput,
  AppointmentResult,
  AppointmentsResult,
  AvailabilityResult,
  AppointmentError,
  ErrorCode,
  AppointmentEventType,
} from "../types";
import { publishToExchange } from "../utils/rabbitmq";
import config from "../config";

/**
 * Appointment resolvers with tenant isolation
 */
export const appointmentResolvers: IResolvers = {
  Query: {
    // Get appointments with filtering and pagination
    appointments: async (
      _: any,
      {
        filter,
        page = 1,
        limit = 20,
      }: { filter?: AppointmentFilterInput; page?: number; limit?: number },
      context: GraphQLContext,
    ): Promise<AppointmentsResult> => {
      try {
        const { tenantId } = context;

        // Build filter query
        const query: any = { tenantId };

        if (filter) {
          if (filter.stylistId) query.stylistId = filter.stylistId;
          if (filter.userId) query.userId = filter.userId;
          if (filter.status) query.status = filter.status;

          // Date range filter
          if (filter.fromDate || filter.toDate) {
            query.date = {};
            if (filter.fromDate) query.date.$gte = new Date(filter.fromDate);
            if (filter.toDate) query.date.$lte = new Date(filter.toDate);
          }
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Get total count
        const totalCount = await Appointment.countDocuments(query);

        // Get appointments
        const appointments = await Appointment.find(query)
          .sort({ date: -1, startTime: 1 })
          .skip(skip)
          .limit(limit);

        return {
          appointments,
          totalCount,
        };
      } catch (error) {
        console.error("Error retrieving appointments:", error);
        throw new Error("Failed to retrieve appointments");
      }
    },

    // Get a single appointment by ID
    appointment: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext,
    ) => {
      try {
        const { tenantId } = context;

        const appointment = await Appointment.findOne({
          _id: id,
          tenantId,
        });

        if (!appointment) {
          throw new AppointmentError(
            "Appointment not found",
            ErrorCode.APPOINTMENT_NOT_FOUND,
          );
        }

        return appointment;
      } catch (error) {
        if (error instanceof AppointmentError) {
          throw error;
        }
        console.error("Error retrieving appointment:", error);
        throw new Error("Failed to retrieve appointment");
      }
    },

    // Get all appointments for a user
    userAppointments: async (
      _: any,
      { userId, status }: { userId: string; status?: AppointmentStatus },
      context: GraphQLContext,
    ) => {
      try {
        const { tenantId } = context;

        const query: any = { tenantId, userId };
        if (status) query.status = status;

        return Appointment.find(query).sort({ date: -1, startTime: 1 });
      } catch (error) {
        console.error("Error retrieving user appointments:", error);
        throw new Error("Failed to retrieve user appointments");
      }
    },

    // Get all appointments for a stylist
    stylistAppointments: async (
      _: any,
      {
        stylistId,
        date,
        status,
      }: { stylistId: string; date?: string; status?: AppointmentStatus },
      context: GraphQLContext,
    ) => {
      try {
        const { tenantId } = context;

        const query: any = { tenantId, stylistId };

        if (date) {
          // Convert date string to Date object
          const startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);

          query.date = { $gte: startDate, $lte: endDate };
        }

        if (status) query.status = status;

        return Appointment.find(query).sort({ date: 1, startTime: 1 });
      } catch (error) {
        console.error("Error retrieving stylist appointments:", error);
        throw new Error("Failed to retrieve stylist appointments");
      }
    },

    // Get appointment availability for a stylist on a specific date
    stylistAvailability: async (
      _: any,
      { input }: { input: AvailabilityInput },
      context: GraphQLContext,
    ): Promise<AvailabilityResult> => {
      try {
        const { tenantId } = context;
        const { stylistId, date } = input;

        // Mock implementation - would typically check stylist's working hours and existing appointments
        const slots: any[] = [];

        // Generate time slots
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM
        const intervalMinutes = 30;

        // Get existing appointments for the stylist on this date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
          tenantId,
          stylistId,
          date: { $gte: startDate, $lte: endDate },
          status: {
            $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
          },
        });

        // Create map of busy times
        const busyTimes: Record<string, boolean> = {};
        existingAppointments.forEach((appointment) => {
          const startTime = appointment.startTime;
          const endTime = appointment.endTime;

          // Mark all slots between start and end time as busy
          let currentTime = startTime;
          while (currentTime < endTime) {
            busyTimes[currentTime] = true;

            // Increment by 30 minutes
            const [hours, minutes] = currentTime.split(":").map(Number);
            let newMinutes = minutes + intervalMinutes;
            let newHours = hours;

            if (newMinutes >= 60) {
              newMinutes -= 60;
              newHours += 1;
            }

            currentTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
          }
        });

        // Generate available slots
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += intervalMinutes) {
            const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

            // Calculate end time
            let endHour = hour;
            let endMinute = minute + intervalMinutes;

            if (endMinute >= 60) {
              endMinute -= 60;
              endHour += 1;
            }

            const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

            slots.push({
              stylistId,
              date,
              startTime,
              endTime,
              available: !busyTimes[startTime],
            });
          }
        }

        return {
          slots,
          date,
          stylistId,
        };
      } catch (error) {
        console.error("Error retrieving stylist availability:", error);
        throw new Error("Failed to retrieve stylist availability");
      }
    },
  },

  Mutation: {
    // Create a new appointment
    createAppointment: async (
      _: any,
      { input }: { input: AppointmentInput },
      context: GraphQLContext,
    ): Promise<AppointmentResult> => {
      try {
        const { tenantId } = context;

        // Validate appointment time
        const appointmentDate = new Date(input.date);

        if (appointmentDate < new Date()) {
          throw new AppointmentError(
            "Cannot create appointment in the past",
            ErrorCode.PAST_APPOINTMENT,
          );
        }

        // Check for double booking
        const startDate = new Date(input.date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(input.date);
        endDate.setHours(23, 59, 59, 999);

        const existingAppointment = await Appointment.findOne({
          tenantId,
          stylistId: input.stylistId,
          date: { $gte: startDate, $lte: endDate },
          $or: [
            {
              startTime: { $lt: input.endTime },
              endTime: { $gt: input.startTime },
            },
            {
              startTime: input.startTime,
              endTime: input.endTime,
            },
          ],
          status: {
            $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
          },
        });

        if (existingAppointment) {
          throw new AppointmentError(
            "Stylist already has an appointment during this time",
            ErrorCode.DOUBLE_BOOKING,
          );
        }

        // Create the appointment
        const appointment = new Appointment({
          ...input,
          tenantId,
          status: AppointmentStatus.SCHEDULED,
        });

        await appointment.save();

        // Publish appointment created event
        await publishToExchange(
          config.rabbitMQ.exchanges.events,
          "appointment.created",
          {
            type: AppointmentEventType.CREATED,
            appointmentId: appointment._id,
            tenantId,
            userId: input.userId,
            stylistId: input.stylistId,
            date: input.date,
            status: appointment.status,
            timestamp: new Date().toISOString(),
          },
          { tenantId },
        );

        return {
          success: true,
          message: "Appointment created successfully",
          appointment,
        };
      } catch (error) {
        if (error instanceof AppointmentError) {
          return {
            success: false,
            message: error.message,
          };
        }

        console.error("Error creating appointment:", error);
        return {
          success: false,
          message: "Failed to create appointment",
        };
      }
    },

    // Update an existing appointment
    updateAppointment: async (
      _: any,
      { input }: { input: AppointmentUpdateInput },
      context: GraphQLContext,
    ): Promise<AppointmentResult> => {
      try {
        const { tenantId } = context;

        // Find the appointment
        const appointment = await Appointment.findOne({
          _id: input.id,
          tenantId,
        });

        if (!appointment) {
          throw new AppointmentError(
            "Appointment not found",
            ErrorCode.APPOINTMENT_NOT_FOUND,
          );
        }

        // Validate status transitions
        if (input.status) {
          const currentStatus = appointment.status;
          const newStatus = input.status;

          // Check for invalid transitions
          const invalidTransitions: Record<string, string[]> = {
            [AppointmentStatus.CANCELLED]: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.COMPLETED,
            ],
            [AppointmentStatus.COMPLETED]: [
              AppointmentStatus.SCHEDULED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.CANCELLED,
            ],
            [AppointmentStatus.NO_SHOW]: [
              AppointmentStatus.CANCELLED,
              AppointmentStatus.COMPLETED,
            ],
          };

          if (
            invalidTransitions[currentStatus] &&
            invalidTransitions[currentStatus].includes(newStatus)
          ) {
            throw new AppointmentError(
              `Cannot transition from ${currentStatus} to ${newStatus}`,
              ErrorCode.INVALID_STATUS_TRANSITION,
            );
          }
        }

        // Update fields
        Object.keys(input).forEach((key) => {
          if (
            key !== "id" &&
            input[key as keyof AppointmentUpdateInput] !== undefined
          ) {
            (appointment as any)[key] =
              input[key as keyof AppointmentUpdateInput];
          }
        });

        await appointment.save();

        // Publish appointment updated event
        await publishToExchange(
          config.rabbitMQ.exchanges.events,
          "appointment.updated",
          {
            type: AppointmentEventType.UPDATED,
            appointmentId: appointment._id,
            tenantId,
            userId: appointment.userId,
            stylistId: appointment.stylistId,
            date: appointment.date.toISOString(),
            status: appointment.status,
            timestamp: new Date().toISOString(),
          },
          { tenantId },
        );

        return {
          success: true,
          message: "Appointment updated successfully",
          appointment,
        };
      } catch (error) {
        if (error instanceof AppointmentError) {
          return {
            success: false,
            message: error.message,
          };
        }

        console.error("Error updating appointment:", error);
        return {
          success: false,
          message: "Failed to update appointment",
        };
      }
    },

    // Cancel an appointment
    cancelAppointment: async (
      _: any,
      { input }: { input: CancelAppointmentInput },
      context: GraphQLContext,
    ): Promise<AppointmentResult> => {
      try {
        const { tenantId } = context;

        // Find the appointment
        const appointment = await Appointment.findOne({
          _id: input.id,
          tenantId,
        });

        if (!appointment) {
          throw new AppointmentError(
            "Appointment not found",
            ErrorCode.APPOINTMENT_NOT_FOUND,
          );
        }

        // Can't cancel a completed appointment
        if (appointment.status === AppointmentStatus.COMPLETED) {
          throw new AppointmentError(
            "Cannot cancel a completed appointment",
            ErrorCode.INVALID_STATUS_TRANSITION,
          );
        }

        // Update the appointment
        appointment.status = AppointmentStatus.CANCELLED;
        if (input.cancellationReason) {
          appointment.cancellationReason = input.cancellationReason;
        }

        await appointment.save();

        // Publish appointment cancelled event
        await publishToExchange(
          config.rabbitMQ.exchanges.events,
          "appointment.cancelled",
          {
            type: AppointmentEventType.CANCELLED,
            appointmentId: appointment._id,
            tenantId,
            userId: appointment.userId,
            stylistId: appointment.stylistId,
            date: appointment.date.toISOString(),
            status: appointment.status,
            timestamp: new Date().toISOString(),
          },
          { tenantId },
        );

        return {
          success: true,
          message: "Appointment cancelled successfully",
          appointment,
        };
      } catch (error) {
        if (error instanceof AppointmentError) {
          return {
            success: false,
            message: error.message,
          };
        }

        console.error("Error cancelling appointment:", error);
        return {
          success: false,
          message: "Failed to cancel appointment",
        };
      }
    },

    // Confirm an appointment
    confirmAppointment: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext,
    ): Promise<AppointmentResult> => {
      try {
        const { tenantId } = context;

        // Find the appointment
        const appointment = await Appointment.findOne({
          _id: id,
          tenantId,
        });

        if (!appointment) {
          throw new AppointmentError(
            "Appointment not found",
            ErrorCode.APPOINTMENT_NOT_FOUND,
          );
        }

        // Only scheduled appointments can be confirmed
        if (appointment.status !== AppointmentStatus.SCHEDULED) {
          throw new AppointmentError(
            `Cannot confirm appointment with status ${appointment.status}`,
            ErrorCode.INVALID_STATUS_TRANSITION,
          );
        }

        // Update the appointment
        appointment.status = AppointmentStatus.CONFIRMED;
        await appointment.save();

        // Publish appointment confirmed event
        await publishToExchange(
          config.rabbitMQ.exchanges.events,
          "appointment.confirmed",
          {
            type: AppointmentEventType.CONFIRMED,
            appointmentId: appointment._id,
            tenantId,
            userId: appointment.userId,
            stylistId: appointment.stylistId,
            date: appointment.date.toISOString(),
            status: appointment.status,
            timestamp: new Date().toISOString(),
          },
          { tenantId },
        );

        return {
          success: true,
          message: "Appointment confirmed successfully",
          appointment,
        };
      } catch (error) {
        if (error instanceof AppointmentError) {
          return {
            success: false,
            message: error.message,
          };
        }

        console.error("Error confirming appointment:", error);
        return {
          success: false,
          message: "Failed to confirm appointment",
        };
      }
    },

    // Mark an appointment as completed
    completeAppointment: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext,
    ): Promise<AppointmentResult> => {
      try {
        const { tenantId } = context;

        // Find the appointment
        const appointment = await Appointment.findOne({
          _id: id,
          tenantId,
        });

        if (!appointment) {
          throw new AppointmentError(
            "Appointment not found",
            ErrorCode.APPOINTMENT_NOT_FOUND,
          );
        }

        // Only confirmed or in-progress appointments can be completed
        if (
          ![
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
          ].includes(appointment.status)
        ) {
          throw new AppointmentError(
            `Cannot complete appointment with status ${appointment.status}`,
            ErrorCode.INVALID_STATUS_TRANSITION,
          );
        }

        // Update the appointment
        appointment.status = AppointmentStatus.COMPLETED;
        await appointment.save();

        // Publish appointment completed event
        await publishToExchange(
          config.rabbitMQ.exchanges.events,
          "appointment.completed",
          {
            type: AppointmentEventType.COMPLETED,
            appointmentId: appointment._id,
            tenantId,
            userId: appointment.userId,
            stylistId: appointment.stylistId,
            date: appointment.date.toISOString(),
            status: appointment.status,
            timestamp: new Date().toISOString(),
          },
          { tenantId },
        );

        return {
          success: true,
          message: "Appointment marked as completed",
          appointment,
        };
      } catch (error) {
        if (error instanceof AppointmentError) {
          return {
            success: false,
            message: error.message,
          };
        }

        console.error("Error completing appointment:", error);
        return {
          success: false,
          message: "Failed to complete appointment",
        };
      }
    },

    // Mark an appointment as no-show
    markNoShow: async (
      _: any,
      { id }: { id: string },
      context: GraphQLContext,
    ): Promise<AppointmentResult> => {
      try {
        const { tenantId } = context;

        // Find the appointment
        const appointment = await Appointment.findOne({
          _id: id,
          tenantId,
        });

        if (!appointment) {
          throw new AppointmentError(
            "Appointment not found",
            ErrorCode.APPOINTMENT_NOT_FOUND,
          );
        }

        // Only confirmed or scheduled appointments can be marked as no-show
        if (
          ![AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED].includes(
            appointment.status,
          )
        ) {
          throw new AppointmentError(
            `Cannot mark appointment with status ${appointment.status} as no-show`,
            ErrorCode.INVALID_STATUS_TRANSITION,
          );
        }

        // Update the appointment
        appointment.status = AppointmentStatus.NO_SHOW;
        await appointment.save();

        // Publish appointment no-show event
        await publishToExchange(
          config.rabbitMQ.exchanges.events,
          "appointment.no_show",
          {
            type: AppointmentEventType.NO_SHOW,
            appointmentId: appointment._id,
            tenantId,
            userId: appointment.userId,
            stylistId: appointment.stylistId,
            date: appointment.date.toISOString(),
            status: appointment.status,
            timestamp: new Date().toISOString(),
          },
          { tenantId },
        );

        return {
          success: true,
          message: "Appointment marked as no-show",
          appointment,
        };
      } catch (error) {
        if (error instanceof AppointmentError) {
          return {
            success: false,
            message: error.message,
          };
        }

        console.error("Error marking appointment as no-show:", error);
        return {
          success: false,
          message: "Failed to mark appointment as no-show",
        };
      }
    },
  },
};

export default appointmentResolvers;
