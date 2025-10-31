/**
 * Security event types for logging
 */
export enum SecurityEventType {
  AUTH_SUCCESS = "AUTH_SUCCESS",
  AUTH_FAILURE = "AUTH_FAILURE",
  AUTH_RATE_LIMIT = "AUTH_RATE_LIMIT",
  FORM_SUBMIT = "FORM_SUBMIT",
  FORM_SUBMIT_FAILURE = "FORM_SUBMIT_FAILURE",
  EMAIL_SENT = "EMAIL_SENT",
  EMAIL_FAILURE = "EMAIL_FAILURE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  endpoint: string;
  details?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Log a security event
 * In production, this should send to a logging service (e.g., Datadog, Sentry, CloudWatch)
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Console logging for development
  if (event.severity === "critical" || event.severity === "high") {
    console.error("[SECURITY]", JSON.stringify(logEntry, null, 2));
  } else {
    console.log("[SECURITY]", JSON.stringify(logEntry, null, 2));
  }

  // TODO: In production, send to logging service
  // Example: Send to Sentry, Datadog, or CloudWatch
  // await sendToLoggingService(logEntry);
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  success: boolean,
  ip: string,
  userAgent?: string,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    type: success ? SecurityEventType.AUTH_SUCCESS : SecurityEventType.AUTH_FAILURE,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint: "/api/auth/login",
    details,
    severity: success ? "low" : "medium",
  });
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  ip: string,
  endpoint: string,
  userAgent?: string
): void {
  logSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint,
    severity: "high",
  });
}

/**
 * Log form submission
 */
export function logFormSubmission(
  ip: string,
  formType: string,
  jobNumber: string,
  success: boolean,
  userAgent?: string
): void {
  logSecurityEvent({
    type: success ? SecurityEventType.FORM_SUBMIT : SecurityEventType.FORM_SUBMIT_FAILURE,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint: "/api/forms/submit",
    details: { formType, jobNumber },
    severity: success ? "low" : "medium",
  });
}

/**
 * Log email sent
 */
export function logEmailSent(
  ip: string,
  recipientEmail: string,
  success: boolean,
  userAgent?: string
): void {
  logSecurityEvent({
    type: success ? SecurityEventType.EMAIL_SENT : SecurityEventType.EMAIL_FAILURE,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint: "/api/forms/submit-and-email",
    details: { recipientEmail },
    severity: success ? "low" : "medium",
  });
}

/**
 * Log validation error (potential attack attempt)
 */
export function logValidationError(
  ip: string,
  endpoint: string,
  errors: any,
  userAgent?: string
): void {
  logSecurityEvent({
    type: SecurityEventType.VALIDATION_ERROR,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint,
    details: { errors },
    severity: "medium",
  });
}

/**
 * Log unauthorized access attempt
 */
export function logUnauthorizedAccess(
  ip: string,
  endpoint: string,
  userAgent?: string
): void {
  logSecurityEvent({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    endpoint,
    severity: "high",
  });
}
