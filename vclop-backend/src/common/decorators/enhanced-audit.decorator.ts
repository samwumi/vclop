import { SetMetadata } from '@nestjs/common';

/**
 * Enhanced Audit Decorator
 * 
 * Automatically logs detailed audit information for critical operations:
 * - Financial transactions (CRITICAL level)
 * - Customer data access (HIGH level)
 * - Permission changes (HIGH level)
 * - Loan lifecycle events (MEDIUM level)
 * - System configuration (MEDIUM level)
 * 
 * Usage:
 * @EnhancedAudit({ level: 'CRITICAL', category: 'FINANCIAL', description: 'Disburse loan' })
 * async disburse(...) { ... }
 */

export enum AuditLevel {
  LOW = 'LOW',           // General operations
  MEDIUM = 'MEDIUM',     // Important business operations
  HIGH = 'HIGH',         // Sensitive data access or modifications
  CRITICAL = 'CRITICAL', // Financial transactions, security changes
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  FINANCIAL = 'FINANCIAL',
  CUSTOMER_DATA = 'CUSTOMER_DATA',
  LOAN_LIFECYCLE = 'LOAN_LIFECYCLE',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
}

export interface EnhancedAuditOptions {
  level: keyof typeof AuditLevel;
  category: keyof typeof AuditCategory;
  description: string;
  captureRequest?: boolean;      // Capture request body
  captureResponse?: boolean;     // Capture response data
  captureBeforeState?: boolean;  // Capture entity state before operation
  captureAfterState?: boolean;   // Capture entity state after operation
  sensitiveFields?: string[];    // Fields to redact in logs
}

export const ENHANCED_AUDIT_KEY = 'enhanced_audit';

export const EnhancedAudit = (options: EnhancedAuditOptions) =>
  SetMetadata(ENHANCED_AUDIT_KEY, options);
