# 🚀 Production Deployment Guide

This guide walks you through deploying the Early Autism Detector application to production using automated CI/CD.

## 🔄 Automated Deployment Pipeline

The application uses GitHub Actions for automated testing, building, and deployment:

### Pipeline Stages
1. **Code Quality** - TypeScript checking, linting, security audit
2. **Testing** - Unit tests with coverage reporting
3. **Build Test** - Production build verification
4. **Security Scan** - Vulnerability scanning with Trivy
5. **Preview Deployment** - Automatic preview for pull requests
6. **Production Deployment** - Automatic deployment on main branch
7. **Performance Audit** - Lighthouse performance testing

### Branch Strategy
- **`main`** - Production deployments (auto-deploy)
- **`develop`** - Development branch (preview deployments)
- **Feature branches** - Pull request previews

## 🔧 Setup Instructions

### 1. GitHub Repository Setup

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: production-ready application"
   git push origin main
   ```

2. **Set up GitHub Secrets**:
   Go to your repository → Settings → Secrets and variables → Actions

   **Required Secrets:**
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_vercel_org_id
   VERCEL_PROJECT_ID=your_vercel_project_id
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   DEEPSEEK_API_KEY=your_production_deepseek_key
   NEXT_PUBLIC_GEOAPIFY_API_KEY=your_production_geoapify_key
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

### 2. Vercel Project Setup

1. **Create Vercel Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings (auto-detected for Next.js)

2. **Environment Variables**:
   Set the following in Vercel Dashboard → Project → Settings → Environment Variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   DEEPSEEK_API_KEY=your_production_deepseek_key
   DEEPSEEK_API_BASE_URL=https://api.deepseek.com/v1/chat/completions
   NEXT_PUBLIC_GEOAPIFY_API_KEY=your_production_geoapify_key
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   NEXTAUTH_SECRET=your_secure_random_string
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

### 3. Database Setup (Production)

1. **Create Production Supabase Project**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project for production
   - Run the database setup scripts from `complete_fixed_setup.sql`

2. **Configure Row Level Security**:
   - Enable RLS on all tables
   - Apply the security policies from your setup scripts

3. **Set up Authentication**:
   - Configure site URL: `https://your-domain.vercel.app`
   - Set up email templates
   - Configure OAuth providers if needed

## 🚀 Deployment Process

### Automatic Deployment

1. **Push to main branch**:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Monitor deployment**:
   - Check GitHub Actions tab for pipeline status
   - Monitor Vercel dashboard for deployment progress
   - Verify health checks pass

### Manual Deployment (if needed)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login and deploy**:
   ```bash
   vercel login
   vercel --prod
   ```

## 📊 Post-Deployment Verification

### 1. Health Checks
```bash
# Check application health
curl https://your-domain.vercel.app/api/health

# Check specific endpoints
curl https://your-domain.vercel.app/api/metrics
```

### 2. Performance Testing
- Lighthouse audit runs automatically
- Check Core Web Vitals in Vercel Analytics
- Monitor response times

### 3. Security Verification
- SSL certificate is active
- Security headers are present
- CORS is properly configured

## 🔍 Monitoring & Maintenance

### 1. Error Tracking
- **Sentry**: Monitor errors and performance
- **Vercel Analytics**: Track user interactions
- **Custom Metrics**: API response times, database queries

### 2. Uptime Monitoring
- Set up external monitoring (UptimeRobot, Pingdom)
- Configure alerts for downtime
- Monitor health check endpoint

### 3. Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS
- **API Performance**: Response times, error rates
- **Database Performance**: Query times, connection pool

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check TypeScript errors
   npm run type-check
   
   # Check linting issues
   npm run lint
   
   # Test build locally
   npm run build
   ```

2. **Environment Variable Issues**:
   - Verify all required variables are set
   - Check variable names match exactly
   - Ensure no trailing spaces or quotes

3. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Test connection with health check

4. **API Failures**:
   - Check external API keys and quotas
   - Verify CORS configuration
   - Monitor rate limits

### Emergency Procedures

1. **Rollback Deployment**:
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

2. **Hotfix Process**:
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/critical-fix
   # Make fixes
   git commit -m "hotfix: critical issue"
   git push origin hotfix/critical-fix
   # Create PR to main
   ```

## 📈 Scaling Considerations

### Performance Optimization
- Enable Vercel Edge Functions for global distribution
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

### Security Hardening
- Regular security audits
- Dependency updates
- API rate limiting
- Input validation

### Compliance
- GDPR compliance for EU users
- HIPAA considerations for health data
- Regular privacy policy updates
- Data retention policies

## 📞 Support

For deployment issues:
- Check GitHub Actions logs
- Review Vercel deployment logs
- Monitor Sentry for runtime errors
- Contact support if needed

---

**Remember**: Always test changes in preview deployments before merging to main!
