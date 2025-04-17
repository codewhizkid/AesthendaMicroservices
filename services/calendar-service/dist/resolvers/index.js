"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_scalars_1 = require("graphql-scalars");
const eventResolvers_1 = require("./eventResolvers");
const resourceResolvers_1 = require("./resourceResolvers");
exports.resolvers = {
    DateTime: graphql_scalars_1.DateTimeResolver,
    JSON: graphql_scalars_1.JSONResolver,
    Query: {
        ...eventResolvers_1.eventResolvers.Query,
        ...resourceResolvers_1.resourceResolvers.Query
    },
    Mutation: {
        ...eventResolvers_1.eventResolvers.Mutation,
        ...resourceResolvers_1.resourceResolvers.Mutation
    },
    Subscription: {
        ...eventResolvers_1.eventResolvers.Subscription,
        ...resourceResolvers_1.resourceResolvers.Subscription
    }
};
//# sourceMappingURL=index.js.map