// Extend Apollo Server types to fix compatibility issues
import { Application } from "express";

declare module "apollo-server-express" {
  export interface ApolloServerExpressConfig {
    typeDefs: any;
    resolvers: any;
    context?: any;
    formatError?: any;
    plugins?: any[];
    introspection?: boolean;
    debug?: boolean;
  }

  export class ApolloServer {
    constructor(config: ApolloServerExpressConfig);
    start(): Promise<void>;
    applyMiddleware(options: {
      app: Application;
      path?: string;
      cors?: any;
      bodyParserConfig?: any;
      onHealthCheck?: any;
      disableHealthCheck?: boolean;
    }): {
      server: ApolloServer;
      path: string;
    };
    graphqlPath: string;
  }
}
