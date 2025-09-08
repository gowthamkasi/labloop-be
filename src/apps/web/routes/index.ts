import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const webRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Web app root
  fastify.get('/', async () => ({
    message: 'LabLoop Web API - Healthcare Provider Interface',
    version: '1.0.0',
    features: [
      'Patient Management',
      'Case Management',
      'Sample Tracking',
      'Report Generation',
      'Facility Management',
      'Analytics & Insights'
    ],
  }));

  // Auth routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Web Auth routes - Coming soon' }));
  }, { prefix: '/auth' });

  // Patients routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Web Patients routes - Coming soon' }));
  }, { prefix: '/patients' });

  // Cases routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Web Cases routes - Coming soon' }));
  }, { prefix: '/cases' });

  // Reports routes placeholder
  fastify.register(async (fastify) => {
    fastify.get('/', async () => ({ message: 'Web Reports routes - Coming soon' }));
  }, { prefix: '/reports' });
};

export default webRoutes;