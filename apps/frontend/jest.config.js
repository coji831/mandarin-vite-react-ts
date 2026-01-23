export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowJs: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@mandarin/shared-constants$": "<rootDir>/../../packages/shared-constants/src/index.ts",
    "^utils(.*)$": "<rootDir>/src/utils$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: ["**/?(*.)+(test).[tj]s?(x)"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
