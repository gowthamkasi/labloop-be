import { Schema, model } from 'mongoose';

// Constants for ID generation
const MAX_SEQUENCE_VALUE = 99999999; // Maximum 8-digit number
const SEQUENCE_DIGITS = 8;

// Counter schema for sequential ID generation
interface CounterDocument {
  _id: string;
  sequence: number;
}

const CounterSchema = new Schema<CounterDocument>({
  _id: { 
    type: String, 
    required: true,
    validate: {
      validator: function(value: string) {
        return /^[A-Z]{2,5}$/.test(value);
      },
      message: 'Counter _id must be 2-5 uppercase letters (e.g., USR, PAT, LAB)'
    }
  },
  sequence: { 
    type: Number, 
    default: 0,
    min: [0, 'Sequence cannot be negative'],
    max: [MAX_SEQUENCE_VALUE, `Sequence cannot exceed ${MAX_SEQUENCE_VALUE} (8-digit limit)`],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value) && value >= 0 && value <= MAX_SEQUENCE_VALUE;
      },
      message: 'Sequence must be a non-negative integer within 8-digit limit'
    }
  }
});

const CounterModel = model<CounterDocument>('Counter', CounterSchema);

/**
 * Custom error class for ID generation failures
 */
export class IdGenerationError extends Error {
  public readonly prefix?: string | undefined;
  public override readonly cause?: Error | undefined;
  
  constructor(message: string, prefix?: string | undefined, cause?: Error | undefined) {
    super(message);
    this.name = 'IdGenerationError';
    if (prefix !== undefined) {
      this.prefix = prefix;
    }
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Validates prefix parameter for ID generation
 * @param prefix - The prefix to validate
 * @throws {IdGenerationError} If prefix is invalid
 */
function validatePrefix(prefix: string): void {
  if (!prefix || typeof prefix !== 'string') {
    throw new IdGenerationError('Prefix must be a non-empty string');
  }
  
  if (!/^[A-Z]{2,5}$/.test(prefix)) {
    throw new IdGenerationError(
      `Invalid prefix format: "${prefix}". Must be 2-5 uppercase letters (e.g., USR, PAT, LAB)`,
      prefix
    );
  }
}

/**
 * Generates sequential IDs with format: PREFIX00000001
 * 
 * Features:
 * - Atomic counter operations (thread-safe)
 * - Automatic overflow protection (max 99,999,999)
 * - Input validation and comprehensive error handling
 * - Automatic retry on transient failures
 * 
 * @param prefix - The prefix (USR, PAT, LAB, HOS, etc.) - must be 2-5 uppercase letters
 * @param maxRetries - Maximum number of retry attempts on failure (default: 3)
 * @returns Promise<string> - The generated ID
 * @throws {IdGenerationError} On validation errors, overflow, or persistent database failures
 * 
 * @example
 * ```typescript
 * const userId = await generateId('USR'); // Returns: USR00000001
 * const patientId = await generateId('PAT'); // Returns: PAT00000001
 * ```
 */
export async function generateId(prefix: string, maxRetries: number = 3): Promise<string> {
  // Input validation
  validatePrefix(prefix);
  
  let lastError: Error | undefined;
  
  // Retry loop for transient failures
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Pre-check: Verify current counter isn't at maximum
      const currentCounter = await CounterModel.findById(prefix);
      if (currentCounter && currentCounter.sequence >= MAX_SEQUENCE_VALUE) {
        throw new IdGenerationError(
          `Counter overflow: ${prefix} has reached maximum value (${MAX_SEQUENCE_VALUE}). ` +
          'Cannot generate more IDs with 8-digit format.',
          prefix
        );
      }
      
      // Atomic increment operation
      const counter = await CounterModel.findByIdAndUpdate(
        prefix,
        { $inc: { sequence: 1 } },
        { 
          new: true, 
          upsert: true,
          runValidators: true // Ensure schema validation runs
        }
      );
      
      // Double-check for overflow after increment (shouldn't happen with pre-check, but safety first)
      if (counter.sequence > MAX_SEQUENCE_VALUE) {
        // Rollback the increment
        await CounterModel.findByIdAndUpdate(
          prefix,
          { $inc: { sequence: -1 } },
          { new: false }
        );
        
        throw new IdGenerationError(
          `Counter overflow detected after increment: ${prefix} sequence ${counter.sequence} exceeds maximum ${MAX_SEQUENCE_VALUE}`,
          prefix
        );
      }
      
      // Format number as 8-digit string with leading zeros
      const paddedNumber = counter.sequence.toString().padStart(SEQUENCE_DIGITS, '0');
      const generatedId = `${prefix}${paddedNumber}`;
      
      // Final validation of generated ID format
      const expectedRegex = new RegExp(`^${prefix}\\d{${SEQUENCE_DIGITS}}$`);
      if (!expectedRegex.test(generatedId)) {
        throw new IdGenerationError(
          `Generated ID "${generatedId}" does not match expected format "${prefix}XXXXXXXX"`,
          prefix
        );
      }
      
      return generatedId;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on validation errors or overflow
      if (error instanceof IdGenerationError) {
        throw error;
      }
      
      // Log retry attempt (in production, use proper logging)
      if (attempt < maxRetries) {
        console.warn(`ID generation attempt ${attempt} failed for prefix "${prefix}". Retrying...`, error);
        
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  // All retries exhausted
  throw new IdGenerationError(
    `Failed to generate ID for prefix "${prefix}" after ${maxRetries} attempts. Last error: ${lastError?.message}`,
    prefix,
    lastError
  );
}

/**
 * Get the next ID without incrementing (for preview)
 * 
 * @param prefix - The prefix (USR, PAT, LAB, etc.) - must be 2-5 uppercase letters
 * @returns Promise<string> - The next ID that would be generated
 * @throws {IdGenerationError} On validation errors or if next ID would overflow
 * 
 * @example
 * ```typescript
 * const nextUserId = await previewNextId('USR'); // Returns: USR00000015 (if current is 14)
 * ```
 */
export async function previewNextId(prefix: string): Promise<string> {
  // Input validation
  validatePrefix(prefix);
  
  try {
    const counter = await CounterModel.findById(prefix);
    const nextSequence = counter ? counter.sequence + 1 : 1;
    
    // Check for overflow
    if (nextSequence > MAX_SEQUENCE_VALUE) {
      throw new IdGenerationError(
        `Next ID would overflow: ${prefix} next sequence (${nextSequence}) exceeds maximum (${MAX_SEQUENCE_VALUE})`,
        prefix
      );
    }
    
    const paddedNumber = nextSequence.toString().padStart(SEQUENCE_DIGITS, '0');
    const previewId = `${prefix}${paddedNumber}`;
    
    // Validate format
    const expectedRegex = new RegExp(`^${prefix}\\d{${SEQUENCE_DIGITS}}$`);
    if (!expectedRegex.test(previewId)) {
      throw new IdGenerationError(
        `Preview ID "${previewId}" does not match expected format "${prefix}XXXXXXXX"`,
        prefix
      );
    }
    
    return previewId;
    
  } catch (error) {
    if (error instanceof IdGenerationError) {
      throw error;
    }
    
    throw new IdGenerationError(
      `Failed to preview next ID for prefix "${prefix}": ${error instanceof Error ? error.message : String(error)}`,
      prefix,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Reset counter for a prefix (use with caution in production!)
 * 
 * ⚠️ WARNING: This can cause duplicate IDs if used improperly
 * 
 * @param prefix - The prefix to reset (USR, PAT, LAB, etc.) - must be 2-5 uppercase letters
 * @param startFrom - Starting number (default: 0). Next generateId() call will produce startFrom + 1
 * @throws {IdGenerationError} On validation errors or database failures
 * 
 * @example
 * ```typescript
 * // Reset USR counter to 0, next ID will be USR00000001
 * await resetCounter('USR', 0);
 * 
 * // Reset to specific value, next ID will be PAT00001001
 * await resetCounter('PAT', 1000);
 * ```
 */
export async function resetCounter(prefix: string, startFrom: number = 0): Promise<void> {
  // Input validation
  validatePrefix(prefix);
  
  if (!Number.isInteger(startFrom) || startFrom < 0 || startFrom > MAX_SEQUENCE_VALUE) {
    throw new IdGenerationError(
      `Invalid startFrom value: ${startFrom}. Must be integer between 0 and ${MAX_SEQUENCE_VALUE}`,
      prefix
    );
  }
  
  try {
    await CounterModel.findByIdAndUpdate(
      prefix,
      { sequence: startFrom },
      { 
        upsert: true,
        runValidators: true
      }
    );
    
  } catch (error) {
    throw new IdGenerationError(
      `Failed to reset counter for prefix "${prefix}": ${error instanceof Error ? error.message : String(error)}`,
      prefix,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get current counter information for a prefix
 * 
 * @param prefix - The prefix to check
 * @returns Promise<{sequence: number, nextId: string, remaining: number} | null> Counter info or null if not found
 * @throws {IdGenerationError} On validation errors
 */
export async function getCounterInfo(prefix: string): Promise<{
  sequence: number;
  nextId: string;
  remaining: number;
} | null> {
  validatePrefix(prefix);
  
  try {
    const counter = await CounterModel.findById(prefix);
    
    if (!counter) {
      return null;
    }
    
    const nextSequence = counter.sequence + 1;
    const remaining = MAX_SEQUENCE_VALUE - counter.sequence;
    const nextId = `${prefix}${nextSequence.toString().padStart(SEQUENCE_DIGITS, '0')}`;
    
    return {
      sequence: counter.sequence,
      nextId,
      remaining
    };
    
  } catch (error) {
    throw new IdGenerationError(
      `Failed to get counter info for prefix "${prefix}": ${error instanceof Error ? error.message : String(error)}`,
      prefix,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Common error handling wrapper for ID generation in model pre-save middleware
 * 
 * This function provides consistent error handling across all models, eliminating code duplication
 * and ensuring uniform error messages and recovery strategies.
 * 
 * @param prefix - The ID prefix (USR, PAT, LAB, HOS, etc.)
 * @param entityType - The entity type for error context (User, Patient, Lab, Hospital, etc.)
 * @param idFieldName - The field name being set (userId, patientId, labId, hospitalId, etc.)
 * @returns Promise<string> - The generated ID
 * @throws {Error} Enhanced error with contextual information for the specific model
 * 
 * @example
 * ```typescript
 * // In model pre-save middleware:
 * UserSchema.pre('save', async function() {
 *   if (this.isNew && !this['userId']) {
 *     this['userId'] = await generateIdWithErrorHandling('USR', 'User', 'userId');
 *   }
 * });
 * ```
 */
export async function generateIdWithErrorHandling(
  prefix: string, 
  entityType: string, 
  idFieldName: string
): Promise<string> {
  try {
    return await generateId(prefix);
  } catch (error) {
    // Enhanced error handling for ID generation failures
    if (error instanceof IdGenerationError) {
      // Wrap ID generation errors with context about the document
      const contextualMessage = `Failed to generate ${idFieldName} for ${entityType} document: ${error.message}`;
      
      // If it's an overflow error, provide actionable guidance
      if (error.message.includes('overflow')) {
        throw new Error(
          `${contextualMessage}\n\nACTION REQUIRED: The ${entityType} ID counter has reached its maximum capacity (99,999,999). ` +
          'Contact system administrator to implement ID format migration or counter reset strategy.'
        );
      }
      
      // For other ID generation errors, preserve the original error with context
      throw new Error(`${contextualMessage}\nOriginal error: ${error.message}`);
    }
    
    // For unexpected errors, provide fallback context
    const unexpectedMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unexpected error during ${idFieldName} generation for ${entityType} document: ${unexpectedMessage}\n` +
      'This may indicate database connectivity issues or system configuration problems.'
    );
  }
}