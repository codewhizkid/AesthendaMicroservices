"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessHoursResolvers = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
const graphql_1 = require("graphql");
const BusinessHours_1 = require("../models/BusinessHours");
const validation_1 = require("../middleware/validation");
const config_1 = require("../config");
const utils_1 = require("../utils");
const pubsub = new graphql_subscriptions_1.PubSub();
const BUSINESS_HOURS_UPDATED = 'BUSINESS_HOURS_UPDATED';
exports.businessHoursResolvers = {
    Query: {
        getBusinessHours: async (_, { id }, context) => {
            const businessHours = await BusinessHours_1.BusinessHours.findOne({ _id: id, tenantId: context.tenantId });
            if (!businessHours) {
                throw new graphql_1.GraphQLError(config_1.errorMessages.NOT_FOUND, {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            return (0, utils_1.toPlainObject)(businessHours);
        },
        listBusinessHours: async (_, { dayOfWeek }, context) => {
            const query = { tenantId: context.tenantId };
            if (typeof dayOfWeek === 'number') {
                query.dayOfWeek = dayOfWeek;
            }
            const businessHours = await BusinessHours_1.BusinessHours.find(query).sort({ dayOfWeek: 1, startTime: 1 });
            return businessHours.map(hours => (0, utils_1.toPlainObject)(hours));
        }
    },
    Mutation: {
        createBusinessHours: async (_, { input }, context) => {
            try {
                (0, validation_1.validateBusinessHoursInput)(input);
                const businessHours = new BusinessHours_1.BusinessHours({
                    ...input,
                    tenantId: context.tenantId,
                });
                await businessHours.save();
                const plainBusinessHours = (0, utils_1.toPlainObject)(businessHours);
                pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${context.tenantId}`, {
                    businessHoursUpdated: plainBusinessHours,
                });
                return plainBusinessHours;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                throw new graphql_1.GraphQLError(config_1.errorMessages.INTERNAL_ERROR, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },
        updateBusinessHours: async (_, { id, input }, context) => {
            try {
                (0, validation_1.validateBusinessHoursInput)(input);
                const businessHours = await BusinessHours_1.BusinessHours.findOneAndUpdate({ _id: id, tenantId: context.tenantId }, { $set: input }, { new: true });
                if (!businessHours) {
                    throw new graphql_1.GraphQLError(config_1.errorMessages.NOT_FOUND, {
                        extensions: { code: 'NOT_FOUND' }
                    });
                }
                const plainBusinessHours = (0, utils_1.toPlainObject)(businessHours);
                pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${context.tenantId}`, {
                    businessHoursUpdated: plainBusinessHours,
                });
                return plainBusinessHours;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                throw new graphql_1.GraphQLError(config_1.errorMessages.INTERNAL_ERROR, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },
        deleteBusinessHours: async (_, { id }, context) => {
            try {
                const businessHours = await BusinessHours_1.BusinessHours.findOneAndDelete({
                    _id: id,
                    tenantId: context.tenantId,
                });
                if (!businessHours) {
                    throw new graphql_1.GraphQLError(config_1.errorMessages.NOT_FOUND, {
                        extensions: { code: 'NOT_FOUND' }
                    });
                }
                const plainBusinessHours = (0, utils_1.toPlainObject)(businessHours);
                pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${context.tenantId}`, {
                    businessHoursUpdated: { ...plainBusinessHours, deleted: true },
                });
                return true;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                throw new graphql_1.GraphQLError(config_1.errorMessages.INTERNAL_ERROR, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },
    },
    Subscription: {
        businessHoursUpdated: {
            subscribe: (_, { tenantId }) => pubsub.asyncIterator(`${BUSINESS_HOURS_UPDATED}.${tenantId}`),
        },
    },
};
//# sourceMappingURL=businessHoursResolvers.js.map