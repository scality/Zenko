import type { Config } from "@jest/types";
// Sync object
const jestConfig: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  clearMocks: true,
  resetMocks: true,
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  maxWorkers: 1,
  testTimeout: 120000,
};
export default jestConfig;