# Security Documentation - SubSpace

This document outlines the security measures implemented in the SubSpace application to address OWASP Top 10 vulnerabilities and provide a secure platform for construction safety forms.

## Security Measures Implemented

### 1. Authentication & Authorization

#### JWT-Based Authentication
- **Location:** `lib/auth.ts`
- **Implementation:**
  - JWT tokens are used for admin authentication
  - Tokens are stored in httpOnly, secure cookies (not accessible to JavaScript)
  - Token expiration: 8 hours
  - Automatic token verification on protected routes

#### Protected Routes
- `/api/forms/list` - Requires valid JWT token with admin role
- `/admin` - Client-side check with server-side verification

#### Password Security
- Admin password verification (simple password check)
- Future enhancement: bcrypt hashing for database-stored passwords
- Minimum recommended password length: 12 characters

### 2. Rate Limiting

#### Implementation
- **Location:** `lib/rate-limit.ts`
- **Strategy:** In-memory rate limiting (production should use Redis)

#### Rate Limit Policies
- **Authentication endpoints:** 5 attempts per 15 minutes
- **Form submission:** 5 submissions per minute
- **General API:** 30 requests per minute

#### Features
- IP-based tracking
- Automatic cleanup of old entries
- Rate limit headers in responses (X-RateLimit-*)

### 3. Input Validation

#### Zod Schema Validation
- **Location:** `lib/validation.ts`
- **Validates:**
  - Form submission data structure
  - Email formats
  - Date and time formats
  - String length limits
  - Required fields

#### Signature Validation
- Maximum size: 1MB base64 encoded
- Must be valid PNG data URL
- Format verification

#### Email Allowlist
- **Environment Variable:** `EMAIL_ALLOWLIST`
- Optional domain-based email filtering
- Comma-separated list of allowed domains
- Example: `deacon.build,example.com`

### 4. XSS Prevention

#### Output Sanitization
- **Location:** `lib/sanitize.ts`
- **Methods:**
  - `escapeHtml()` - Escapes HTML special characters
  - `sanitizeHtml()` - Uses DOMPurify for HTML sanitization
  - `createSafeEmailHtml()` - Template-based safe HTML generation

#### Email Security
- All user inputs in emails are escaped
- Template-based email generation prevents injection
- HTML attributes are properly quoted

#### React Built-in Protection
- React automatically escapes JSX expressions
- No use of `dangerouslySetInnerHTML`
- All user data rendered through safe JSX

### 5. Security Headers

#### Configured Headers
- **Location:** `next.config.ts`
- **Headers Implemented:**
  - `Strict-Transport-Security` - Forces HTTPS
  - `X-Frame-Options` - Prevents clickjacking
  - `X-Content-Type-Options` - Prevents MIME sniffing
  - `X-XSS-Protection` - Browser XSS filter
  - `Referrer-Policy` - Controls referrer information
  - `Content-Security-Policy` - Restricts resource loading
  - `Permissions-Policy` - Controls browser features

### 6. Security Logging

#### Event Types Logged
- **Location:** `lib/security-logger.ts`
- Authentication attempts (success/failure)
- Rate limit violations
- Form submissions
- Email operations
- Validation errors
- Unauthorized access attempts

#### Log Levels
- **Low:** Normal operations
- **Medium:** Failed operations, validation errors
- **High:** Rate limit exceeded, unauthorized access
- **Critical:** Security violations

#### Production Recommendations
- Integrate with logging service (Datadog, Sentry, CloudWatch)
- Set up alerting for high/critical events
- Regular log review

### 7. CSRF Protection

#### Current Implementation
- SameSite cookie attribute set to "strict"
- All state-changing operations require authentication
- Cookies are httpOnly and secure in production

#### Future Enhancements
- CSRF token middleware
- Double-submit cookie pattern

### 8. SQL Injection Prevention

#### Drizzle ORM Protection
- **Location:** All database queries
- Parameterized queries via Drizzle ORM
- No raw SQL with user input
- Type-safe database operations

### 9. Environment Variable Security

#### Required Variables
```
DATABASE_URL          - Postgres connection string
ADMIN_PASSWORD       - Admin authentication password
JWT_SECRET           - Secret for JWT signing (32+ chars)
RESEND_API_KEY       - Email service API key
RESEND_FROM_EMAIL    - Verified sender email
EMAIL_ALLOWLIST      - Optional domain allowlist
```

#### Best Practices
- Never commit `.env.local` to version control
- Use strong, unique values for secrets
- Generate JWT_SECRET with: `openssl rand -base64 32`
- Rotate secrets periodically

## Security Checklist for Deployment

### Before Production

- [ ] Set strong ADMIN_PASSWORD (12+ characters)
- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Configure EMAIL_ALLOWLIST if needed
- [ ] Enable HTTPS/SSL certificates
- [ ] Set NODE_ENV=production
- [ ] Review and update CSP headers
- [ ] Set up logging infrastructure
- [ ] Configure rate limiting with Redis
- [ ] Enable database connection pooling
- [ ] Set up database backups
- [ ] Review security headers
- [ ] Test authentication flow
- [ ] Test rate limiting
- [ ] Verify XSS protection

### Production Monitoring

- [ ] Monitor authentication failures
- [ ] Track rate limit violations
- [ ] Review security logs daily
- [ ] Set up alerts for suspicious activity
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor for CVEs

## Incident Response

### If Security Breach Suspected

1. **Immediate Actions:**
   - Rotate JWT_SECRET immediately
   - Review security logs
   - Check for suspicious form submissions
   - Review email send history

2. **Investigation:**
   - Analyze security logs
   - Check rate limit violations
   - Review authentication attempts
   - Identify affected data

3. **Remediation:**
   - Patch vulnerabilities
   - Update security measures
   - Notify affected parties if necessary
   - Document incident

## Known Limitations

### Current Implementation

1. **In-Memory Rate Limiting:**
   - Does not persist across server restarts
   - Does not work in multi-server deployments
   - **Solution:** Implement Redis-based rate limiting for production

2. **Simple Password Authentication:**
   - Admin password stored in plain text (env variable)
   - **Solution:** Implement database-stored hashed passwords with bcrypt

3. **No MFA:**
   - Single-factor authentication only
   - **Solution:** Add TOTP-based 2FA for admin accounts

4. **Session Management:**
   - No concurrent session detection
   - No forced logout on password change
   - **Solution:** Implement session tracking

## Future Security Enhancements

### High Priority
1. Implement Redis-based rate limiting
2. Add bcrypt password hashing for database-stored credentials
3. Implement CSRF token middleware
4. Add multi-factor authentication (MFA)
5. Implement session tracking and management

### Medium Priority
1. Add input sanitization on database write
2. Implement audit logging to database
3. Add IP allowlist/blocklist
4. Implement account lockout after failed attempts
5. Add password complexity requirements
6. Implement password reset functionality

### Low Priority
1. Add security metrics dashboard
2. Implement automated security scanning
3. Add penetration testing automation
4. Implement security headers reporting
5. Add Content Security Policy reporting

## Security Testing

### Manual Testing

```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'; done

# Test XSS prevention
curl -X POST http://localhost:3000/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{"jobNumber":"<script>alert(1)</script>",...}'

# Test authentication
curl http://localhost:3000/api/forms/list
# Should return 401 Unauthorized
```

### Automated Testing
Run dependency security audit:
```bash
npm audit
```

## Contact

For security concerns or to report vulnerabilities, please contact:
- Email: security@yourcompany.com

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
