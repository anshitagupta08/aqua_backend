const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // important for backend/Express testing
  setupFiles: ['<rootDir>/tests/setupEnv.ts'], // replaces 'dotenv/config'
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'], // test files pattern
  transform: {
    ...tsJestTransformCfg,
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true, // reset mocks between tests
  verbose: true, // better test output
  collectCoverage: true, // optional: to see test coverage
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
    'src/configs/', // skip configs (optional)
  ],
};
