// jest.config.js
module.exports = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    verbose: true,
    transform: {
        "^.+\\.[t|j]sx?$":  require.resolve('babel-jest')
    },
};