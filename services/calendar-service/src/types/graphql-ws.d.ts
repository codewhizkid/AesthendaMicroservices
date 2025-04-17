import { DocumentNode, GraphQLSchema, ExecutionArgs, ExecutionResult } from 'graphql';
import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Type declaration for graphql-ws library
declare module 'graphql-ws/lib/use/ws' {
  /**
   * Server context parameters
   */
  export interface ServerOptions<T = Record<string, unknown>> {
    /**
     * The GraphQL schema on which the operations will be executed and validated against.
     */
    schema: GraphQLSchema;
    
    /**
     * A value which is provided to every resolver and holds important contextual information
     * like the currently logged in user, or access to a database.
     * 
     * If you return from `context` a function, the function will be invoked on every
     * subscription middleware (and the remaining middleware stack).
     */
    context?: T | ((ctx: ConnectionContext) => Promise<T> | T);
    
    /**
     * Execute the operation. Defaults to the `graphql` function from `graphql-js`.
     */
    execute?: (args: ExecutionArgs) => Promise<ExecutionResult> | ExecutionResult;
    
    /**
     * Subscribe to the operation. Defaults to the `subscribe` function from `graphql-js`.
     */
    subscribe?: (args: ExecutionArgs) => Promise<ExecutionResult | AsyncIterator<ExecutionResult>> | AsyncIterator<ExecutionResult>;
    
    /**
     * A value which is provided to resolvers and holds loader instances for batching and caching.
     */
    rootValue?: ((document: DocumentNode) => unknown) | unknown;
    
    /**
     * Additional options to be passed to the execution and subscription components.
     */
    validationRules?: ReadonlyArray<any>;
    
    /**
     * Is the connection alive? Used for health checks.
     * Identify zombie connections and free up resources.
     */
    isParsed?: boolean;
  }
  
  /**
   * Connection context
   */
  export interface ConnectionContext {
    /**
     * The connection parameters passed from the client through the `connectionParams`
     */
    connectionParams?: Record<string, unknown>;
    
    /**
     * The original WebSocket connection.
     */
    socket: WebSocket;
    
    /**
     * The original HTTP upgrade request before the WebSocket protocol handshake.
     */
    request?: IncomingMessage;
    
    /**
     * The GraphQL context used throughout subscriptions to resolvers
     */
    context?: Record<string, any>;
  }
  
  /**
   * Returned server cleanup handler
   */
  export interface ServerCleanup {
    /**
     * Dispose of the server and clean up resources.
     */
    dispose: () => Promise<void> | void;
  }
  
  /**
   * Use the server on a WebSocket server instance.
   */
  export function useServer(
    options: ServerOptions,
    server: WebSocketServer,
    keepAlive?: number
  ): ServerCleanup;
}

// Ensure this file is treated as a module
export {}; 