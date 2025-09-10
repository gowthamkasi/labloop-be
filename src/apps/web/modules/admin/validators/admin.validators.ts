import { z } from 'zod';
import { UserRole, Gender } from '../../../../../shared/types/enums.js';

const AddressSchema = z
  .object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z
      .string()
      .regex(/^[0-9]{5,10}$/)
      .optional(),
    country: z.string().default('India').optional(),
  })
  .optional();

const ProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  mobileNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.nativeEnum(Gender).optional(),
  address: AddressSchema,
});

const EmploymentSchema = z
  .object({
    organizationId: z.string().min(1, 'Organization ID is required'),
    designation: z.string().max(100).optional(),
    department: z.string().max(100).optional(),
    joiningDate: z.string().datetime().optional(),
    reportingTo: z.string().optional(),
  })
  .optional();

const PermissionsSchema = z
  .object({
    canCreateCases: z.boolean().default(false),
    canEditCases: z.boolean().default(false),
    canDeleteCases: z.boolean().default(false),
    canCreateReports: z.boolean().default(false),
    canApproveReports: z.boolean().default(false),
    canManageUsers: z.boolean().default(false),
    canViewAnalytics: z.boolean().default(false),
    canManageInventory: z.boolean().default(false),
  })
  .optional();

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  email: z.string().email('Invalid email format').toLowerCase(),
  role: z.nativeEnum(UserRole),
  profile: ProfileSchema,
  employment: EmploymentSchema,
  permissions: PermissionsSchema,
  sendWelcomeEmail: z.boolean().default(true),
});

export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim()
    .optional(),
  email: z.string().email('Invalid email format').toLowerCase().optional(),
  role: z.nativeEnum(UserRole).optional(),
  profile: ProfileSchema.optional(),
  employment: EmploymentSchema.optional(),
  permissions: PermissionsSchema.optional(),
});

export const UserListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  organizationId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  department: z.string().optional(),
});

export const UserParamsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const ActivateUserSchema = z.object({
  isActive: z.boolean(),
});
