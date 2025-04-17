# GraphQL Code Generator Integration

This document explains how we use GraphQL Code Generator to ensure type safety and consistency between our GraphQL schema and resolver implementations.

## Overview

GraphQL Code Generator automatically generates TypeScript types from our GraphQL schema. This ensures that our resolver implementations match the schema definitions, reducing the chance of errors and inconsistencies.

## Setup

### Installation

The following packages are installed:

```bash
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
```

### Configuration

The configuration is in `codegen.ts`:

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './src/schema.ts',
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: '../types#Context',
        enumsAsTypes: true,
        maybeValue: 'T | null | undefined',
        scalars: {
          DateTime: 'Date',
          JSON: 'Record<string, any>'
        },
        mappers: {
          Event: '../models/Event#IEvent',
          Resource: '../models/Resource#IResource',
        }
      },
    },
  },
};

export default config;
```

### npm Scripts

We've added the following scripts to `package.json`:

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.ts",
    "codegen:watch": "graphql-codegen --config codegen.ts --watch",
    "prebuild": "npm run codegen",
    "predev": "npm run codegen"
  }
}
```

## Usage

### Generated Types

The generator creates TypeScript types for:

1. **GraphQL Schema Types**: Types for all the entities defined in the schema
2. **Resolver Types**: Type definitions for resolver functions
3. **Args Types**: Types for resolver arguments
4. **Return Types**: Types for resolver return values

### Using Generated Types in Resolvers

To use the generated types in resolvers:

```typescript
import { 
  QueryEventsArgs, 
  MutationCreateEventArgs,
  UserRole
} from '../generated/graphql';

// Type-safe resolver
const eventsResolver = (_, args: QueryEventsArgs, context) => {
  // Implementation with full type safety
};

// Type-safe mutation
const createEventResolver = (_, args: MutationCreateEventArgs, context) => {
  // Implementation with full type safety for input
};
```

### Helper Utilities

We've created utility functions to make working with the generated types easier:

1. **`createTypeSafeQueryResolvers`**: Creates type-safe query resolvers
2. **`createTypeSafeMutationResolvers`**: Creates type-safe mutation resolvers
3. **`createTypeSafeSubscriptionResolvers`**: Creates type-safe subscription resolvers
4. **`createProtectedResolver`**: Adds role-based access control with type safety

Example usage:

```typescript
const queryResolvers = createTypeSafeQueryResolvers({
  events: createProtectedResolver(
    async (_, args: QueryEventsArgs, context: Context) => {
      // Implementation
    },
    [UserRole.ADMIN, UserRole.STAFF]
  )
});
```

## Best Practices

1. **Run codegen before development/building**: We've configured npm scripts to run codegen automatically
2. **Use the generated types**: Always use the generated types for resolver arguments and return values
3. **Keep schema and resolvers in sync**: If you change the schema, run codegen to update the types
4. **Use the utility functions**: They provide additional type safety and simplify common patterns
5. **Update the mappers**: When you add new models, update the mappers in the codegen config

## Benefits

1. **Compile-time Type Checking**: Catch mistakes before runtime
2. **Autocompletion**: IDE provides code completion for types and fields
3. **Refactoring Support**: Change the schema and find all affected resolvers automatically
4. **Documentation**: Types serve as documentation for the API
5. **Consistency**: Ensures resolvers match the schema definition

## Troubleshooting

If you encounter issues:

1. **Regenerate types**: Run `npm run codegen` to refresh the generated types
2. **Check schema**: Ensure the schema is valid GraphQL
3. **Check imports**: Make sure you're importing the right types
4. **Check context type**: Ensure your context type is correctly defined

## Resources

- [GraphQL Code Generator Documentation](https://www.graphql-code-generator.com/)
- [TypeScript Resolvers Plugin](https://www.graphql-code-generator.com/plugins/typescript-resolvers)
- [GraphQL TypeScript Best Practices](https://the-guild.dev/blog/graphql-typescript-type-safety) 