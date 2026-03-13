import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Concesionaria SaaS API',
            version: '1.0.0',
            description: 'API para la gestión centralizada de concesionarias multimarcas.',
            contact: {
                name: 'Soporte Técnico',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port || 3000}/api/v1`,
                description: 'Servidor de Desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.ts', './src/types/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export default specs;
