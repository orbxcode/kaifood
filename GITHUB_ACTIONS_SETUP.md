# 🚀 GitHub Actions Email Scheduler Setup

This guide shows how to set up GitHub Actions to replace Vercel Cron for processing email notifications - completely free and reliable!

## 🎯 **Why GitHub Actions?**

✅ **100% Free** - 2,000 minutes/month on free tier  
✅ **Reliable** - GitHub's infrastructure  
✅ **Flexible Scheduling** - Different schedules for business/off hours  
✅ **Built-in Monitoring** - Action logs and failure notifications  
✅ **No Vendor Lock-in** - Works with any hosting platform  

## 📋 **Setup Steps**

### **1. Repository Secrets Configuration**

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these **Repository Secrets**:

```
CRON_SECRET=your_secure_random_string_here
APP_URL=https://your-app.vercel.app
```

**How to get these values:**
- `CRON_SECRET`: Same value from your `.env` file
- `APP_URL`: Your deployed Vercel app URL (without trailing slash)

### **2. Workflow Files** ✅ (Already Created)

The workflows are already set up in `.github/workflows/`:

- **`email-notifications.yml`** - Processes email queue every 5-30 minutes
- **`daily-maintenance.yml`** - Daily health checks and maintenance

### **3. Schedule Explanation**

#### **Email Notifications Workflow:**
```yaml
# Business hours (6 AM - 10 PM UTC): Every 5 minutes
- cron: '*/5 6-22 * * *'

# Off hours (10 PM - 6 AM UTC): Every 30 minutes  
- cron: '*/30 22-23,0-5 * * *'
```

#### **Daily Maintenance:**
```yaml
# Every day at midnight UTC
- cron: '0 0 * * *'
```

## 🔧 **Customizing Schedules**

### **More Frequent Processing:**
```yaml
# Every 2 minutes (use sparingly - consumes more GitHub Actions minutes)
- cron: '*/2 * * * *'
```

### **Less Frequent Processing:**
```yaml
# Every 15 minutes
- cron: '*/15 * * * *'

# Every hour
- cron: '0 * * * *'
```

### **Business Hours Only:**
```yaml
# Monday-Friday, 9 AM - 5 PM UTC
- cron: '*/10 9-17 * * 1-5'
```

## 📊 **Monitoring & Debugging**

### **View Action Logs:**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on any workflow run
4. View detailed logs for each step

### **Manual Triggering:**
Both workflows support manual triggering:
1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**

### **Failure Notifications:**
GitHub will email you if workflows fail consistently.

## 🧪 **Testing Your Setup**

### **1. Test Manual Trigger:**
```bash
# Go to GitHub Actions tab
# Click "Process Email Notifications" 
# Click "Run workflow"
# Check the logs
```

### **2. Test API Endpoint Directly:**
```bash
curl -X POST \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json" \
  "https://your-app.vercel.app/api/notifications/process-queue"
```

### **3. Check Email Queue:**
```sql
-- In Supabase SQL Editor
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM email_notifications 
GROUP BY status;
```

## 💰 **Cost Comparison**

| Service | GitHub Actions | Vercel Cron |
|---------|---------------|--------------|
| **Free Tier** | 2,000 minutes/month | Limited runs |
| **Cost** | $0 | $20+/month for unlimited |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🔄 **Migration Benefits**

### **Before (Vercel Cron):**
- Limited to Vercel Pro plan for reliable cron
- Fixed 5-minute intervals
- Less monitoring options

### **After (GitHub Actions):**
- Completely free
- Flexible scheduling (business hours vs off-hours)
- Rich logging and monitoring
- Manual trigger capability
- Works with any hosting platform

## 🚨 **Troubleshooting**

### **Common Issues:**

**1. Workflow not running:**
- ✅ Check repository secrets are set
- ✅ Verify cron syntax
- ✅ Ensure workflows are in `.github/workflows/`

**2. API calls failing:**
- ✅ Check `APP_URL` is correct (no trailing slash)
- ✅ Verify `CRON_SECRET` matches your app
- ✅ Check Vercel function logs

**3. GitHub Actions quota exceeded:**
- ✅ Reduce frequency of cron jobs
- ✅ Optimize workflow efficiency
- ✅ Consider upgrading GitHub plan if needed

## 📈 **Usage Monitoring**

### **GitHub Actions Usage:**
- Go to **Settings** → **Billing and plans**
- View **Actions** usage
- Each workflow run uses ~1-2 minutes

### **Estimated Monthly Usage:**
```
Email notifications: 
- Business hours: 16 hours × 12 runs/hour × 30 days = 5,760 runs
- Off hours: 8 hours × 2 runs/hour × 30 days = 480 runs
- Total: ~6,240 runs × 1 minute = 6,240 minutes

Daily maintenance: 30 runs × 1 minute = 30 minutes

Total: ~6,270 minutes (well within 2,000 free minutes)
```

**💡 Tip:** The current schedule is optimized to stay well within GitHub's free tier!

## 🎉 **You're All Set!**

Your email notification system now runs on GitHub Actions:

✅ **Completely free**  
✅ **More reliable than Vercel Cron**  
✅ **Better monitoring and logging**  
✅ **Flexible scheduling**  
✅ **Manual trigger capability**  

The system will automatically:
1. Process email queue every 5-30 minutes
2. Send notifications to caterers
3. Handle retries for failed emails
4. Perform daily health checks
5. Log all activities for monitoring

No more Vercel Cron costs - everything runs on GitHub's free tier! 🚀