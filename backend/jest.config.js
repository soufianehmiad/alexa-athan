/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1",
  },
  collectCoverageFrom: [
    "functions/**/*.ts",
    "lib/**/*.ts",
    "!**/*.d.ts",
  ],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      diagnostics: { ignoreCodes: [151002] },
    }],
  },
};
