/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.spec.ts', '**/*.test.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/src/tests/singleton.ts'],
};
