# 🚀 GitHub Actions Setup Guide

This guide helps you configure GitHub Actions for automated email notifications processing.

## 📋 **Required Repository Secrets**

You need to set up these secrets in your GitHub repository:

### **1. CRON_SECRET**
- **Purpose**: Authenticates GitHub Actions with your API
- **Value**: A secure random string (32+ characters)
- **Example**: `your-super-secure-random-string-here-32chars`

### **2. APP_URL** 
- **Purpose**: Your deployed application URL
- **Value**: Your production domain (without trailing slash)
- **Example**: `https://kaifood.co.za`

### **3. RESEND_API_KEY** (for your app)
- **Purpose**: Resend email service API key
- **Value**: Your Resend API key starting with `re_`
- **Example**: `re_123abc456def789ghi012jkl345mno678`

## 🔧 **How to Set Up Secrets**

### **Step 1: Generate CRON_SECRET**
```bash
# Generate a secure random string
openssl rand -hex 32
# OR use online generator: https://www.random.org/strings/
```

### **Step 2: Add Secrets to GitHub**
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

| Name | Value |
|------|-------|
| `CRON_SECRET` | Your generated secure string |
| `APP_URL` | `https://yourdomain.com` |

### **Step 3: Add Environment Variables to Your App**
Add these to your `.env` file and deployment environment:

```env
# Email Processing
CRON_SECRET=your-super-secure-random-string-here-32chars
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# App Configuration  
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📅 **Workflow Schedule**

The email processor runs automatically:
- **Business Hours (6 AM - 10 PM UTC)**: Every 5 minutes
- **Off Hours (10 PM - 6 AM UTC)**: Every 30 minutes

You can also trigger it manually:
1. Go to **Actions** tab in GitHub
2. Select **Process Email Notifications**
3. Click **Run workflow**

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **❌ HTTP 401 - Unauthorized**
- Check that `CRON_SECRET` matches in both GitHub and your app
- Verify the secret is set correctly in repository settings

#### **❌ HTTP 404 - Not Found**
- Verify `APP_URL` is correct and accessible
- Check that your app is deployed and running
- Ensure the API endpoint exists: `/api/notifications/process-queue`

#### **❌ HTTP 500 - Server Error**
- Check your application logs for errors
- Verify `RESEND_API_KEY` is valid
- Ensure database connection is working

#### **❌ Timeout Errors**
- Check if your app is responding slowly
- Verify your hosting service is not sleeping (common with free tiers)

### **Testing the Setup:**

#### **1. Test API Endpoint Manually**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  "https://yourdomain.com/api/notifications/process-queue"
```

#### **2. Test Health Check**
```bash
curl "https://yourdomain.com/api/notifications/process-queue"
```

#### **3. Check GitHub Actions Logs**
1. Go to **Actions** tab
2. Click on latest workflow run
3. Expand the steps to see detailed logs

## 📊 **Monitoring**

### **Success Indicators:**
- ✅ Workflow completes without errors
- ✅ Response shows processed email counts
- ✅ Users receive email notifications

### **What to Monitor:**
- Workflow success rate in GitHub Actions
- Email delivery rates in Resend dashboard
- Application logs for any errors

## 🔐 **Security Best Practices**

1. **Use Strong Secrets**: Generate cryptographically secure random strings
2. **Rotate Regularly**: Change `CRON_SECRET` periodically
3. **Limit Access**: Only give repository access to trusted team members
4. **Monitor Usage**: Check GitHub Actions usage and Resend email quotas

## 🎯 **Expected Behavior**

When working correctly:
1. GitHub Actions triggers on schedule
2. Makes authenticated request to your API
3. API processes pending email notifications
4. Emails are sent via Resend
5. Database is updated with sent status
6. Workflow completes successfully

## 📞 **Need Help?**

If you're still having issues:
1. Check the GitHub Actions logs for specific error messages
2. Review your application logs
3. Verify all environment variables are set correctly
4. Test the API endpoint manually with curl

The system is designed to be resilient - if one run fails, the next scheduled run will retry pending notifications.