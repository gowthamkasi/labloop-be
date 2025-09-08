import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const mobileRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Mobile app root
  fastify.get('/', async () => ({
    message: 'LabLoop Mobile API - Patient Interface',
    version: '1.0.0',
    features: [
      'Profile Management',
      'Appointment Booking',
      'View Test Results',
      'Download Reports',
      'Find Facilities',
      'Health Insights'
    ],
  }));

  // Auth routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Mobile Auth routes - Coming soon' }));
  }, { prefix: '/auth' });

  // Profile routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Mobile Profile routes - Coming soon' }));
  }, { prefix: '/profile' });

  // Appointments routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Mobile Appointments routes - Coming soon' }));
  }, { prefix: '/appointments' });

  // Reports routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Mobile Reports routes - Coming soon' }));
  }, { prefix: '/reports' });
};

export default mobileRoutes;