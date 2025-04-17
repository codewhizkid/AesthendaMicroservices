/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  // Run all tests serially in the current process
  maxWorkers: 1,
  // Increase timeout for slower operations
  testTimeout: 10000,
  // Display detailed logs
  verbose: true,
  // Ensure tests in different files don't run in parallel
  maxConcurrency: 1,
  // Add test sequence logging
  reporters: ['default'],
  setupFiles: ['<rootDir>/src/tests/testUtils.ts']
}; 