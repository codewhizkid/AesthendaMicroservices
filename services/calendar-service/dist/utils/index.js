"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOverlapping = exports.validateDateRange = exports.sanitizeSearchQuery = exports.generateSlug = exports.validatePagination = exports.formatError = exports.validateTenantAccess = void 0;
exports.toPlainObject = toPlainObject;
const graphql_1 = require("graphql");
const config_1 = require("../config");
const validateTenantAccess = (context, tenantId) => {
    if (context.tenantId !== tenantId) {
        throw new graphql_1.GraphQLError(config_1.errorMessages.FORBIDDEN, {
            extensions: { code: 'FORBIDDEN' }
        });
    }
};
exports.validateTenantAccess = validateTenantAccess;
const formatError = (error) => {
    if (error instanceof graphql_1.GraphQLError) {
        return error;
    }
    console.error('Unexpected error:', error);
    return new graphql_1.GraphQLError(config_1.errorMessages.INTERNAL_ERROR, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
};
exports.formatError = formatError;
const validatePagination = (page, pageSize) => {
    if (page < 1) {
        throw new graphql_1.GraphQLError('Page number must be greater than 0', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }
    if (pageSize < 1 || pageSize > 100) {
        throw new graphql_1.GraphQLError('Page size must be between 1 and 100', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }
    return {
        skip: (page - 1) * pageSize,
        limit: pageSize,
    };
};
exports.validatePagination = validatePagination;
const generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
exports.generateSlug = generateSlug;
const sanitizeSearchQuery = (query) => {
    return query.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};
exports.sanitizeSearchQuery = sanitizeSearchQuery;
const validateDateRange = (startDate, endDate) => {
    if (startDate >= endDate) {
        throw new graphql_1.GraphQLError('End date must be after start date', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }
};
exports.validateDateRange = validateDateRange;
const isOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && end1 > start2;
};
exports.isOverlapping = isOverlapping;
function toPlainObject(doc) {
    if (!doc)
        return {};
    // Handle ModifyResult type
    if ('value' in doc && doc.value) {
        return doc.value.toObject ? doc.value.toObject() : JSON.parse(JSON.stringify(doc.value));
    }
    // Handle Document type
    if ('toObject' in doc && typeof doc.toObject === 'function') {
        return doc.toObject();
    }
    // Fallback to JSON conversion
    return JSON.parse(JSON.stringify(doc));
}
//# sourceMappingURL=index.js.map