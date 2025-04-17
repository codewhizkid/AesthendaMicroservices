import { Event } from '../../models/Event';
import { Resource } from '../../models/Resource';
import { BusinessHours } from '../../models/BusinessHours';
import { eventResolvers } from '../../resolvers/eventResolvers';
import { resourceResolvers } from '../../resolvers/resourceResolvers';
import { businessHoursResolvers } from '../../resolvers/businessHoursResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent, createTestResource } from '../testUtils';
import { EventType, UserRole } from '../../types';
import { validateEventInput, validateResourceInput, validateBusinessHoursInput } from '../../middleware/validation';

describe('Calendar Data Validation Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Event Validation', () => {
    it('should validate event title length', () => {
      const longTitle = 'a'.repeat(256); // Exceeds max length
      const input = {
        title: longTitle,
        startTime: new Date(2024, 3, 20, 10, 0),
        endTime: new Date(2024, 3, 20, 11, 0),
        type: EventType.MEETING,
      };

      expect(() => validateEventInput(input)).toThrow();
    });

    it('should validate event date ranges', () => {
      const input = {
        title: 'Test Event',
        startTime: new Date(2024, 3, 20, 11, 0),
        endTime: new Date(2024, 3, 20, 10, 0), // End before start
        type: EventType.MEETING,
      };

      expect(() => validateEventInput(input)).toThrow();
    });

    it('should validate event type enum values', () => {
      const input = {
        title: 'Test Event',
        startTime: new Date(2024, 3, 20, 10, 0),
        endTime: new Date(2024, 3, 20, 11, 0),
        type: 'INVALID_TYPE' as EventType,
      };

      expect(() => validateEventInput(input)).toThrow();
    });

    it('should validate optional metadata format', () => {
      const input = {
        title: 'Test Event',
        startTime: new Date(2024, 3, 20, 10, 0),
        endTime: new Date(2024, 3, 20, 11, 0),
        type: EventType.MEETING,
        metadata: { invalidKey: undefined } as Record<string, any>, // Invalid metadata format
      };

      expect(() => validateEventInput(input)).toThrow();
    });
  });

  describe('Resource Validation', () => {
    it('should validate resource title format', () => {
      const input = {
        title: '', // Empty title
        type: 'room',
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        }],
      };

      expect(() => validateResourceInput(input)).toThrow();
    });

    it('should validate availability time format', () => {
      const input = {
        title: 'Test Room',
        type: 'room',
        availability: [{
          dayOfWeek: 1,
          startTime: '9:00', // Invalid format (should be HH:mm)
          endTime: '17:00',
        }],
      };

      expect(() => validateResourceInput(input)).toThrow();
    });

    it('should validate availability day range', () => {
      const input = {
        title: 'Test Room',
        type: 'room',
        availability: [{
          dayOfWeek: 7, // Invalid day (should be 0-6)
          startTime: '09:00',
          endTime: '17:00',
        }],
      };

      expect(() => validateResourceInput(input)).toThrow();
    });

    it('should validate capacity constraints', () => {
      const input = {
        title: 'Test Room',
        type: 'room',
        capacity: -1, // Invalid capacity
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        }],
      };

      expect(() => validateResourceInput(input)).toThrow();
    });
  });

  describe('Business Hours Validation', () => {
    it('should validate business hours time format', () => {
      const input = {
        dayOfWeek: 1,
        startTime: '9am', // Invalid format
        endTime: '5pm', // Invalid format
        isOpen: true,
      };

      expect(() => validateBusinessHoursInput(input)).toThrow();
    });

    it('should validate business hours day range', () => {
      const input = {
        dayOfWeek: -1, // Invalid day
        startTime: '09:00',
        endTime: '17:00',
        isOpen: true,
      };

      expect(() => validateBusinessHoursInput(input)).toThrow();
    });

    it('should validate business hours time range', () => {
      const input = {
        dayOfWeek: 1,
        startTime: '17:00',
        endTime: '09:00', // End before start
        isOpen: true,
      };

      expect(() => validateBusinessHoursInput(input)).toThrow();
    });

    it('should validate isOpen flag type', () => {
      const input = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isOpen: 'yes' as any, // Invalid boolean
      };

      expect(() => validateBusinessHoursInput(input)).toThrow();
    });
  });

  describe('Cross-Entity Validation', () => {
    it('should validate event creation against business hours', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Set up business hours
      await businessHoursResolvers.Mutation.createBusinessHours(
        null,
        {
          input: {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isOpen: true,
          },
        },
        context
      );

      // Try to create event outside business hours
      const eventInput = {
        title: 'After Hours Event',
        startTime: new Date(2024, 3, 20, 18, 0), // 6 PM
        endTime: new Date(2024, 3, 20, 19, 0),
        type: EventType.MEETING,
      };

      await expect(
        eventResolvers.Mutation.createEvent(null, { input: eventInput }, context)
      ).rejects.toThrow();
    });

    it('should validate resource availability against existing events', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        {
          input: {
            title: 'Test Room',
            type: 'room',
            availability: [{
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            }],
          },
        },
        context
      );

      // Create an event
      await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'Existing Event',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
            resourceId: resource._id,
          },
        },
        context
      );

      // Try to create overlapping event
      const overlappingInput = {
        title: 'Overlapping Event',
        startTime: new Date(2024, 3, 20, 10, 30),
        endTime: new Date(2024, 3, 20, 11, 30),
        type: EventType.MEETING,
        resourceId: resource._id,
      };

      await expect(
        eventResolvers.Mutation.createEvent(null, { input: overlappingInput }, context)
      ).rejects.toThrow();
    });
  });
}); 