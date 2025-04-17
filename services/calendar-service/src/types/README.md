# Custom Type Declarations

This directory contains custom TypeScript declaration files for third-party libraries that either don't provide their own type definitions or where we need to extend the existing definitions.

## graphql-ws.d.ts

This file provides TypeScript type declarations for the `graphql-ws` library, specifically for the `lib/use/ws` subpath that we use for WebSocket subscriptions in our GraphQL server.

### Why Custom Declarations?

While the `graphql-ws` package has some type definitions, they don't fully cover all usage patterns, particularly when using specific subpaths like `graphql-ws/lib/use/ws`. Rather than using `// @ts-ignore` comments throughout our codebase, we've created proper type declarations.

### Usage

With these declarations in place, TypeScript can properly type-check our usage of the `graphql-ws` library. The key components defined are:

1. `ServerOptions` - Options for configuring the GraphQL WebSocket server
2. `ConnectionContext` - Context for client connections
3. `ServerCleanup` - The cleanup handler returned by `useServer`
4. `useServer` function - The main function for integrating with a WebSocket server

### Maintenance

If you encounter typing issues with `graphql-ws` after upgrading the package:

1. Check if the package now provides proper typings for the subpaths we use
2. Update this declaration file to match the current API of the package

### Building Type Declarations

To rebuild just the type declarations:

```bash
npm run build:declarations
```

## References

- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [graphql-ws Documentation](https://github.com/enisdenjo/graphql-ws#readme) 