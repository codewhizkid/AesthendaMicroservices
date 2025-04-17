import { GraphQLError } from 'graphql';
import { errorMessages } from '../config';
import { EventInput, ResourceInput, BusinessHours } from '../types';

export const validateEventInput = (input: EventInput): void => {
  if (!input.title?.trim()) {
    throw new GraphQLError('Title is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (!input.startTime || !input.endTime) {
    throw new GraphQLError('Start time and end time are required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (input.startTime >= input.endTime) {
    throw new GraphQLError('End time must be after start time', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }
};

export const validateResourceInput = (input: ResourceInput): void => {
  if (!input.title?.trim()) {
    throw new GraphQLError('Title is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (!input.type) {
    throw new GraphQLError('Resource type is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (input.availability) {
    input.availability.forEach((slot, index) => {
      if (!slot.startTime || !slot.endTime) {
        throw new GraphQLError(`Availability slot ${index + 1} must have start and end time`, {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        throw new GraphQLError(`Invalid time format in availability slot ${index + 1}. Use HH:mm`, {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
    });
  }
};

export const validateBusinessHoursInput = (input: BusinessHours): void => {
  if (typeof input.dayOfWeek !== 'number' || input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    throw new GraphQLError('Day of week must be a number between 0 and 6', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (!input.startTime || !input.endTime) {
    throw new GraphQLError('Start time and end time are required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
    throw new GraphQLError('Invalid time format. Use HH:mm', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  if (typeof input.isOpen !== 'boolean') {
    throw new GraphQLError('isOpen must be a boolean', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }
}; 