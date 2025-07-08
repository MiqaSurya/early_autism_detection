# 🚀 Production Deployment Checklist

This checklist ensures your Early Autism Detector app is production-ready.

## ✅ Pre-Deployment Checklist

### 🔧 Environment Configuration

- [ ] **Environment Variables Set**
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_SITE_URL` (your production domain)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production Supabase project)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production Supabase key)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (production service role)
  - [ ] `DEEPSEEK_API_KEY` and `DEEPSEEK_API_BASE_URL` (or `OPENAI_API_KEY`)
  - [ ] `NEXT_PUBLIC_GEOAPIFY_API_KEY`
  - [ ] `NEXTAUTH_SECRET` (32+ character random string)
  - [ ] `NEXTAUTH_URL` (your production domain)

- [ ] **Optional but Recommended**
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` (error tracking)
  - [ ] `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` (email notifications)
  - [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` (custom admin credentials)

### 🔒 Security Configuration

- [ ] **Admin Credentials**
  - [ ] Changed default admin password from 'admin'
  - [ ] Set custom `ADMIN_EMAIL` and `ADMIN_PASSWORD`

- [ ] **API Keys**
  - [ ] All API keys are production keys (not test/development)
  - [ ] API keys have appropriate rate limits configured
  - [ ] Supabase RLS policies are enabled and tested

- [ ] **CORS and Security Headers**
  - [ ] Production domain added to allowed origins
  - [ ] Security headers configured in `next.config.js`

### 🗄️ Database Configuration

- [ ] **Supabase Production Setup**
  - [ ] Production Supabase project created
  - [ ] Database schema deployed (`complete_fixed_setup.sql`)
  - [ ] Row Level Security (RLS) enabled on all tables
  - [ ] Security policies applied and tested
  - [ ] Site URL configured in Supabase Auth settings

### 🧪 Code Quality

- [ ] **Build and Tests**
  - [ ] `npm run build` completes successfully
  - [ ] `npm run type-check` passes
  - [ ] `npm run lint` passes with no errors
  - [ ] All tests pass (`npm test`)

- [ ] **Code Cleanup**
  - [ ] Debug/test pages removed
  - [ ] Console.log statements replaced with proper logging
  - [ ] No hardcoded development URLs or credentials

### 📊 Monitoring Setup

- [ ] **Error Tracking**
  - [ ] Sentry configured with production DSN
  - [ ] Error boundaries implemented
  - [ ] Critical error alerts configured

- [ ] **Performance Monitoring**
  - [ ] Vercel Analytics enabled
  - [ ] Core Web Vitals monitoring
  - [ ] Database query performance optimized

## 🚀 Deployment Steps

### 1. Validate Environment
```bash
node scripts/validate-production-env.js
```

### 2. Build and Test Locally
```bash
npm run build
npm start
# Test critical functionality
```

### 3. Deploy to Vercel

#### Option A: Automatic Deployment
1. Push to main branch
2. Vercel automatically deploys
3. Monitor deployment logs

#### Option B: Manual Deployment
```bash
npx vercel --prod
```

### 4. Post-Deployment Verification

- [ ] **Functionality Tests**
  - [ ] User registration and login works
  - [ ] M-CHAT-R assessment completes successfully
  - [ ] Autism center locator loads and shows centers
  - [ ] AI chat responds correctly
  - [ ] Admin panel accessible with new credentials
  - [ ] Navigation and routing work correctly

- [ ] **Performance Tests**
  - [ ] Page load times < 3 seconds
  - [ ] Lighthouse score > 90
  - [ ] Mobile responsiveness verified

- [ ] **Security Tests**
  - [ ] HTTPS enforced
  - [ ] Debug routes blocked (try accessing `/debug`, `/test`)
  - [ ] Admin panel requires authentication
  - [ ] API endpoints properly secured

## 🔍 Health Checks

### Automated Monitoring
Set up external monitoring for:
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Error rate monitoring (Sentry)

### Manual Health Checks
- [ ] `/api/health` endpoint responds
- [ ] Database connectivity verified
- [ ] External API integrations working
- [ ] Email notifications sending (if configured)

## 🚨 Rollback Plan

If issues are discovered post-deployment:

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment in Vercel dashboard
   # Or redeploy previous working commit
   git revert HEAD
   git push origin main
   ```

2. **Issue Investigation**
   - Check Vercel deployment logs
   - Review Sentry error reports
   - Verify environment variables
   - Test database connectivity

3. **Fix and Redeploy**
   - Fix identified issues
   - Test locally
   - Redeploy with fixes

## 📝 Post-Deployment Tasks

- [ ] **Documentation**
  - [ ] Update README with production URL
  - [ ] Document any production-specific configurations
  - [ ] Update API documentation if needed

- [ ] **Team Communication**
  - [ ] Notify team of successful deployment
  - [ ] Share production URL and admin credentials
  - [ ] Schedule post-deployment review

- [ ] **Monitoring Setup**
  - [ ] Configure alert thresholds
  - [ ] Set up regular health check schedule
  - [ ] Plan first maintenance window

## 🎯 Success Criteria

Deployment is considered successful when:
- ✅ All functionality works as expected
- ✅ Performance meets requirements (< 3s load time)
- ✅ Security measures are in place and tested
- ✅ Monitoring and alerting are active
- ✅ No critical errors in first 24 hours
- ✅ User feedback is positive

---

**Need Help?** Check the troubleshooting guide in `PRODUCTION_DEPLOYMENT.md` or review the deployment logs in Vercel dashboard.
