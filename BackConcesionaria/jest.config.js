/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.spec.ts', '**/*.test.ts'],
    // Los tests de integración (*.db.test.ts) golpean una DB real y corren
    // con jest.integration.config.js; acá se excluyen para no romper la suite unit.
    testPathIgnorePatterns: ['/node_modules/', '\\.db\\.test\\.ts$'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/src/tests/singleton.ts'],
};
