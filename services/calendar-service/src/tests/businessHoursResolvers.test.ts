import { BusinessHours, IBusinessHours } from '../models/BusinessHours';
import { businessHoursResolvers } from '../resolvers/businessHoursResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestBusinessHours } from './testUtils';
import { GraphQLError } from 'graphql';
import { Document, Types } from 'mongoose';

describe('Business Hours Resolvers', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Query', () => {
    describe('getBusinessHours', () => {
      it('should return business hours when they exist and belong to the tenant', async () => {
        const context = createMockContext();
        const testBusinessHours = new BusinessHours(createTestBusinessHours()) as Document<unknown, {}, IBusinessHours> & IBusinessHours & { _id: Types.ObjectId };
        await testBusinessHours.save();

        const result = await businessHoursResolvers.Query.getBusinessHours(
          null,
          { id: testBusinessHours._id.toString() },
          context
        );

        expect(result).toBeDefined();
        expect(result.dayOfWeek).toBe(1);
        expect(result.tenantId).toBe(context.tenantId);
      });

      it('should throw NOT_FOUND when business hours do not exist', async () => {
        const context = createMockContext();
        await expect(
          businessHoursResolvers.Query.getBusinessHours(
            null,
            { id: '507f1f77bcf86cd799439011' },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });

      it('should not return business hours from different tenant', async () => {
        const testBusinessHours = new BusinessHours(createTestBusinessHours({ tenantId: 'other-tenant' })) as Document<unknown, {}, IBusinessHours> & IBusinessHours & { _id: Types.ObjectId };
        await testBusinessHours.save();

        const context = createMockContext();
        await expect(
          businessHoursResolvers.Query.getBusinessHours(
            null,
            { id: testBusinessHours._id.toString() },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('listBusinessHours', () => {
      it('should return business hours for tenant', async () => {
        const context = createMockContext();
        const businessHours = [
          createTestBusinessHours({ dayOfWeek: 1 }),
          createTestBusinessHours({ dayOfWeek: 2 }),
          createTestBusinessHours({ dayOfWeek: 3 }),
        ];
        await BusinessHours.insertMany(businessHours);

        const result = await businessHoursResolvers.Query.listBusinessHours(
          null,
          {},
          context
        );

        expect(result).toHaveLength(3);
        expect(result[0].dayOfWeek).toBe(1);
      });

      it('should filter business hours by day of week', async () => {
        const context = createMockContext();
        await BusinessHours.insertMany([
          createTestBusinessHours({ dayOfWeek: 1 }),
          createTestBusinessHours({ dayOfWeek: 2 }),
        ]);

        const result = await businessHoursResolvers.Query.listBusinessHours(
          null,
          { dayOfWeek: 1 },
          context
        );

        expect(result).toHaveLength(1);
        expect(result[0].dayOfWeek).toBe(1);
      });
    });
  });

  describe('Mutation', () => {
    describe('createBusinessHours', () => {
      it('should create business hours and return them', async () => {
        const context = createMockContext();
        const input = {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isOpen: true,
        };

        const result = await businessHoursResolvers.Mutation.createBusinessHours(
          null,
          { input },
          context
        );

        expect(result).toBeDefined();
        expect(result.dayOfWeek).toBe(input.dayOfWeek);
        expect(result.tenantId).toBe(context.tenantId);

        const savedBusinessHours = await BusinessHours.findById(result._id);
        expect(savedBusinessHours).toBeDefined();
        expect(savedBusinessHours?.tenantId).toBe(context.tenantId);
      });

      it('should validate business hours input', async () => {
        const context = createMockContext();
        const input = {
          dayOfWeek: 8, // Invalid: day of week must be 0-6
          startTime: '09:00',
          endTime: '17:00',
          isOpen: true,
        };

        await expect(
          businessHoursResolvers.Mutation.createBusinessHours(null, { input }, context)
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('updateBusinessHours', () => {
      it('should update business hours when they exist and belong to tenant', async () => {
        const context = createMockContext();
        const testBusinessHours = new BusinessHours(createTestBusinessHours()) as Document<unknown, {}, IBusinessHours> & IBusinessHours & { _id: Types.ObjectId };
        await testBusinessHours.save();

        const input = {
          dayOfWeek: 1,
          startTime: '10:00',
          endTime: '18:00',
          isOpen: true,
        };

        const result = await businessHoursResolvers.Mutation.updateBusinessHours(
          null,
          { id: testBusinessHours._id.toString(), input },
          context
        );

        expect(result.startTime).toBe('10:00');
        const updatedBusinessHours = await BusinessHours.findById(testBusinessHours._id);
        expect(updatedBusinessHours?.startTime).toBe('10:00');
      });

      it('should not update business hours from different tenant', async () => {
        const testBusinessHours = new BusinessHours(createTestBusinessHours({ tenantId: 'other-tenant' })) as Document<unknown, {}, IBusinessHours> & IBusinessHours & { _id: Types.ObjectId };
        await testBusinessHours.save();

        const context = createMockContext();
        const input = {
          dayOfWeek: 1,
          startTime: '10:00',
          endTime: '18:00',
          isOpen: true,
        };

        await expect(
          businessHoursResolvers.Mutation.updateBusinessHours(
            null,
            { id: testBusinessHours._id.toString(), input },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('deleteBusinessHours', () => {
      it('should delete business hours when they exist and belong to tenant', async () => {
        const context = createMockContext();
        const testBusinessHours = new BusinessHours(createTestBusinessHours()) as Document<unknown, {}, IBusinessHours> & IBusinessHours & { _id: Types.ObjectId };
        await testBusinessHours.save();

        const result = await businessHoursResolvers.Mutation.deleteBusinessHours(
          null,
          { id: testBusinessHours._id.toString() },
          context
        );

        expect(result).toBe(true);
        const deletedBusinessHours = await BusinessHours.findById(testBusinessHours._id);
        expect(deletedBusinessHours).toBeNull();
      });

      it('should not delete business hours from different tenant', async () => {
        const testBusinessHours = new BusinessHours(createTestBusinessHours({ tenantId: 'other-tenant' })) as Document<unknown, {}, IBusinessHours> & IBusinessHours & { _id: Types.ObjectId };
        await testBusinessHours.save();

        const context = createMockContext();
        await expect(
          businessHoursResolvers.Mutation.deleteBusinessHours(
            null,
            { id: testBusinessHours._id.toString() },
            context
          )
        ).rejects.toThrow(GraphQLError);

        const businessHoursStillExist = await BusinessHours.findById(testBusinessHours._id);
        expect(businessHoursStillExist).toBeDefined();
      });
    });
  });
}); 