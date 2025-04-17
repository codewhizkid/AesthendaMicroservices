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