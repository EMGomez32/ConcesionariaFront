import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { contextMiddleware } from './interface/middlewares/context.middleware';
import { requestLogger } from './interface/middlewares/requestLogger.middleware';
import { errorHandler } from './interface/middlewares/error.middleware';
import { notFound } from './interface/middlewares/notFound.middleware';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';
import prisma from './infrastructure/database/prisma';

const app = express();

// Security Middlewares
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Basic Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching in development
if (env.NODE_ENV === 'development') {
    app.use((_req, res, next) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        next();
    });
}

// Core Middleware: Multi-tenancy Context
app.use(contextMiddleware);
app.use(requestLogger);

// Health check (simplified using extended prisma)
app.get('/health', async (_req, res) => {
    try {
        await (prisma as any).$queryRaw`SELECT 1`;
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: 'Database unavailable' });
    }
});

// Rutas de la API
app.use('/api', routes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Concesionaria API Docs',
}));

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
