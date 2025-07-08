# Email Configuration Guide for Early Autism Detector

This guide explains how to set up email verification for user registration in the Early Autism Detector application.

## Current Issue

You're seeing this error: `AuthApiError: Error sending confirmation email`

This happens because Supabase needs email service configuration to send verification emails.

## Solution Options

### Option 1: Development Mode (Quick Fix) ✅ IMPLEMENTED

**Status**: Already implemented in the code
- Email verification is automatically skipped in development mode
- Users can register and login immediately without email verification
- Perfect for development and testing

### Option 2: Configure Supabase Email Settings (Production Ready)

#### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `nugybnlgrrwzbpjpfmty`
3. Navigate to **Authentication** → **Settings**

#### Step 2: Configure Email Templates
1. In the Authentication settings, find **Email Templates**
2. Configure the **Confirm signup** template:
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
   ```

#### Step 3: Set Redirect URLs
1. In **Authentication** → **URL Configuration**
2. Add your site URL: `http://localhost:3000`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/verified`

#### Step 4: Configure SMTP (Optional)
For custom email sending, configure SMTP settings:
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Enable custom SMTP
3. Configure with your email provider (Gmail, SendGrid, etc.)

### Option 3: Use SendGrid (Advanced)

#### Step 1: Get SendGrid API Key
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Verify your sender email

#### Step 2: Update Environment Variables
Add to your `.env.local`:
```bash
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

#### Step 3: Configure Supabase
1. In Supabase Dashboard → **Authentication** → **Settings**
2. Enable **Custom SMTP**
3. Use SendGrid SMTP settings:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key

## Testing the Setup

### Development Mode (Current Setup)
1. Go to `http://localhost:3000/auth/register`
2. Fill out the registration form
3. Submit - should work without email verification
4. Login immediately with the same credentials

### Production Mode
1. Set `NODE_ENV=production` in your environment
2. Configure one of the email options above
3. Test registration flow with email verification

## Troubleshooting

### Common Issues

1. **"Error sending confirmation email"**
   - Solution: Use development mode (already implemented) or configure email settings

2. **"Invalid redirect URL"**
   - Solution: Add your URLs to Supabase redirect URL allowlist

3. **"SMTP configuration error"**
   - Solution: Verify SMTP credentials and settings

### Debug Steps

1. Check Supabase logs:
   - Go to **Logs** → **Auth Logs** in Supabase Dashboard

2. Verify environment variables:
   - Check `.env.local` file
   - Restart development server after changes

3. Test with different email providers:
   - Try with Gmail, Yahoo, etc.

## Current Implementation Status

✅ **Development mode**: Email verification bypassed
✅ **Registration form**: Enhanced with validation
✅ **Login handling**: Proper error messages
✅ **Verification pages**: Professional waiting pages
⏳ **Production email**: Needs configuration (optional)

## Next Steps

1. **For Development**: Continue using current setup - works perfectly
2. **For Production**: Configure Supabase email settings or SendGrid
3. **For Custom Branding**: Set up custom email templates

## Support

If you need help with email configuration:
1. Check Supabase documentation: [Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
2. SendGrid documentation: [SMTP Integration](https://docs.sendgrid.com/for-developers/sending-email/smtp-integration)
