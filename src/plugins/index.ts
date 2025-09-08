import { FastifyInstance } from 'fastify';
import corsPlugin from './cors.plugin.js';
import helmetPlugin from './helmet.plugin.js';
import rateLimitPlugin from './rate-limit.plugin.js';

export const registerPlugins = async (fastify: FastifyInstance) => {
  // Security plugins
  await fastify.register(corsPlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(rateLimitPlugin);
  
  fastify.log.info('✅ Core plugins registered');
};

export { corsPlugin, helmetPlugin, rateLimitPlugin };