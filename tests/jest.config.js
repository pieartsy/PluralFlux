/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    setupFiles: ["<rootDir>/jest.setup.js"], // path to a setup module to configure the testing environment before each test
    transform: {},
    verbose: true,
};

export default config;
