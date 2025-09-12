import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const ConfigValidator = z.object({
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional().default('1d'), // Default to 1 day
  NODE_ENV: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().optional().default('7d'), // Default to 7 days
});

export type Config = z.infer<typeof ConfigValidator>;

type Unit =
  | 'Years'
  | 'Year'
  | 'Yrs'
  | 'Yr'
  | 'Y'
  | 'Weeks'
  | 'Week'
  | 'W'
  | 'Days'
  | 'Day'
  | 'D'
  | 'Hours'
  | 'Hour'
  | 'Hrs'
  | 'Hr'
  | 'H'
  | 'Minutes'
  | 'Minute'
  | 'Mins'
  | 'Min'
  | 'M'
  | 'Seconds'
  | 'Second'
  | 'Secs'
  | 'Sec'
  | 's'
  | 'Milliseconds'
  | 'Millisecond'
  | 'Msecs'
  | 'Msec'
  | 'Ms';
type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;
type StringValue = `${number}` | `${number}${UnitAnyCase}` | `${number} ${UnitAnyCase}`;

export const config = {
  MONGODB_URI: process.env['MONGODB_URI'] as string,
  JWT_SECRET: process.env['JWT_SECRET'] as string,
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] as StringValue,
  JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] as StringValue,
  NODE_ENV: process.env['NODE_ENV'] as string,
};

export const validateConfig = async () => {
  await ConfigValidator.parseAsync(config);
  return config;
};

export const getConfig = () => {
  return config;
};
