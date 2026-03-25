// jest.config.js
'use strict';

module.exports = {
  // Test environment — node (not browser)
  testEnvironment: 'node',

  // Where to find tests
  testMatch: [
    '**/*.test.js',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '*.js',
    '!index.js',              // Entry point — too coupled to system startup
    '!jest.config.js',        // Jest config file
    '!parser.test.js',        // Test file
    '!ledger.api.test.js',    // Test file
  ],

  // Coverage thresholds — CI fails if coverage drops below these
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  80,
      lines:      80,
      statements: 80,
    },
  },

  // Run tests serially (--runInBand) in CI to avoid port conflicts
  // between mock servers started by different test suites
  maxWorkers: process.env.CI ? 1 : '50%',

  // Test timeout — integration tests can be slow (Tally response)
  testTimeout: 15000,
};
