import { FastifyInstance } from 'fastify';

export async function registerSwagger(app: FastifyInstance) {
  await app.register(import('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'LabLoop Healthcare Lab Management System API',
        description:
          'High-performance Fastify backend with clean architecture for healthcare lab management. Features apps-based architecture with web (healthcare providers) and mobile (patients) interfaces, comprehensive case workflows, sample tracking, report generation, and billing systems.',
        version: '1.0.0',
        contact: {
          name: 'LabLoop Development Team',
          email: 'dev@labloop.com',
          url: 'https://labloop.com',
        },
        license: {
          name: 'PROPRIETARY',
          url: 'https://labloop.com/license',
        },
        termsOfService: 'https://labloop.com/terms',
      },
      externalDocs: {
        description: 'LabLoop Developer Documentation',
        url: 'https://docs.labloop.com',
      },
      servers: [
        {
          url: `http://localhost:${process.env['PORT'] || '3000'}`,
          description: 'Development server',
        },
        {
          url: 'https://api.labloop.com',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.labloop.com',
          description: 'Staging server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer Token for authentication',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    hideUntagged: true,
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      defaultModelRendering: 'model',
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestSnippets: {
        generators: {
          curl_bash: {
            title: 'cURL (bash)',
            syntax: 'bash',
          },
          curl_powershell: {
            title: 'cURL (PowerShell)',
            syntax: 'powershell',
          },
        },
        defaultExpanded: false,
        languagesMask: ['curl_bash', 'curl_powershell'],
      },
      persistAuthorization: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
}
