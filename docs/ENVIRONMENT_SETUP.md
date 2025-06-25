# 🔧 Environment Setup Guide

This guide provides step-by-step instructions for setting up all required environment variables and external services for the Early Autism Detector application.

## Table of Contents
- [Overview](#overview)
- [Supabase Setup](#supabase-setup)
- [AI API Configuration](#ai-api-configuration)
- [Google Maps API](#google-maps-api)
- [SendGrid Email Service](#sendgrid-email-service)
- [Environment Variables](#environment-variables)
- [Verification](#verification)

## Overview

The Early Autism Detector requires several external services:

| Service | Purpose | Required |
|---------|---------|----------|
| Supabase | Database & Authentication | ✅ Yes |
| OpenAI | AI Chat Assistant | ❌ Optional |
| Google Maps | Center Locator & Maps | ✅ Yes |
| SendGrid | Email Notifications | ❌ Optional |

## Supabase Setup

### 1. Create Supabase Account

1. **Sign up at [supabase.com](https://supabase.com)**
   - Use your email or GitHub account
   - Verify your email address

2. **Create a new project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `early-autism-detector`
   - Set a strong database password
   - Select a region close to your users

### 2. Configure Database

1. **Access SQL Editor**
   - Go to your project dashboard
   - Click "SQL Editor" in the sidebar

2. **Run setup scripts**
   ```sql
   -- Run the main setup script
   -- Copy and paste content from: supabase_setup.sql
   ```

3. **Add sample data**
   ```sql
   -- Run the sample data script
   -- Copy and paste content from: sample_autism_centers.sql
   ```

### 3. Get API Keys

1. **Navigate to Settings**
   - Click "Settings" → "API"

2. **Copy the following values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Configure Authentication

1. **Go to Authentication Settings**
   - Click "Authentication" → "Settings"

2. **Configure Site URL**
   - **Development**: `http://localhost:3000`
   - **Production**: `https://your-domain.com`

3. **Set up Email Templates** (Optional)
   - Customize confirmation email
   - Set up password reset template

## AI API Configuration

### Option 1: OpenAI API

1. **Create OpenAI Account**
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Verify your phone number

2. **Generate API Key**
   - Go to "API Keys" section
   - Click "Create new secret key"
   - Copy the key: `sk-...`
   - **Important**: Save this key securely, you won't see it again

3. **Set up Billing**
   - Add payment method
   - Set usage limits to control costs
   - Monitor usage in the dashboard



## Google Maps API

### 1. Create Google Cloud Project

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
   - Sign in with your Google account
   - Accept terms of service

2. **Create new project**
   - Click "Select a project" → "New Project"
   - Enter project name: `early-autism-detector`
   - Click "Create"

### 2. Enable Required APIs

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" → "Library"

2. **Enable the following APIs**:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Directions API** (for navigation features)

### 3. Create API Key

1. **Go to Credentials**
   - Click "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"

2. **Restrict the API Key**
   - Click "Restrict Key"
   - **Application restrictions**:
     - HTTP referrers (web sites)
     - Add: `localhost:3000/*` (development)
     - Add: `your-domain.com/*` (production)
   - **API restrictions**:
     - Select "Restrict key"
     - Choose the APIs you enabled above

3. **Copy API Key**
   - Save the key: `AIzaSy...`

### 4. Set up Billing

1. **Enable billing**
   - Go to "Billing" in Google Cloud Console
   - Add payment method
   - Set up budget alerts

2. **Monitor usage**
   - Check API usage regularly
   - Set quotas to control costs

## SendGrid Email Service (Optional)

### 1. Create SendGrid Account

1. **Sign up at [sendgrid.com](https://sendgrid.com)**
   - Use free tier for development
   - Verify your email address

2. **Complete sender verification**
   - Verify your sender email address
   - Complete domain authentication (for production)

### 2. Create API Key

1. **Navigate to API Keys**
   - Go to "Settings" → "API Keys"
   - Click "Create API Key"

2. **Configure permissions**
   - Choose "Restricted Access"
   - Enable "Mail Send" permissions
   - Copy the API key: `SG.`

### 3. Set up Email Templates

1. **Create templates**
   - Welcome email
   - Assessment reminders
   - Progress updates

## Environment Variables

### 1. Create Environment File

Create `.env.local` in your project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

### 2. Configure Variables

```env
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# AI API CONFIGURATION (Choose one or both)
# =============================================================================

# OpenAI Configuration
OPENAI_API_KEY=sk-...



# =============================================================================
# GOOGLE MAPS CONFIGURATION
# =============================================================================
NEXT_PUBLIC_GMAPS_KEY=AIzaSy...

# =============================================================================
# EMAIL CONFIGURATION (Optional)
# =============================================================================
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# =============================================================================
# SECURITY (Production only)
# =============================================================================
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=https://your-domain.com
```

### 3. Environment-Specific Configurations

#### Development (.env.local)
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Staging (.env.staging)
```env
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
```

#### Production (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Verification

### 1. Test Database Connection

```bash
# Run the development server
npm run dev

# Check Supabase connection
curl http://localhost:3000/api/test-supabase
```

### 2. Test AI API

```bash
# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### 3. Test Google Maps

1. **Open the application**
   - Go to `http://localhost:3000`
   - Navigate to "Center Locator"
   - Verify map loads correctly

2. **Check browser console**
   - No API key errors
   - Map tiles load properly

### 4. Test Email (if configured)

```bash
# Test email sending
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","content":"Hello"}'
```

## Security Best Practices

### 1. API Key Security

- **Never commit API keys to version control**
- **Use environment variables only**
- **Rotate keys regularly**
- **Set up usage alerts**

### 2. Access Restrictions

- **Restrict API keys by domain**
- **Set up IP restrictions for production**
- **Monitor API usage**
- **Implement rate limiting**

### 3. Environment Separation

- **Use different keys for different environments**
- **Separate development and production databases**
- **Monitor all environments**

## Troubleshooting

### Common Issues

#### Supabase Connection Errors
```bash
# Check if URL and key are correct
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Google Maps Not Loading
- Verify API key restrictions
- Check enabled APIs
- Monitor quota usage
- Check browser console for errors

#### AI Chat Not Working
- Verify API key format
- Check API usage limits
- Monitor error logs
- Test with simple requests

### Getting Help

1. **Check service status pages**
   - [Supabase Status](https://status.supabase.com)
   - [OpenAI Status](https://status.openai.com)
   - [Google Cloud Status](https://status.cloud.google.com)

2. **Review documentation**
   - Service-specific documentation
   - API reference guides
   - Community forums

3. **Contact support**
   - Service provider support
   - Community Discord/Slack
   - GitHub issues

## Cost Management

### Estimated Monthly Costs

| Service | Free Tier | Typical Usage | Estimated Cost |
|---------|-----------|---------------|----------------|
| Supabase | 500MB DB, 2GB bandwidth | Small app | $0-25/month |
| OpenAI | $5 credit | Moderate chat | $10-50/month |
| Google Maps | $200 credit | 1000 requests/day | $0-100/month |
| SendGrid | 100 emails/day | Basic notifications | $0-15/month |

### Cost Optimization

1. **Set up billing alerts**
2. **Monitor usage regularly**
3. **Implement caching**
4. **Use free tiers effectively**
5. **Optimize API calls**

Your environment is now ready for development! 🚀
