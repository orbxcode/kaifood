# 🚀 Kai Catering Platform Setup Guide

This guide will help you set up all the required services and environment variables for your catering platform.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account
- A domain name (for production)

## 🔧 Environment Variables Setup

### 1. **Resend Email Service** (Required for notifications)

**Steps:**
1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address
4. Navigate to **API Keys** in the dashboard
5. Click **Create API Key**
6. Copy the API key (starts with `re_`)
7. Update your `.env` file:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

**Free Tier:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ All features included

### 2. **App URL Configuration**

**For Development:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. **Cron Secret** (For automated email processing)

**Generate a secure secret:**

**Option A - Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Option B - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C - Online Generator:**
Use any secure password generator (32+ characters)

Then update your `.env`:
```env
CRON_SECRET=your_generated_secure_string_here
```

### 4. **Supabase Configuration**

**Get your Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗄️ Database Setup

Run these SQL scripts in your Supabase SQL Editor **in order**:

```sql
-- 1. Basic schema (if not already done)
\i scripts/001_create_schema.sql

-- 2. RLS policies
\i scripts/002_create_rls_policies.sql

-- 3. Profile triggers
\i scripts/003_create_profile_trigger.sql

-- 4. Subscription tiers
\i scripts/004_add_subscription_tiers.sql

-- 5. RLS fixes
\i scripts/005_fix_rls_policies.sql

-- 6. Admin support
\i scripts/006_add_admin_support.sql

-- 7. Email notifications
\i scripts/007_add_email_notifications.sql

-- 8. Image support
\i scripts/008_add_caterer_images.sql

-- 9. Storage setup
\i scripts/009_setup_storage.sql

-- 10. Review system
\i scripts/010_add_review_system.sql
```

## 🖼️ PWA Assets Setup

Create these image files in your `/public` folder:

### Required Icons:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)
- `favicon.ico` (32x32 pixels)

### Optional Screenshots:
- `screenshot-mobile.png` (390x844 pixels)
- `screenshot-desktop.png` (1280x720 pixels)

**Quick Icon Generation:**
1. Create a 512x512 PNG logo
2. Use [Favicon.io](https://favicon.io/) to generate all sizes
3. Download and place in `/public` folder

## 🚀 Deployment Setup

### Vercel Deployment (Recommended)

1. **Connect Repository:**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **New Project**
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard

3. **Set up Cron Jobs** (in `vercel.json`):
   ```json
   {
     "crons": [
       {
         "path": "/api/notifications/process-queue",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

### Environment Variables in Vercel:
Add all your `.env` variables in the Vercel dashboard under **Settings** → **Environment Variables**.

## 🔐 Security Setup

### Supabase RLS Policies
The scripts automatically set up Row Level Security. Verify in Supabase dashboard:
- **Authentication** → **Policies**
- Ensure all tables have appropriate policies

### API Route Protection
All admin routes are protected. Create your first admin user:

```sql
-- After creating a user through Supabase Auth
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'your-admin-email@domain.com';
```

## 📧 Email Domain Setup (Production)

### For Production Emails:
1. **Add Domain to Resend:**
   - Go to Resend Dashboard → **Domains**
   - Add your domain (e.g., `yourdomain.com`)
   - Add DNS records as instructed

2. **Update Email Templates:**
   - Edit `lib/email.ts`
   - Change `from: 'Kai Catering <notifications@kaicatering.com>'`
   - To: `from: 'Your Brand <notifications@yourdomain.com>'`

## 🧪 Testing Your Setup

### 1. Test Email Notifications:
```bash
# Start your development server
npm run dev

# Create a test match in your database
# Check that email notification is queued
# Process the queue manually or wait for cron
```

### 2. Test PWA Installation:
- Open your app in Chrome/Edge
- Look for install prompt
- Test offline functionality

### 3. Test Review System:
- Create a test booking
- Submit a review
- Verify rating calculations

## 🆘 Troubleshooting

### Common Issues:

**1. Emails not sending:**
- ✅ Check Resend API key is correct
- ✅ Verify domain is verified in Resend
- ✅ Check email queue processing

**2. PWA not installing:**
- ✅ Ensure HTTPS in production
- ✅ Check manifest.json is accessible
- ✅ Verify service worker registration

**3. Database errors:**
- ✅ Run migrations in correct order
- ✅ Check RLS policies are enabled
- ✅ Verify user permissions

**4. Image uploads failing:**
- ✅ Check Supabase storage bucket exists
- ✅ Verify storage policies
- ✅ Ensure file size limits

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase logs
3. Check Vercel function logs
4. Verify all environment variables are set

## 🎉 You're Ready!

Once all steps are complete, your catering platform will have:
- ✅ Email notifications for caterers
- ✅ Social media integration
- ✅ Comprehensive FAQ system
- ✅ SEO optimization
- ✅ Mobile PWA support
- ✅ Advanced review system
- ✅ Image upload capabilities
- ✅ Admin dashboard

Your platform is now production-ready! 🚀