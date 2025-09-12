export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  version?: string;
  userAgent?: string;
}

export interface DeviceLocation {
  ip?: string;
  country?: string;
  city?: string;
  timezone?: string;
}

export interface Device {
  _id: string;
  deviceId: string; // DEV123456 format
  userId: string;
  deviceInfo: DeviceInfo;
  location?: DeviceLocation;
  refreshToken: string;
  isActive: boolean;
  isTrusted: boolean;
  deviceName?: string; // User-defined name like "iPhone 12", "Work Laptop"
  
  // Timestamps
  firstLogin: Date;
  lastActive: Date;
  expiresAt: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  version: number;
}