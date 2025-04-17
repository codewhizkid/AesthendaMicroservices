import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { getCurrentTenantId, TenantRequiredError } from '../middleware/tenantIsolation';
import { errorMessages } from '../config';
import { Context } from '../types';

/**
 * Apollo Server plugin that enforces tenant isolation for all operations
 * 
 * This plugin intercepts all GraphQL operations and ensures they can only access
 * data from the tenant specified in the request context.
 */
export const tenantIsolationPlugin = (): ApolloServerPlugin<Context> => {
  return {
    // Runs before each request is executed
    async requestDidStart() {
      return {
        // Runs before parsing and validating the document
        async didResolveOperation({ contextValue, operation }) {
          try {
            // Skip if operation is undefined (should never happen, but type safety)
            if (!operation) return;
            
            // Skip tenant validation for introspection queries
            if (operation.operation === 'query' && 
                operation.selectionSet.selections.some(
                  sel => sel.kind === 'Field' && sel.name.value === '__schema'
                )) {
              return;
            }
            
            // Skip tenant validation for specific operations if needed
            // Example: login, signup, public endpoints
            const operationName = operation.name?.value;
            const publicOperations = ['login', 'signup', 'publicData', 'introspection'];
            
            if (operationName && publicOperations.includes(operationName)) {
              return;
            }
            
            // Validate tenant ID exists in context
            getCurrentTenantId(contextValue);
          } catch (error) {
            if (error instanceof TenantRequiredError) {
              throw error;
            }
            
            // Handle other errors
            throw new GraphQLError(errorMessages.UNAUTHORIZED, {
              extensions: { code: 'UNAUTHORIZED' }
            });
          }
        },
        
        // Log tenant ID for each operation for auditing purposes
        async didEncounterErrors({ contextValue, errors }) {
          try {
            const tenantId = contextValue.user?.tenantId || 'unknown';
            console.error(`[ERROR] Tenant ${tenantId} encountered errors:`, 
              errors.map(e => e.message).join(', '));
          } catch (e) {
            // Ignore errors in the error handler
          }
        },
        
        // Log completed operations for auditing
        async willSendResponse({ contextValue, response }) {
          try {
            if (contextValue.user?.tenantId) {
              // In production, you might want to send this to a logging service
              if (process.env.NODE_ENV === 'development') {
                console.debug(`[AUDIT] Tenant ${contextValue.user.tenantId} operation completed`);
              }
            }
          } catch (e) {
            // Ignore errors in the response handler
          }
        }
      };
    }
  };
};

export default tenantIsolationPlugin; 