import fetch from "node-fetch";
import config from "../config";
import { ServiceConfig, ServiceError, TimeoutError } from "../types";

/**
 * Creates a standardized query to a service
 * @param {ServiceConfig} service - The service configuration
 * @param {string} query - The GraphQL query or mutation
 * @param {Record<string, any>} variables - Optional variables for the query
 * @param {Record<string, string>} headers - Optional headers to include
 * @returns {Promise<any>} The response data
 */
export const queryService = async (
  service: ServiceConfig,
  query: string,
  variables: Record<string, any> = {},
  headers: Record<string, string> = {},
): Promise<any> => {
  try {
    // Set default headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Include tenant ID if present
    if (headers["X-Tenant-ID"]) {
      requestHeaders["X-Tenant-ID"] = headers["X-Tenant-ID"];
    }

    // Set timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout);

    // Make the request
    const response = await fetch(service.url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    // Clear timeout
    clearTimeout(timeoutId);

    // Parse the response
    const data = await response.json();

    // Handle GraphQL errors
    if (data.errors) {
      const firstError = data.errors[0];
      throw new ServiceError(firstError.message, {
        code: firstError.extensions?.code || "SERVICE_ERROR",
        path: firstError.path,
        errors: data.errors,
        service: service.url,
      });
    }

    return data.data;
  } catch (error) {
    // Handle fetch-specific errors
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(service.url, service.timeout);
    }

    // Add service information to error if it's not already a ServiceError
    if (!(error instanceof ServiceError)) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ServiceError(message, { service: service.url });
    }

    throw error;
  }
};

/**
 * Creates a client for the user service
 * @param {Record<string, string>} headers - Headers to include in requests
 * @returns {Object} An object with methods for common user service operations
 */
export const createUserServiceClient = (
  headers: Record<string, string> = {},
) => {
  return {
    login: async (email: string, password: string, tenantId: string) => {
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

      return queryService(
        config.services.user,
        mutation,
        { email, password, tenantId },
        { ...headers, "X-Tenant-ID": tenantId },
      );
    },

    register: async (input: {
      name: string;
      email: string;
      password: string;
      role?: string;
      tenantId?: string;
    }) => {
      // Extract tenantId from input or headers
      const tenantId =
        input.tenantId ||
        headers["X-Tenant-ID"] ||
        config.tenant?.defaultTenantId;

      if (!tenantId) {
        throw new ServiceError("Tenant ID is required for registration", {
          code: "TENANT_REQUIRED",
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
          role: input.role || "CLIENT",
          tenantId,
        },
      };

      return queryService(config.services.user, mutation, variables, {
        ...headers,
        "X-Tenant-ID": tenantId,
      });
    },

    refreshToken: async (refreshToken: string) => {
      const mutation = `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            token
            success
          }
        }
      `;

      return queryService(
        config.services.user,
        mutation,
        { refreshToken },
        headers,
      );
    },

    logout: async (refreshToken: string) => {
      const mutation = `
        mutation Logout($refreshToken: String!) {
          logout(refreshToken: $refreshToken)
        }
      `;

      return queryService(
        config.services.user,
        mutation,
        { refreshToken },
        headers,
      );
    },

    logoutAll: async () => {
      const mutation = `
        mutation {
          logoutAll
        }
      `;

      return queryService(config.services.user, mutation, {}, headers);
    },

    requestPasswordReset: async (email: string) => {
      const mutation = `
        mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email) {
            success
            message
          }
        }
      `;

      return queryService(config.services.user, mutation, { email }, headers);
    },

    resetPassword: async (token: string, newPassword: string) => {
      const mutation = `
        mutation ResetPassword($token: String!, $newPassword: String!) {
          resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
          }
        }
      `;

      return queryService(
        config.services.user,
        mutation,
        { token, newPassword },
        headers,
      );
    },

    verifyEmail: async (token: string) => {
      const mutation = `
        mutation VerifyEmail($token: String!) {
          verifyEmail(token: $token) {
            success
            message
          }
        }
      `;

      return queryService(config.services.user, mutation, { token }, headers);
    },

    resendVerification: async (email: string) => {
      const mutation = `
        mutation ResendVerification($email: String!) {
          resendVerification(email: $email) {
            success
            message
          }
        }
      `;

      return queryService(config.services.user, mutation, { email }, headers);
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

      return queryService(config.services.user, query, {}, headers);
    },

    verifyResetToken: async (token: string) => {
      const query = `
        query VerifyResetToken($token: String!) {
          verifyResetToken(token: $token) {
            success
            message
          }
        }
      `;

      return queryService(config.services.user, query, { token }, headers);
    },

    oauthLogin: async (provider: string, token: string, profile: any) => {
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
          profile: JSON.stringify(profile),
        },
      };

      return queryService(config.services.user, mutation, variables, headers);
    },
  };
};
