/**
 * Shared ESLint configuration for Aesthenda Microservices
 * 
 * This configuration can be extended by all services to ensure
 * consistent code style and quality across the entire project.
 */

module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error", // Upgraded from warn to error
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prettier/prettier": "error"
  },
  overrides: [
    {
      // Disable no-unused-vars for declaration files
      files: ["*.d.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off"
      }
    }
  ]
}; 