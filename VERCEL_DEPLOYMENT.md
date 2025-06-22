# 🚀 Vercel Deployment Guide for Early Autism Detector

This guide will help you deploy your Early Autism Detector application to Vercel.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com) (your repository is already set up)
- [Supabase Account](https://supabase.com)
- API keys for external services

## Step 1: Prepare Your Environment Variables

Before deploying, you'll need to set up the following environment variables in Vercel:

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API Keys (choose one or both)
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_BASE_URL=https://api.deepseek.com/v1/chat/completions

# Google Maps API
NEXT_PUBLIC_GMAPS_KEY=your_google_maps_api_key

# SendGrid (optional - for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `MiqaSurya/early_autism_detection`

2. **Configure Project Settings**
   - Framework Preset: Next.js
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

3. **Add Environment Variables**
   - In the "Environment Variables" section, add all the variables from Step 1
   - Make sure to mark public variables (those starting with `NEXT_PUBLIC_`) as such

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**
   ```bash
   cd /path/to/your/project
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new one
   - Set up environment variables when prompted

## Step 3: Configure Supabase for Production

1. **Update Supabase URL Allowlist**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > URL Configuration
   - Add your Vercel domain to the "Site URL" and "Redirect URLs"
   - Example: `https://your-app-name.vercel.app`

2. **Update CORS Settings**
   - In Supabase, go to Settings > API
   - Add your Vercel domain to allowed origins

## Step 4: Set Up Custom Domain (Optional)

1. **Add Custom Domain in Vercel**
   - Go to your project settings in Vercel
   - Navigate to "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain
   - Update Supabase URL configuration

## Step 5: Configure External Services

### Google Maps API
- Ensure your Google Maps API key has the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- Add your Vercel domain to the API key restrictions

### OpenAI/DeepSeek API
- Ensure your API keys are valid and have sufficient credits
- Monitor usage in your respective dashboards

## Step 6: Test Your Deployment

1. **Verify Core Functionality**
   - User registration and login
   - Child profile creation
   - M-CHAT-R assessment
   - Progress tracking
   - Autism center locator

2. **Check API Endpoints**
   - Test all API routes are working
   - Verify database connections
   - Check external API integrations

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors: `npm run build` locally
   - Verify all dependencies are in package.json
   - Check for missing environment variables

2. **Runtime Errors**
   - Check Vercel function logs
   - Verify environment variables are set correctly
   - Ensure Supabase configuration is correct

3. **API Issues**
   - Verify API keys are valid
   - Check CORS settings
   - Monitor rate limits

### Vercel-Specific Configurations

The project includes optimized configurations for Vercel:

- **vercel.json**: Deployment configuration
- **next.config.js**: Next.js optimizations
- **Middleware**: Authentication handling
- **API Routes**: Serverless function configuration

## Monitoring and Maintenance

1. **Monitor Performance**
   - Use Vercel Analytics
   - Monitor Core Web Vitals
   - Check function execution times

2. **Update Dependencies**
   - Regularly update npm packages
   - Monitor security vulnerabilities
   - Test updates in preview deployments

3. **Database Maintenance**
   - Monitor Supabase usage
   - Backup important data
   - Optimize queries for performance

## Support

If you encounter issues during deployment:

1. Check Vercel documentation
2. Review Supabase logs
3. Check the project's GitHub issues
4. Contact support for external services

Your Early Autism Detector app is now ready for production on Vercel! 🎉
