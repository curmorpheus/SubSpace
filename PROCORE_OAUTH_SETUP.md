# Procore OAuth Authentication Setup

This document explains how to configure Procore OAuth authentication for SubSpace.

## Overview

SubSpace now supports two authentication methods:
1. **Procore OAuth** - Sign in with your Procore account (recommended)
2. **Password Authentication** - Traditional password-based login (fallback)

## Prerequisites

- A Procore account with admin access
- Access to the Procore Developer Portal

## Setup Instructions

### 1. Register Your Application in Procore Developer Portal

1. Go to [Procore Developer Portal](https://developers.procore.com/)
2. Sign in with your Procore account
3. Navigate to **My Apps**
4. Click **Create New App**
5. Fill in the app details:
   - **App Name**: SubSpace
   - **Description**: Construction safety form system
   - **App Type**: OAuth 2.0 Application
   - **Redirect URI**: `https://subspace.deacon.build/api/auth/callback/procore`
     - For local development: `http://localhost:3000/api/auth/callback/procore`

6. Save the application
7. Copy the following credentials:
   - **Client ID**
   - **Client Secret**
   - **App ID**

### 2. Configure Environment Variables

Add the following to your `.env.local` file (or Vercel environment variables for production):

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://subspace.deacon.build

# Procore OAuth Configuration
PROCORE_CLIENT_ID=<your-client-id>
PROCORE_CLIENT_SECRET=<your-client-secret>
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Update Production Environment (Vercel)

If deploying to Vercel, add these environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `NEXTAUTH_SECRET` → Your generated secret
   - `NEXTAUTH_URL` → `https://subspace.deacon.build`
   - `PROCORE_CLIENT_ID` → Your Procore Client ID
   - `PROCORE_CLIENT_SECRET` → Your Procore Client Secret

4. Redeploy your application for changes to take effect

### 4. Update Database Schema

Run the database migration to add OAuth support fields:

```bash
npm run db:push
```

This will update the `superintendents` table with:
- `authProvider` - Tracks authentication method ('local' or 'procore')
- `procoreUserId` - Unique Procore user identifier
- `procoreCompanyId` - Procore company identifier
- `password` - Now nullable for OAuth users
- `lastLoginAt` - Timestamp of last successful login

## How It Works

### First-Time Procore Login

1. User clicks "Sign in with Procore" on the login page
2. Redirected to Procore's OAuth authorization page
3. User authorizes SubSpace to access their Procore account
4. Redirected back to SubSpace with authorization code
5. SubSpace exchanges code for access token and retrieves user profile
6. New user record created in database with Procore information
7. User is authenticated and redirected to admin dashboard

### Subsequent Logins

1. User clicks "Sign in with Procore"
2. Procore recognizes previous authorization
3. Immediately redirects back to SubSpace
4. User record updated with latest Procore information
5. User authenticated and redirected to admin dashboard

### Password Authentication (Fallback)

Users can still use password authentication:
1. Enter admin password on login page
2. Traditional bcrypt password verification
3. JWT token issued for session management

## User Management

### Procore OAuth Users

- Automatically created on first login
- Email from Procore account used as identifier
- No password required
- `authProvider` = 'procore'

### Password Users

- Manually created with hashed password
- `authProvider` = 'local'
- Can be migrated to Procore OAuth by logging in with Procore

### Migrating Existing Users

If a user with the same email exists:
1. Password-based user logs in with Procore
2. Account automatically upgraded to Procore OAuth
3. `authProvider` updated to 'procore'
4. Procore user ID and company ID stored
5. Password remains in database but is no longer used

## Security Considerations

1. **OAuth Tokens**: Access tokens are not stored in database (stateless authentication)
2. **Session Management**: JWT-based sessions with 8-hour expiration
3. **HTTPS Only**: OAuth requires HTTPS in production
4. **Email Verification**: Procore handles email verification
5. **Scopes**: Limited to `openid profile email` for minimal data access

## Troubleshooting

### "Redirect URI mismatch" Error

- Ensure redirect URI in Procore app matches exactly: `https://subspace.deacon.build/api/auth/callback/procore`
- Check for trailing slashes or http vs https mismatches

### "Client authentication failed" Error

- Verify `PROCORE_CLIENT_ID` and `PROCORE_CLIENT_SECRET` are correct
- Check for extra spaces or newlines in environment variables

### Users Can't Access Dashboard After Login

- Verify `NEXTAUTH_URL` matches your production URL
- Check database connection and `superintendents` table exists
- Look for errors in Vercel logs

### Local Development Issues

- Use `NEXTAUTH_URL=http://localhost:3000` for local development
- Add `http://localhost:3000/api/auth/callback/procore` as redirect URI in Procore app
- Procore OAuth may require HTTPS even in development (use ngrok if needed)

## API Endpoints

### NextAuth.js Routes

- `GET /api/auth/[...nextauth]` - OAuth callback handler
- `POST /api/auth/[...nextauth]` - Authentication requests

### Legacy Password Routes (Still Supported)

- `POST /api/auth/login` - Password-based login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout current session

## Resources

- [Procore Developer Documentation](https://developers.procore.com/documentation/oauth-introduction)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
