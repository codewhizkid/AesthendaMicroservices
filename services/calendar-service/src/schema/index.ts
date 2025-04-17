import { readFileSync } from 'fs';
import { join } from 'path';

// Read and export schema from .graphql file
export const typeDefs = readFileSync(
  join(__dirname, './schema.graphql'),
  'utf-8'
);