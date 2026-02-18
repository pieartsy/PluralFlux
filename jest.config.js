// jest.config.js
module.exports = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    setupFiles: ["<rootDir>/jest.setup.js"], // path to a setup module to configure the testing environment before each test
    verbose: true,
    transform: {
        "^.+\\.[t|j]sx?$":  require.resolve('babel-jest')
    },
};