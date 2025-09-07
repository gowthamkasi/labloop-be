/**
 * Password Domain Service
 * Handles password hashing, validation, and security requirements
 */

import bcrypt from 'bcrypt';
import { PasswordRequirementsError } from '../exceptions/index.js';

export interface IPasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
}

export interface IPasswordService {
  hashPassword(plainPassword: string): string;
  comparePasswords(plainPassword: string, hashedPassword: string): boolean;
  isStrongPassword(password: string, userInfo?: any): boolean;
  generateTemporaryPassword(): string;
  validatePasswordStrength(password: string, userInfo?: any): { valid: boolean; errors: string[] };
}

export class PasswordService implements IPasswordService {
  private readonly requirements: IPasswordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbidCommonPasswords: true,
    forbidPersonalInfo: true
  };

  private readonly commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',\n    '123456789', 'welcome', 'admin', 'letmein', 'monkey', '1234567890',\n    'dragon', 'master', 'hello', 'iloveyou', '123123', 'welcome123'\n  ];

  private readonly saltRounds = 12; // High cost for healthcare security\n\n  public hashPassword(plainPassword: string): string {\n    if (!plainPassword) {\n      throw new Error('Password is required');\n    }\n\n    return bcrypt.hashSync(plainPassword, this.saltRounds);\n  }\n\n  public comparePasswords(plainPassword: string, hashedPassword: string): boolean {\n    if (!plainPassword || !hashedPassword) {\n      return false;\n    }\n\n    try {\n      return bcrypt.compareSync(plainPassword, hashedPassword);\n    } catch (error) {\n      return false;\n    }\n  }\n\n  public isStrongPassword(password: string, userInfo?: any): boolean {\n    const validation = this.validatePasswordStrength(password, userInfo);\n    return validation.valid;\n  }\n\n  public validatePasswordStrength(\n    password: string, \n    userInfo?: any\n  ): { valid: boolean; errors: string[] } {\n    const errors: string[] = [];\n\n    if (!password) {\n      errors.push('Password is required');\n      return { valid: false, errors };\n    }\n\n    // Check minimum length\n    if (password.length < this.requirements.minLength) {\n      errors.push(`Password must be at least ${this.requirements.minLength} characters long`);\n    }\n\n    // Check character requirements\n    if (this.requirements.requireUppercase && !/[A-Z]/.test(password)) {\n      errors.push('Password must contain at least one uppercase letter');\n    }\n\n    if (this.requirements.requireLowercase && !/[a-z]/.test(password)) {\n      errors.push('Password must contain at least one lowercase letter');\n    }\n\n    if (this.requirements.requireNumbers && !/\\d/.test(password)) {\n      errors.push('Password must contain at least one number');\n    }\n\n    if (this.requirements.requireSpecialChars && !/[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]/.test(password)) {\n      errors.push('Password must contain at least one special character');\n    }\n\n    // Check against common passwords\n    if (this.requirements.forbidCommonPasswords) {\n      const lowerPassword = password.toLowerCase();\n      if (this.commonPasswords.some(common => lowerPassword.includes(common))) {\n        errors.push('Password cannot contain common words or patterns');\n      }\n    }\n\n    // Check against personal information\n    if (this.requirements.forbidPersonalInfo && userInfo) {\n      const personalInfo = [\n        userInfo.username,\n        userInfo.email?.split('@')[0],\n        userInfo.firstName,\n        userInfo.lastName,\n        userInfo.phone\n      ].filter(Boolean).map(info => info.toLowerCase());\n\n      const lowerPassword = password.toLowerCase();\n      if (personalInfo.some(info => lowerPassword.includes(info))) {\n        errors.push('Password cannot contain personal information');\n      }\n    }\n\n    // Check for repeated characters (more than 3 consecutive)\n    if (/(.)\1{3,}/.test(password)) {\n      errors.push('Password cannot contain more than 3 consecutive identical characters');\n    }\n\n    // Check for sequential characters\n    if (this.hasSequentialCharacters(password)) {\n      errors.push('Password cannot contain sequential characters (e.g., 123, abc)');\n    }\n\n    return {\n      valid: errors.length === 0,\n      errors\n    };\n  }\n\n  public generateTemporaryPassword(): string {\n    const length = 12;\n    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';\n    const lowercase = 'abcdefghijklmnopqrstuvwxyz';\n    const numbers = '0123456789';\n    const special = '!@#$%^&*';\n    \n    const allChars = uppercase + lowercase + numbers + special;\n    \n    let password = '';\n    \n    // Ensure at least one character from each category\n    password += this.getRandomChar(uppercase);\n    password += this.getRandomChar(lowercase);\n    password += this.getRandomChar(numbers);\n    password += this.getRandomChar(special);\n    \n    // Fill the rest randomly\n    for (let i = 4; i < length; i++) {\n      password += this.getRandomChar(allChars);\n    }\n    \n    // Shuffle the password\n    return password.split('').sort(() => Math.random() - 0.5).join('');\n  }\n\n  public getPasswordRequirements(): IPasswordRequirements {\n    return { ...this.requirements };\n  }\n\n  public updateRequirements(newRequirements: Partial<IPasswordRequirements>): void {\n    Object.assign(this.requirements, newRequirements);\n  }\n\n  private getRandomChar(chars: string): string {\n    return chars.charAt(Math.floor(Math.random() * chars.length));\n  }\n\n  private hasSequentialCharacters(password: string): boolean {\n    const sequences = [\n      '0123456789',\n      'abcdefghijklmnopqrstuvwxyz',\n      'qwertyuiopasdfghjklzxcvbnm' // keyboard layout\n    ];\n\n    const lowerPassword = password.toLowerCase();\n    \n    for (const sequence of sequences) {\n      for (let i = 0; i <= sequence.length - 3; i++) {\n        const subSequence = sequence.substring(i, i + 3);\n        const reverseSubSequence = subSequence.split('').reverse().join('');\n        \n        if (lowerPassword.includes(subSequence) || lowerPassword.includes(reverseSubSequence)) {\n          return true;\n        }\n      }\n    }\n    \n    return false;\n  }\n\n  public estimatePasswordStrength(password: string): {\n    score: number; // 0-4\n    label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';\n    feedback: string[];\n  } {\n    let score = 0;\n    const feedback: string[] = [];\n\n    // Length scoring\n    if (password.length >= 8) score += 1;\n    else feedback.push('Use at least 8 characters');\n    \n    if (password.length >= 12) score += 1;\n    else feedback.push('Consider using 12 or more characters');\n\n    // Character variety scoring\n    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {\n      score += 1;\n    } else {\n      feedback.push('Mix uppercase and lowercase letters');\n    }\n\n    if (/\\d/.test(password) && /[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]/.test(password)) {\n      score += 1;\n    } else {\n      feedback.push('Include numbers and special characters');\n    }\n\n    // Deduct points for common patterns\n    if (this.commonPasswords.some(common => password.toLowerCase().includes(common))) {\n      score = Math.max(0, score - 1);\n      feedback.push('Avoid common words and patterns');\n    }\n\n    const labels: Array<'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'> = [\n      'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'\n    ];\n\n    return {\n      score,\n      label: labels[score] || 'Very Weak',\n      feedback\n    };\n  }\n}"