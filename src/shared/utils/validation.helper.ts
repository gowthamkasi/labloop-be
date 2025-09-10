import { ZodSchema } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseHelper } from './response.helper.js';

export function validateBody(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error: any) {
      return ResponseHelper.sendBadRequest(
        reply,
        'Validation failed',
        error.errors || error.message
      );
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error: any) {
      return ResponseHelper.sendBadRequest(
        reply,
        'Query validation failed',
        error.errors || error.message
      );
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params);
    } catch (error: any) {
      return ResponseHelper.sendBadRequest(
        reply,
        'Parameter validation failed',
        error.errors || error.message
      );
    }
  };
}