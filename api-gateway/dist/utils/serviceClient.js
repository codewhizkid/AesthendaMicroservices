"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserServiceClient = exports.queryService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = __importDefault(require("../config"));
const types_1 = require("../types");
/**
 * Creates a standardized query to a service
 * @param {ServiceConfig} service - The service configuration
 * @param {string} query - The GraphQL query or mutation
 * @param {Record<string, any>} variables - Optional variables for the query
 * @param {Record<string, string>} headers - Optional headers to include
 * @returns {Promise<any>} The response data
 */
const queryService = async (service, query, variables = {}, headers = {}) => {
    var _a;
    try {
        // Set default headers
        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        // Include tenant ID if present
        if (headers['X-Tenant-ID']) {
            requestHeaders['X-Tenant-ID'] = headers['X-Tenant-ID'];
        }
        // Set timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), service.timeout);
        // Make the request
        const response = await (0, node_fetch_1.default)(service.url, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({ query, variables }),
            signal: controller.signal
        });
        // Clear timeout
        clearTimeout(timeoutId);
        // Parse the response
        const data = await response.json();
        // Handle GraphQL errors
        if (data.errors) {
            const firstError = data.errors[0];
            throw new types_1.ServiceError(firstError.message, {
                code: ((_a = firstError.extensions) === null || _a === void 0 ? void 0 : _a.code) || 'SERVICE_ERROR',
                path: firstError.path,
                errors: data.errors,
                service: service.url
            });
        }
        return data.data;
    }
    catch (error) {
        // Handle fetch-specific errors
        if (error instanceof Error && error.name === 'AbortError') {
            throw new types_1.TimeoutError(service.url, service.timeout);
        }
        // Add service information to error if it's not already a ServiceError
        if (!(error instanceof types_1.ServiceError)) {
            const message = error instanceof Error ? error.message : String(error);
            throw new types_1.ServiceError(message, { service: service.url });
        }
        throw error;
    }
};
exports.queryService = queryService;
/**
 * Creates a client for the user service
 * @param {Record<string, string>} headers - Headers to include in requests
 * @returns {Object} An object with methods for common user service operations
 */
const createUserServiceClient = (headers = {}) => {
    return {
        login: async (email, password, tenantId) => {
            const mutation = `
        mutation Login($email: String!, $password: String!, $tenantId: String!) {
          login(email: $email, password: $password, tenantId: $tenantId) {
            token
            refreshToken
            user {
              id
              name
              email
              role
            }
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { email, password, tenantId }, { ...headers, 'X-Tenant-ID': tenantId });
        },
        register: async (input) => {
            var _a;
            // Extract tenantId from input or headers
            const tenantId = input.tenantId || headers['X-Tenant-ID'] || ((_a = config_1.default.tenant) === null || _a === void 0 ? void 0 : _a.defaultTenantId);
            if (!tenantId) {
                throw new types_1.ServiceError('Tenant ID is required for registration', {
                    code: 'TENANT_REQUIRED'
                });
            }
            const mutation = `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            refreshToken
            user {
              id
              name
              email
              role
            }
          }
        }
      `;
            const variables = {
                input: {
                    ...input,
                    role: input.role || 'CLIENT',
                    tenantId
                }
            };
            return (0, exports.queryService)(config_1.default.services.user, mutation, variables, {
                ...headers,
                'X-Tenant-ID': tenantId
            });
        },
        refreshToken: async (refreshToken) => {
            const mutation = `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            token
            success
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { refreshToken }, headers);
        },
        logout: async (refreshToken) => {
            const mutation = `
        mutation Logout($refreshToken: String!) {
          logout(refreshToken: $refreshToken)
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { refreshToken }, headers);
        },
        logoutAll: async () => {
            const mutation = `
        mutation {
          logoutAll
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, {}, headers);
        },
        requestPasswordReset: async (email) => {
            const mutation = `
        mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email) {
            success
            message
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { email }, headers);
        },
        resetPassword: async (token, newPassword) => {
            const mutation = `
        mutation ResetPassword($token: String!, $newPassword: String!) {
          resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { token, newPassword }, headers);
        },
        verifyEmail: async (token) => {
            const mutation = `
        mutation VerifyEmail($token: String!) {
          verifyEmail(token: $token) {
            success
            message
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { token }, headers);
        },
        resendVerification: async (email) => {
            const mutation = `
        mutation ResendVerification($email: String!) {
          resendVerification(email: $email) {
            success
            message
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, mutation, { email }, headers);
        },
        me: async () => {
            const query = `
        query {
          me {
            id
            name
            email
            role
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, query, {}, headers);
        },
        verifyResetToken: async (token) => {
            const query = `
        query VerifyResetToken($token: String!) {
          verifyResetToken(token: $token) {
            success
            message
          }
        }
      `;
            return (0, exports.queryService)(config_1.default.services.user, query, { token }, headers);
        },
        oauthLogin: async (provider, token, profile) => {
            const mutation = `
        mutation OAuthLogin($input: OAuthLoginInput!) {
          oauthLogin(input: $input) {
            token
            refreshToken
            user {
              id
              name
              email
              role
            }
          }
        }
      `;
            const variables = {
                input: {
                    provider: provider.toUpperCase(),
                    token,
                    profile: JSON.stringify(profile)
                }
            };
            return (0, exports.queryService)(config_1.default.services.user, mutation, variables, headers);
        }
    };
};
exports.createUserServiceClient = createUserServiceClient;
