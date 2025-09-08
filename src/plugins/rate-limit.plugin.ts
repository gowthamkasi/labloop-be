import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';

const rateLimitPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 100, // requests per timeWindow
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      code: 'RATE_LIMIT_EXCEEDED',
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later.',
      expiresIn: 60000, // 1 minute
    }),
  });
};

export default rateLimitPlugin;