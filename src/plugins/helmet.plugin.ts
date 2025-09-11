import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import helmet from '@fastify/helmet';

const helmetPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(helmet, {
    // Configure to work with Swagger UI
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI styles
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Swagger UI
    crossOriginResourcePolicy: false, // Allow cross-origin requests
  });
};

export default helmetPlugin;