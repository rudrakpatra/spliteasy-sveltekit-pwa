# Authentication Setup Guide

This project uses Google OAuth with Arctic and Drizzle ORM with Neon database.

## Prerequisites

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add authorized redirect URIs:
   - Development: `http://localhost:5173/signin/google/callback`
   - Production: `https://yourdomain.com/signin/google/callback`

### 2. Neon Database Setup

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string

## Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5173/signin/google/callback"
```

## Database Setup

### Schema Overview

The application uses the following tables:

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(256) PRIMARY KEY, -- Uses Google sub as ID
  name VARCHAR(128) NOT NULL,
  email VARCHAR(256) NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  img TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id VARCHAR(256) NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

#### Accounts Table (OAuth)
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(256) NOT NULL REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(256) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Running Migrations

1. **Generate migrations**:
   ```bash
   bun run db:generate
   ```

2. **Push schema to database**:
   ```bash
   bun run db:push
   ```

3. **Open Drizzle Studio** (optional):
   ```bash
   bun run db:studio
   ```

## Running the Application

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start development server**:
   ```bash
   bun run dev
   ```

3. **Open** [http://localhost:5173](http://localhost:5173)

## Features

- ✅ Google OAuth authentication with Arctic
- ✅ User session management
- ✅ Type-safe database operations with Drizzle ORM
- ✅ Responsive UI with shadcn-svelte components
- ✅ Secure session cookies with CSRF protection

## Authentication Flow

1. User clicks "Continue with Google" on `/auth/signin`
2. Form submits to `/auth/signin/callback` which initiates OAuth flow
3. Google redirects back to `/auth/signin/callback` with authorization code
4. Server exchanges code for tokens and fetches user info
5. User is created/updated in database using Google `sub` as primary key
6. Session is created and cookie is set
7. User is redirected to home page

## Routes

- `/auth/signin` - Sign in page with Google OAuth button
- `/auth/switch` - Switch account page (shows current user + Google sign-in option)
- `/auth/signin/callback` - OAuth callback handler (handles both initiation and callback)

## Security Features

- **CSRF Protection**: State parameter validation
- **PKCE**: Code verifier for enhanced security
- **HTTP-Only Cookies**: Session tokens stored securely
- **Session Expiration**: 30-day sessions with 15-day renewal
- **Token Storage**: OAuth tokens stored in accounts table

## Next Steps

1. Set up your Google OAuth credentials
2. Create a Neon database
3. Configure environment variables
4. Run database migrations
5. Start the development server
6. Test the Google sign-in functionality

## Troubleshooting

### Common Issues

1. **"Invalid request" error**: Check that your redirect URI matches exactly in Google Console
2. **Database connection errors**: Verify your DATABASE_URL is correct and includes `?sslmode=require`
3. **OAuth errors**: Ensure Google+ API is enabled in your Google Cloud project

### Debug Mode

To see detailed OAuth errors, check the server console logs. The callback endpoint logs errors before redirecting.
