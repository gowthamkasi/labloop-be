import { JWTPayload } from '../apps/web/modules/auth/types/auth.types.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}
