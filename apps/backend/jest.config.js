export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
};
