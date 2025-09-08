import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: (origin, callback) => {
      const hostname = new URL(origin || 'http://localhost').hostname;
      
      // Allow localhost for development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        callback(null, true);
        return;
      }
      
      // Add production domains here
      const allowedDomains = [
        'labloop.com',
        'app.labloop.com',
        'mobile.labloop.com',
      ];
      
      if (allowedDomains.some(domain => hostname.endsWith(domain))) {
        callback(null, true);
        return;
      }
      
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });
};

export default corsPlugin;