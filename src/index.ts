import Fastify from 'fastify';
import { registerPlugins } from './plugins/index.js';
import { database, setupGracefulShutdown } from './config/database.js';

export const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register core plugins
await registerPlugins(app);

// Health check endpoint
app.get('/health', async () => {
  const dbInfo = database.getConnectionInfo();
  return {
    status: database.isHealthy() ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    service: 'labloop-backend',
    database: {
      connected: dbInfo.isConnected,
      status: dbInfo.readyState === 1 ? 'connected' : 'disconnected',
      host: dbInfo.host,
      database: dbInfo.name,
    },
  };
});

// Root endpoint
app.get('/', async () => ({
  message: 'LabLoop Healthcare Lab Management System',
  apps: {
    web: '/api/web - Healthcare Provider Interface',
    mobile: '/api/mobile - Patient Interface',
  },
  health: '/health',
}));

// Import and register routes directly (like Super One)
const authRoutes = await import('./apps/web/modules/auth/routes/auth.routes.js');
const adminRoutes = await import('./apps/web/modules/admin/routes/admin.routes.js');

await app.register(import('@fastify/swagger'));

await app.register(import('@fastify/swagger-ui'), {
  routePrefix: '/docs',

  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
});

// Register routes directly at root level
await app.register(authRoutes.authRoutes, { prefix: '/api/web/auth' });
await app.register(adminRoutes.adminRoutes, { prefix: '/api/web/admin' });

const start = async () => {
  try {
    // Connect to MongoDB first
    app.log.info('📦 Connecting to MongoDB...');
    await database.connect();
    app.log.info('✅ MongoDB connected successfully');

    // Setup graceful shutdown handlers
    setupGracefulShutdown();

    const port = process.env['PORT'] ? parseInt(process.env['PORT']) : 3000;
    const host = process.env['HOST'] || '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`🚀 LabLoop Backend started on http://${host}:${port}`);
    app.log.info(`🏥 Health check available at http://${host}:${port}/health`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
