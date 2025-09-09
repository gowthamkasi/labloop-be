import Fastify from 'fastify';
import { registerPlugins } from './plugins/index.js';
import webRoutes from './apps/web/routes/index.js';
import mobileRoutes from './apps/mobile/routes/index.js';
import { database, setupGracefulShutdown } from './config/database.js';

const fastify = Fastify({
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

// Register plugins
await registerPlugins(fastify);

// Health check endpoint
fastify.get('/health', async () => {
  const dbInfo = database.getConnectionInfo();
  return {
    status: database.isHealthy() ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    service: 'labloop-backend',
    database: {
      connected: dbInfo.isConnected,
      status: dbInfo.readyState === 1 ? 'connected' : 'disconnected',
      host: dbInfo.host,
      database: dbInfo.name
    }
  };
});

// Web app routes (healthcare providers)
fastify.register(webRoutes, { prefix: '/api/web' });

// Mobile app routes (patients/consumers)
fastify.register(mobileRoutes, { prefix: '/api/mobile' });

// Root endpoint
fastify.get('/', async () => ({
  message: 'LabLoop Healthcare Lab Management System',
  apps: {
    web: '/api/web - Healthcare Provider Interface',
    mobile: '/api/mobile - Patient Interface',
  },
  health: '/health',
}));

const start = async () => {
  try {
    // Connect to MongoDB first
    fastify.log.info('📦 Connecting to MongoDB...');
    await database.connect();
    fastify.log.info('✅ MongoDB connected successfully');
    
    // Setup graceful shutdown handlers
    setupGracefulShutdown();
    
    const port = process.env['PORT'] ? parseInt(process.env['PORT']) : 3000;
    const host = process.env['HOST'] || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`🚀 LabLoop Backend started on http://${host}:${port}`);
    fastify.log.info(`🏥 Health check available at http://${host}:${port}/health`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
