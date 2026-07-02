/**
 * Configuración de Jest para tests de INTEGRACIÓN contra una DB real.
 *
 * Diferencias clave con jest.config.js (unit):
 *  - NO usa setupFilesAfterEach: src/tests/singleton.ts, es decir NO mockea Prisma.
 *    Los tests golpean la base de datos real definida por DATABASE_URL.
 *  - Solo corre archivos *.db.test.ts.
 *  - runInBand (secuencial) para evitar carreras entre setup/teardown de datos.
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'ts'],
    testMatch: ['**/*.db.test.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    // Sin mock global de Prisma: se usa la conexión real.
    testTimeout: 30000,
    // El pool de pg del adapter no se cierra con $disconnect; evitamos que jest cuelgue.
    forceExit: true,
};
