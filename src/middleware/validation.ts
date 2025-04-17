import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { EventInput, ResourceInput, BusinessHoursInput } from '../types';

export const validateEventInput = (input: EventInput) => {
  const schema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    startTime: z.date(),
    endTime: z.date(),
    allDay: z.boolean().optional(),
    recurringRule: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    location: z.string().max(200).optional(),
    status: z.enum(['CONFIRMED', 'TENTATIVE', 'CANCELLED']).optional(),
    metadata: z.record(z.any()).optional()
  });

  try {
    schema.parse(input);
  } catch (error) {
    throw new GraphQLError('Invalid event input', {
      extensions: { code: 'BAD_USER_INPUT', error }
    });
  }
};

export const validateResourceInput = (input: ResourceInput) => {
  const schema = z.object({
    title: z.string().min(1).max(100),
    type: z.string().min(1),
    description: z.string().max(500).optional(),
    availability: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string()
      })
    ),
    metadata: z.record(z.any()).optional()
  });

  try {
    schema.parse(input);
  } catch (error) {
    throw new GraphQLError('Invalid resource input', {
      extensions: { code: 'BAD_USER_INPUT', error }
    });
  }
};

export const validateBusinessHoursInput = (input: BusinessHoursInput) => {
  const schema = z.object({
    tenantId: z.string(),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    isOpen: z.boolean()
  });

  try {
    schema.parse(input);
  } catch (error) {
    throw new GraphQLError('Invalid business hours input', {
      extensions: { code: 'BAD_USER_INPUT', error }
    });
  }
}; 