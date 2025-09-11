import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin requests, Swagger UI, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const hostname = new URL(origin).hostname;

        // Allow localhost and 127.0.0.1 for development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          callback(null, true);
          return;
        }

        // Add production domains here
        const allowedDomains = ['labloop.com', 'app.labloop.com', 'mobile.labloop.com'];

        if (allowedDomains.some((domain) => hostname.endsWith(domain))) {
          callback(null, true);
          return;
        }

        // Log blocked requests for debugging
        fastify.log.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      } catch (error: unknown) {
        console.error(error);
        // Handle invalid URLs
        fastify.log.warn(`CORS invalid origin URL: ${origin}`);
        callback(new Error('Invalid origin URL'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-Forwarded-For',
      'User-Agent',
    ],
  });
};

export default corsPlugin;
