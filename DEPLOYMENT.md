# 🚀 Deployment Guide

## Vercel Deployment Setup

### 1. Environment Variables Required

Add these environment variables in your Vercel project settings:

#### **Required (Supabase)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://nugybnlgrrwzbpjpfmty.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### **Optional (Features)**
```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. How to Add Environment Variables in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `early-autism-detection`
3. **Go to Settings** → **Environment Variables**
4. **Click "Add New"** for each variable
5. **Set Environment**: Production, Preview, Development (all)
6. **Save** each variable

### 3. Get Your Supabase Keys

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: Early Autism Detector
3. **Go to Settings** → **API**
4. **Copy**:
   - Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 4. Redeploy After Adding Variables

After adding environment variables:
1. **Go to Deployments** tab in Vercel
2. **Click "Redeploy"** on the latest deployment
3. **Or push a new commit** to trigger automatic deployment

### 5. Database Setup

Make sure your Supabase database has the required tables:
1. **Run the SQL scripts** in `supabase/migrations/` folder
2. **Or use the setup scripts** in the project root:
   - `add_progress_tables.sql`
   - `fix_assessments_table.sql`

### 6. Troubleshooting

#### Common Issues:
- **"supabaseUrl is required"**: Add `NEXT_PUBLIC_SUPABASE_URL`
- **"supabaseAnonKey is required"**: Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Database errors**: Run the SQL migration scripts
- **Build timeouts**: Check for infinite loops in components

#### Build Logs:
- Check Vercel deployment logs for specific errors
- Look for missing environment variables
- Verify all imports are correct

### 7. Alternative Deployment Platforms

#### **Netlify**
1. Connect GitHub repository
2. Add environment variables in Site Settings
3. Build command: `npm run build`
4. Publish directory: `.next`

#### **Railway**
1. Connect GitHub repository
2. Add environment variables
3. Automatic deployment on push

### 8. Production Checklist

- [ ] Environment variables added to Vercel
- [ ] Database tables created in Supabase
- [ ] RLS policies enabled
- [ ] API routes tested
- [ ] Authentication working
- [ ] Assessment system functional
- [ ] Child profiles working
- [ ] Progress tracking operational

### 9. Post-Deployment

After successful deployment:
1. **Test all features** on the live site
2. **Check authentication** flow
3. **Verify database** connections
4. **Test M-CHAT-R** assessment
5. **Confirm child profile** creation/deletion
6. **Check progress tracking** functionality

Your app will be available at: `https://your-project-name.vercel.app`
