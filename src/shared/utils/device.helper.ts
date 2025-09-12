import { FastifyRequest } from 'fastify';
import { DeviceInfo, DeviceLocation } from '../interfaces/Device.interface.js';

export class DeviceHelper {
  /**
   * Extract device information from request headers
   */
  static extractDeviceInfo(request: FastifyRequest): DeviceInfo {
    const userAgent = request.headers['user-agent'] || '';
    
    const browser = this.getBrowser(userAgent);
    const os = this.getOS(userAgent);
    const version = this.getBrowserVersion(userAgent);
    
    const deviceInfo: DeviceInfo = {
      type: this.getDeviceType(userAgent),
      userAgent: userAgent.slice(0, 500), // Truncate to fit schema
      ...(browser && { browser }),
      ...(os && { os }),
      ...(version && { version })
    };

    return deviceInfo;
  }

  /**
   * Extract location information from request
   */
  static extractLocationInfo(request: FastifyRequest): DeviceLocation {
    const ip = this.getClientIP(request);
    
    const location: DeviceLocation = { ip };
    
    // TODO: Integrate with IP geolocation service for country/city/timezone
    // Only add optional properties if they have values
    
    return location;
  }

  /**
   * Get client IP address from request
   */
  private static getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const remoteAddress = request.socket?.remoteAddress;

    if (forwarded) {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    
    if (realIP) {
      return realIP;
    }

    return remoteAddress || 'unknown';
  }

  /**
   * Determine device type from user agent
   */
  private static getDeviceType(userAgent: string): DeviceInfo['type'] {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(ua)) {
      return 'mobile';
    }
    
    if (/tablet|ipad|android(?!.*mobile)/.test(ua)) {
      return 'tablet';
    }
    
    if (/windows|macintosh|linux|x11/.test(ua)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  /**
   * Extract browser name from user agent
   */
  private static getBrowser(userAgent: string): string | undefined {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';
    
    return undefined;
  }

  /**
   * Extract OS from user agent
   */
  private static getOS(userAgent: string): string | undefined {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows nt 10')) return 'Windows 10';
    if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
    if (ua.includes('windows nt 6.2')) return 'Windows 8';
    if (ua.includes('windows nt 6.1')) return 'Windows 7';
    if (ua.includes('windows')) return 'Windows';
    
    if (ua.includes('mac os x')) {
      const match = ua.match(/mac os x ([\d_]+)/);
      if (match?.[1]) {
        return `macOS ${match[1].replace(/_/g, '.')}`;
      }
      return 'macOS';
    }
    
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone os')) return 'iOS';
    if (ua.includes('ipad')) return 'iPadOS';
    
    return undefined;
  }

  /**
   * Extract browser version from user agent
   */
  private static getBrowserVersion(userAgent: string): string | undefined {
    const ua = userAgent;
    
    // Chrome version
    let match = ua.match(/Chrome\/([\d.]+)/);
    if (match?.[1]) return match[1];
    
    // Firefox version
    match = ua.match(/Firefox\/([\d.]+)/);
    if (match?.[1]) return match[1];
    
    // Safari version
    match = ua.match(/Version\/([\d.]+).*Safari/);
    if (match?.[1]) return match[1];
    
    // Edge version
    match = ua.match(/Edg\/([\d.]+)/);
    if (match?.[1]) return match[1];
    
    return undefined;
  }

  /**
   * Generate a friendly device name based on device info
   */
  static generateDeviceName(deviceInfo: DeviceInfo): string {
    const parts: string[] = [];
    
    if (deviceInfo.browser) {
      parts.push(deviceInfo.browser);
    }
    
    if (deviceInfo.os) {
      parts.push(`on ${deviceInfo.os}`);
    }
    
    if (deviceInfo.type && deviceInfo.type !== 'unknown') {
      parts.push(`(${deviceInfo.type})`);
    }
    
    if (parts.length === 0) {
      return 'Unknown Device';
    }
    
    return parts.join(' ');
  }

  /**
   * Calculate device expiry date based on refresh token expiry
   */
  static calculateExpiryDate(refreshExpiresIn: string | undefined): Date {
    const now = new Date();
    
    if (!refreshExpiresIn) {
      // Default to 7 days if no expiry provided
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    
    // Parse expiry string like "7d", "24h", "30m"
    const match = refreshExpiresIn.match(/^(\d+)([dhm])$/);
    if (!match) {
      // Default to 7 days if parsing fails
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    
    const value = parseInt(match[1] || '7');
    const unit = match[2] || 'd';
    
    let milliseconds = 0;
    switch (unit) {
      case 'd':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'h':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'm':
        milliseconds = value * 60 * 1000;
        break;
    }
    
    return new Date(now.getTime() + milliseconds);
  }
}