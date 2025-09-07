/**
 * Base Repository Implementation for LabLoop Healthcare System
 * Provides common CRUD operations with audit logging and healthcare compliance
 */

import { 
  Model, 
  Document, 
  FilterQuery, 
  UpdateQuery, 
  PopulateOptions,
  Types,
  ClientSession,
  PipelineStage
} from 'mongoose';
import { IBaseRepository, IAuditTrail } from '@/application/interfaces/repositories/index.js';
import { IBaseDocument, IPaginatedResult } from '@/application/types/index.js';
import { DatabaseError } from '@/shared/exceptions/AppError.js';
import { ILogger } from '@/shared/utils/Logger.js';

export abstract class BaseRepository<T extends IBaseDocument> implements IBaseRepository<T> {
  protected readonly model: Model<T>;
  protected readonly logger: ILogger;
  protected readonly collectionName: string;

  constructor(model: Model<T>, logger: ILogger) {
    this.model = model;
    this.logger = logger;
    this.collectionName = model.collection.collectionName;
  }

  // ====================== CREATE OPERATIONS ======================

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    try {
      this.logger.debug(`Creating new ${this.collectionName} document`, { data });

      // Add metadata for new documents
      const documentData = {
        ...data,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: (data as any).createdBy,
        },
      };

      const options = session ? { session } : {};
      const [document] = await this.model.create([documentData], options);

      // Log audit trail
      await this.logAudit('create', document._id, undefined, documentData);

      this.logger.info(`Created ${this.collectionName} document`, { 
        id: document._id,
        collection: this.collectionName 
      });

      return document;
    } catch (error) {
      this.logger.error(`Failed to create ${this.collectionName} document`, error as Error);
      throw new DatabaseError(`Failed to create ${this.collectionName}`, {
        originalError: error,
        operation: 'create',
        collection: this.collectionName,
      });
    }
  }

  async createMany(data: Partial<T>[], session?: ClientSession): Promise<T[]> {
    try {
      this.logger.debug(`Creating multiple ${this.collectionName} documents`, { count: data.length });

      // Add metadata for all documents
      const documentsData = data.map((item) => ({
        ...item,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: (item as any).createdBy,
        },
      }));

      const options = session ? { session } : {};
      const documents = await this.model.create(documentsData, options);

      // Log audit trail for batch creation
      await Promise.all(
        documents.map((doc) => 
          this.logAudit('create', doc._id, undefined, doc.toObject())
        )
      );

      this.logger.info(`Created ${documents.length} ${this.collectionName} documents`);

      return documents;
    } catch (error) {
      this.logger.error(`Failed to create multiple ${this.collectionName} documents`, error as Error);
      throw new DatabaseError(`Failed to create multiple ${this.collectionName}`, {
        originalError: error,
        operation: 'createMany',
        collection: this.collectionName,
      });
    }
  }

  // ====================== READ OPERATIONS ======================

  async findById(
    id: string | Types.ObjectId, 
    populate?: string | PopulateOptions
  ): Promise<T | null> {
    try {
      this.logger.debug(`Finding ${this.collectionName} by ID`, { id });

      let query = this.model.findById(id).where({ 'metadata.deletedAt': { $exists: false } });

      if (populate) {
        query = query.populate(populate);
      }

      const document = await query.exec();

      if (document) {
        // Log audit trail for read access
        await this.logAudit('read', document._id);
      }

      return document;
    } catch (error) {
      this.logger.error(`Failed to find ${this.collectionName} by ID`, error as Error);
      throw new DatabaseError(`Failed to find ${this.collectionName} by ID`, {
        originalError: error,
        operation: 'findById',
        collection: this.collectionName,
        id,
      });
    }
  }

  async findOne(
    filter: FilterQuery<T>, 
    populate?: string | PopulateOptions
  ): Promise<T | null> {
    try {
      this.logger.debug(`Finding one ${this.collectionName}`, { filter });

      // Always exclude soft-deleted documents
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      let query = this.model.findOne(enhancedFilter);

      if (populate) {
        query = query.populate(populate);
      }

      const document = await query.exec();

      if (document) {
        await this.logAudit('read', document._id);
      }

      return document;
    } catch (error) {
      this.logger.error(`Failed to find one ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to find one ${this.collectionName}`, {
        originalError: error,
        operation: 'findOne',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async findMany(
    filter: FilterQuery<T>,
    options?: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      populate?: string | PopulateOptions;
    }
  ): Promise<T[]> {
    try {
      this.logger.debug(`Finding multiple ${this.collectionName}`, { filter, options });

      // Always exclude soft-deleted documents
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      let query = this.model.find(enhancedFilter);

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.skip) {
        query = query.skip(options.skip);
      }

      if (options?.sort) {
        query = query.sort(options.sort);
      }

      if (options?.populate) {
        query = query.populate(options.populate);
      }

      const documents = await query.exec();

      // Log audit trail for bulk read access (sample only for performance)
      if (documents.length > 0 && documents.length <= 10) {
        await Promise.all(
          documents.map((doc) => this.logAudit('read', doc._id))
        );
      }

      return documents;
    } catch (error) {
      this.logger.error(`Failed to find multiple ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to find multiple ${this.collectionName}`, {
        originalError: error,
        operation: 'findMany',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async findWithPagination(
    filter: FilterQuery<T>,
    options: {
      page: number;
      limit: number;
      sort?: Record<string, 1 | -1>;
      populate?: string | PopulateOptions;
    }
  ): Promise<IPaginatedResult<T>> {
    try {
      this.logger.debug(`Finding paginated ${this.collectionName}`, { filter, options });

      const { page, limit, sort, populate } = options;
      const skip = (page - 1) * limit;

      // Always exclude soft-deleted documents
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      // Get total count
      const total = await this.model.countDocuments(enhancedFilter);

      // Get documents
      let query = this.model.find(enhancedFilter).skip(skip).limit(limit);

      if (sort) {
        query = query.sort(sort);
      }

      if (populate) {
        query = query.populate(populate);
      }

      const documents = await query.exec();

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };

      return {
        data: documents,
        pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to find paginated ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to find paginated ${this.collectionName}`, {
        originalError: error,
        operation: 'findWithPagination',
        collection: this.collectionName,
        filter,
      });
    }
  }

  // ====================== UPDATE OPERATIONS ======================

  async updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<T>,
    session?: ClientSession
  ): Promise<T | null> {
    try {
      this.logger.debug(`Updating ${this.collectionName} by ID`, { id, update });

      // Get original document for audit logging
      const originalDoc = await this.model.findById(id).where({ 'metadata.deletedAt': { $exists: false } });

      if (!originalDoc) {
        return null;
      }

      // Add metadata for update
      const enhancedUpdate = {
        ...update,
        'metadata.updatedAt': new Date(),
        'metadata.updatedBy': (update as any).updatedBy,
      };

      const options = {
        new: true,
        runValidators: true,
        ...(session && { session }),
      };

      const updatedDoc = await this.model.findByIdAndUpdate(id, enhancedUpdate, options);

      if (updatedDoc) {
        // Log audit trail
        await this.logAudit('update', updatedDoc._id, originalDoc.toObject(), updatedDoc.toObject());

        this.logger.info(`Updated ${this.collectionName} document`, { 
          id: updatedDoc._id,
          collection: this.collectionName 
        });
      }

      return updatedDoc;
    } catch (error) {
      this.logger.error(`Failed to update ${this.collectionName} by ID`, error as Error);
      throw new DatabaseError(`Failed to update ${this.collectionName} by ID`, {
        originalError: error,
        operation: 'updateById',
        collection: this.collectionName,
        id,
      });
    }
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    session?: ClientSession
  ): Promise<T | null> {
    try {
      this.logger.debug(`Updating one ${this.collectionName}`, { filter, update });

      // Always exclude soft-deleted documents
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      // Get original document for audit logging
      const originalDoc = await this.model.findOne(enhancedFilter);

      if (!originalDoc) {
        return null;
      }

      // Add metadata for update
      const enhancedUpdate = {
        ...update,
        'metadata.updatedAt': new Date(),
        'metadata.updatedBy': (update as any).updatedBy,
      };

      const options = {
        new: true,
        runValidators: true,
        ...(session && { session }),
      };

      const updatedDoc = await this.model.findOneAndUpdate(enhancedFilter, enhancedUpdate, options);

      if (updatedDoc) {
        // Log audit trail
        await this.logAudit('update', updatedDoc._id, originalDoc.toObject(), updatedDoc.toObject());

        this.logger.info(`Updated ${this.collectionName} document`, { 
          id: updatedDoc._id,
          collection: this.collectionName 
        });
      }

      return updatedDoc;
    } catch (error) {
      this.logger.error(`Failed to update one ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to update one ${this.collectionName}`, {
        originalError: error,
        operation: 'updateOne',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    session?: ClientSession
  ): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug(`Updating multiple ${this.collectionName}`, { filter, update });

      // Always exclude soft-deleted documents
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      // Add metadata for update
      const enhancedUpdate = {
        ...update,
        'metadata.updatedAt': new Date(),
        'metadata.updatedBy': (update as any).updatedBy,
      };

      const options = session ? { session } : {};
      const result = await this.model.updateMany(enhancedFilter, enhancedUpdate, options);

      this.logger.info(`Updated ${result.modifiedCount} ${this.collectionName} documents`);

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error(`Failed to update multiple ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to update multiple ${this.collectionName}`, {
        originalError: error,
        operation: 'updateMany',
        collection: this.collectionName,
        filter,
      });
    }
  }

  // ====================== SOFT DELETE OPERATIONS ======================

  async softDeleteById(
    id: string | Types.ObjectId,
    deletedBy?: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<T | null> {
    try {
      this.logger.debug(`Soft deleting ${this.collectionName} by ID`, { id, deletedBy });

      const update = {
        'metadata.deletedAt': new Date(),
        'metadata.updatedAt': new Date(),
        ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
      };

      const options = {
        new: true,
        ...(session && { session }),
      };

      const deletedDoc = await this.model.findByIdAndUpdate(id, update, options);

      if (deletedDoc) {
        // Log audit trail
        await this.logAudit('delete', deletedDoc._id, deletedDoc.toObject());

        this.logger.info(`Soft deleted ${this.collectionName} document`, { 
          id: deletedDoc._id,
          collection: this.collectionName 
        });
      }

      return deletedDoc;
    } catch (error) {
      this.logger.error(`Failed to soft delete ${this.collectionName} by ID`, error as Error);
      throw new DatabaseError(`Failed to soft delete ${this.collectionName} by ID`, {
        originalError: error,
        operation: 'softDeleteById',
        collection: this.collectionName,
        id,
      });
    }
  }

  async softDeleteOne(
    filter: FilterQuery<T>,
    deletedBy?: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<T | null> {
    try {
      this.logger.debug(`Soft deleting one ${this.collectionName}`, { filter, deletedBy });

      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      const update = {
        'metadata.deletedAt': new Date(),
        'metadata.updatedAt': new Date(),
        ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
      };

      const options = {
        new: true,
        ...(session && { session }),
      };

      const deletedDoc = await this.model.findOneAndUpdate(enhancedFilter, update, options);

      if (deletedDoc) {
        // Log audit trail
        await this.logAudit('delete', deletedDoc._id, deletedDoc.toObject());

        this.logger.info(`Soft deleted ${this.collectionName} document`, { 
          id: deletedDoc._id,
          collection: this.collectionName 
        });
      }

      return deletedDoc;
    } catch (error) {
      this.logger.error(`Failed to soft delete one ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to soft delete one ${this.collectionName}`, {
        originalError: error,
        operation: 'softDeleteOne',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async softDeleteMany(
    filter: FilterQuery<T>,
    deletedBy?: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug(`Soft deleting multiple ${this.collectionName}`, { filter, deletedBy });

      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      const update = {
        'metadata.deletedAt': new Date(),
        'metadata.updatedAt': new Date(),
        ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
      };

      const options = session ? { session } : {};
      const result = await this.model.updateMany(enhancedFilter, update, options);

      this.logger.info(`Soft deleted ${result.modifiedCount} ${this.collectionName} documents`);

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error(`Failed to soft delete multiple ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to soft delete multiple ${this.collectionName}`, {
        originalError: error,
        operation: 'softDeleteMany',
        collection: this.collectionName,
        filter,
      });
    }
  }

  // ====================== HARD DELETE OPERATIONS ======================

  async hardDeleteById(id: string | Types.ObjectId, session?: ClientSession): Promise<T | null> {
    try {
      this.logger.warn(`Hard deleting ${this.collectionName} by ID`, { id });

      const options = session ? { session } : {};
      const deletedDoc = await this.model.findByIdAndDelete(id, options);

      if (deletedDoc) {
        // Log audit trail
        await this.logAudit('delete', deletedDoc._id, deletedDoc.toObject());

        this.logger.warn(`Hard deleted ${this.collectionName} document`, { 
          id: deletedDoc._id,
          collection: this.collectionName 
        });
      }

      return deletedDoc;
    } catch (error) {
      this.logger.error(`Failed to hard delete ${this.collectionName} by ID`, error as Error);
      throw new DatabaseError(`Failed to hard delete ${this.collectionName} by ID`, {
        originalError: error,
        operation: 'hardDeleteById',
        collection: this.collectionName,
        id,
      });
    }
  }

  async hardDeleteOne(filter: FilterQuery<T>, session?: ClientSession): Promise<T | null> {
    try {
      this.logger.warn(`Hard deleting one ${this.collectionName}`, { filter });

      const options = session ? { session } : {};
      const deletedDoc = await this.model.findOneAndDelete(filter, options);

      if (deletedDoc) {
        // Log audit trail
        await this.logAudit('delete', deletedDoc._id, deletedDoc.toObject());

        this.logger.warn(`Hard deleted ${this.collectionName} document`, { 
          id: deletedDoc._id,
          collection: this.collectionName 
        });
      }

      return deletedDoc;
    } catch (error) {
      this.logger.error(`Failed to hard delete one ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to hard delete one ${this.collectionName}`, {
        originalError: error,
        operation: 'hardDeleteOne',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async hardDeleteMany(filter: FilterQuery<T>, session?: ClientSession): Promise<{ deletedCount: number }> {
    try {
      this.logger.warn(`Hard deleting multiple ${this.collectionName}`, { filter });

      const options = session ? { session } : {};
      const result = await this.model.deleteMany(filter, options);

      this.logger.warn(`Hard deleted ${result.deletedCount} ${this.collectionName} documents`);

      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      this.logger.error(`Failed to hard delete multiple ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to hard delete multiple ${this.collectionName}`, {
        originalError: error,
        operation: 'hardDeleteMany',
        collection: this.collectionName,
        filter,
      });
    }
  }

  // ====================== UTILITY OPERATIONS ======================

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      const document = await this.model.exists(enhancedFilter);
      return !!document;
    } catch (error) {
      this.logger.error(`Failed to check if ${this.collectionName} exists`, error as Error);
      throw new DatabaseError(`Failed to check if ${this.collectionName} exists`, {
        originalError: error,
        operation: 'exists',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async count(filter: FilterQuery<T>): Promise<number> {
    try {
      const enhancedFilter = {
        ...filter,
        'metadata.deletedAt': { $exists: false },
      };

      return await this.model.countDocuments(enhancedFilter);
    } catch (error) {
      this.logger.error(`Failed to count ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to count ${this.collectionName}`, {
        originalError: error,
        operation: 'count',
        collection: this.collectionName,
        filter,
      });
    }
  }

  async aggregate<R = any>(pipeline: PipelineStage[]): Promise<R[]> {
    try {
      this.logger.debug(`Running aggregation on ${this.collectionName}`, { pipeline });

      // Add soft delete filter to the beginning of the pipeline
      const enhancedPipeline: PipelineStage[] = [
        { $match: { 'metadata.deletedAt': { $exists: false } } },
        ...pipeline,
      ];

      return await this.model.aggregate<R>(enhancedPipeline);
    } catch (error) {
      this.logger.error(`Failed to run aggregation on ${this.collectionName}`, error as Error);
      throw new DatabaseError(`Failed to run aggregation on ${this.collectionName}`, {
        originalError: error,
        operation: 'aggregate',
        collection: this.collectionName,
      });
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Try to perform a simple operation
      await this.model.countDocuments().limit(1);
      
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error(`Health check failed for ${this.collectionName}`, error as Error);
      return {
        status: 'unhealthy',
        details: {
          collection: this.collectionName,
          error: (error as Error).message,
        },
      };
    }
  }

  // ====================== AUDIT LOGGING ======================

  protected async logAudit(
    action: IAuditTrail['action'],
    documentId: string | Types.ObjectId,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): Promise<void> {
    try {
      // In a real implementation, this would write to an audit collection
      // For now, we'll log to the application logger
      const auditData = {
        action,
        documentId,
        collection: this.collectionName,
        timestamp: new Date(),
        changes: oldData || newData ? {
          ...(oldData && { old: oldData }),
          ...(newData && { new: newData }),
        } : undefined,
      };

      this.logger.info('Audit trail', auditData);

      // TODO: Implement actual audit trail persistence
      // await this.auditRepository.logAction(auditData);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.error('Failed to log audit trail', error as Error, {
        action,
        documentId,
        collection: this.collectionName,
      });
    }
  }

  // ====================== HELPER METHODS ======================

  protected generateId(prefix: string, length: number = 6): string {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, length - 2).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  protected validateId(id: string | Types.ObjectId): Types.ObjectId {
    if (Types.ObjectId.isValid(id)) {
      return new Types.ObjectId(id);
    }
    throw new DatabaseError('Invalid ObjectId format', { id });
  }
}