import { Resource, IResource } from '../models/Resource';
import { resourceResolvers } from '../resolvers/resourceResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestResource } from './testUtils';
import { GraphQLError } from 'graphql';
import { Document, Types } from 'mongoose';
import { ResourceInput } from '../types';

describe('Resource Resolvers', () => {
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
    describe('getResource', () => {
      it('should return a resource when it exists and belongs to the tenant', async () => {
        const context = createMockContext();
        const testResource = new Resource(createTestResource()) as Document<unknown, {}, IResource> & IResource & { _id: Types.ObjectId };
        await testResource.save();

        const result = await resourceResolvers.Query.getResource(
          null,
          { id: testResource._id.toString() },
          context
        );

        expect(result).toBeDefined();
        expect(result.title).toBe('Test Resource');
        expect(result.tenantId).toBe(context.tenantId);
      });

      it('should throw NOT_FOUND when resource does not exist', async () => {
        const context = createMockContext();
        await expect(
          resourceResolvers.Query.getResource(
            null,
            { id: '507f1f77bcf86cd799439011' },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });

      it('should not return resource from different tenant', async () => {
        const testResource = new Resource(createTestResource({ tenantId: 'other-tenant' })) as Document<unknown, {}, IResource> & IResource & { _id: Types.ObjectId };
        await testResource.save();

        const context = createMockContext();
        await expect(
          resourceResolvers.Query.getResource(
            null,
            { id: testResource._id.toString() },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('listResources', () => {
      it('should return paginated resources for tenant', async () => {
        const context = createMockContext();
        const resources = [
          createTestResource({ title: 'Resource 1' }),
          createTestResource({ title: 'Resource 2' }),
          createTestResource({ title: 'Resource 3' }),
        ];
        await Resource.insertMany(resources);

        const result = await resourceResolvers.Query.listResources(
          null,
          { page: 1, pageSize: 2 },
          context
        );

        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(3);
        expect(result.totalPages).toBe(2);
      });

      it('should filter resources by type', async () => {
        const context = createMockContext();
        await Resource.insertMany([
          createTestResource({ type: 'room' }),
          createTestResource({ type: 'equipment' }),
        ]);

        const result = await resourceResolvers.Query.listResources(
          null,
          { type: 'room' },
          context
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].type).toBe('room');
      });
    });
  });

  describe('Mutation', () => {
    describe('createResource', () => {
      it('should create resource and return it', async () => {
        const context = createMockContext();
        const input = {
          title: 'New Resource',
          type: 'room',
          availability: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
        };

        const result = await resourceResolvers.Mutation.createResource(
          null,
          { input },
          context
        );

        expect(result).toBeDefined();
        expect(result.title).toBe(input.title);
        expect(result.tenantId).toBe(context.tenantId);

        const savedResource = await Resource.findById(result._id);
        expect(savedResource).toBeDefined();
        expect(savedResource?.tenantId).toBe(context.tenantId);
      });

      it('should validate resource input', async () => {
        const context = createMockContext();
        const input = {
          title: '', // Invalid: empty title
          type: 'room',
          availability: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
        };

        await expect(
          resourceResolvers.Mutation.createResource(null, { input }, context)
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('updateResource', () => {
      it('should update resource when it exists and belongs to tenant', async () => {
        const context = createMockContext();
        const testResource = new Resource(createTestResource()) as Document<unknown, {}, IResource> & IResource & { _id: Types.ObjectId };
        await testResource.save();

        const input: ResourceInput = {
          title: 'Updated Resource',
          type: 'room',
          availability: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
        };

        const result = await resourceResolvers.Mutation.updateResource(
          null,
          { id: testResource._id.toString(), input },
          context
        );

        expect(result.title).toBe('Updated Resource');
        const updatedResource = await Resource.findById(testResource._id);
        expect(updatedResource?.title).toBe('Updated Resource');
      });

      it('should not update resource from different tenant', async () => {
        const testResource = new Resource(createTestResource({ tenantId: 'other-tenant' })) as Document<unknown, {}, IResource> & IResource & { _id: Types.ObjectId };
        await testResource.save();

        const context = createMockContext();
        const input: ResourceInput = {
          title: 'Updated Resource',
          type: 'room',
          availability: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
        };

        await expect(
          resourceResolvers.Mutation.updateResource(
            null,
            { id: testResource._id.toString(), input },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('deleteResource', () => {
      it('should delete resource when it exists and belongs to tenant', async () => {
        const context = createMockContext();
        const testResource = new Resource(createTestResource()) as Document<unknown, {}, IResource> & IResource & { _id: Types.ObjectId };
        await testResource.save();

        const result = await resourceResolvers.Mutation.deleteResource(
          null,
          { id: testResource._id.toString() },
          context
        );

        expect(result).toBe(true);
        const deletedResource = await Resource.findById(testResource._id);
        expect(deletedResource).toBeNull();
      });

      it('should not delete resource from different tenant', async () => {
        const testResource = new Resource(createTestResource({ tenantId: 'other-tenant' })) as Document<unknown, {}, IResource> & IResource & { _id: Types.ObjectId };
        await testResource.save();

        const context = createMockContext();
        await expect(
          resourceResolvers.Mutation.deleteResource(
            null,
            { id: testResource._id.toString() },
            context
          )
        ).rejects.toThrow(GraphQLError);

        const resourceStillExists = await Resource.findById(testResource._id);
        expect(resourceStillExists).toBeDefined();
      });
    });
  });
}); 