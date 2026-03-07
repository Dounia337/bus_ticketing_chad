# 🚀 FREE HOSTING DEPLOYMENT GUIDE
## Chad Bus Ticketing System - Step by Step

This guide will help you deploy your bus ticketing system **100% FREE** using Render.com for hosting and Supabase for database.

---

## 📋 OPTION 1: RENDER.COM (RECOMMENDED - EASIEST)

### ✅ What You'll Get FREE:
- Backend hosting (Node.js)
- Frontend hosting (Next.js)
- PostgreSQL database
- SSL certificate (HTTPS)
- Custom domain support

### 🎯 Step-by-Step Deployment

#### PART 1: CREATE ACCOUNTS (5 minutes)

**1. Create Render Account**
```
→ Go to: https://render.com
→ Click "Get Started"
→ Sign up with GitHub (recommended) or Email
→ Verify your email
→ You're in! ✅
```

**2. Create GitHub Account** (if you don't have one)
```
→ Go to: https://github.com
→ Sign up
→ Verify email
```

---

#### PART 2: UPLOAD CODE TO GITHUB (10 minutes)

**1. Install Git** (if not installed)

**Windows:**
```
→ Download: https://git-scm.com/download/win
→ Install with default settings
→ Open Git Bash
```

**Mac:**
```bash
# Install Homebrew first if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install git
brew install git
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install git
```

**2. Upload Your Project to GitHub**

Open terminal/command prompt in your project folder:

```bash
# Navigate to your project
cd bus-ticketing-chad

# Initialize git
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Chad Bus Ticketing System"

# Create repository on GitHub
# → Go to https://github.com/new
# → Repository name: bus-ticketing-chad
# → Make it PRIVATE (important!)
# → Click "Create repository"

# Link to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bus-ticketing-chad.git

# Push code
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

#### PART 3: DEPLOY DATABASE (5 minutes)

**1. Create PostgreSQL Database on Render**

```
→ Login to Render: https://dashboard.render.com
→ Click "New +" button (top right)
→ Select "PostgreSQL"
→ Fill in:
   - Name: bus-ticketing-db
   - Database: bus_ticketing_chad
   - User: admin
   - Region: Choose closest to Chad (e.g., Frankfurt)
   - Click "Create Database"

→ Wait 2-3 minutes for database to be ready
→ Copy the "External Database URL" - you'll need this!
   It looks like: postgresql://user:password@host/database
```

✅ **Database is ready!**

---

#### PART 4: DEPLOY BACKEND API (10 minutes)

**1. Create Backend Service**

```
→ Go to Render Dashboard
→ Click "New +" → "Web Service"
→ Connect to your GitHub repository
→ Select "bus-ticketing-chad"
→ Fill in:
   
   Name: bus-ticketing-api
   Region: Same as database (e.g., Frankfurt)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate && npx prisma migrate deploy
   Start Command: npm start
   
→ Click "Advanced"
→ Add Environment Variables (click "Add Environment Variable" for each):
```

**Environment Variables to Add:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the External Database URL from Part 3 |
| `JWT_SECRET` | `chad-bus-secret-key-change-in-production-2024` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://YOUR-APP-NAME.onrender.com` (we'll update this later) |

```
→ Click "Create Web Service"
→ Wait 5-10 minutes for deployment
→ You'll see build logs - wait for "Build successful"
→ Copy your backend URL (e.g., https://bus-ticketing-api.onrender.com)
```

**2. Seed the Database**

After backend is deployed, run seed command:

```
→ In Render Dashboard, go to your backend service
→ Click "Shell" tab
→ Run: npm run seed
→ Wait for "Seeding complete!" message
```

✅ **Backend API is live!**

---

#### PART 5: DEPLOY FRONTEND (10 minutes)

**1. Update Frontend Environment**

First, update your frontend `.env.local` file locally:

```bash
# Edit frontend/.env.local
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

**2. Commit and Push Changes**

```bash
cd bus-ticketing-chad
git add .
git commit -m "Update API URL for production"
git push
```

**3. Create Frontend Service on Render**

```
→ Go to Render Dashboard
→ Click "New +" → "Static Site"
→ Connect to your GitHub repository
→ Select "bus-ticketing-chad"
→ Fill in:
   
   Name: bus-ticketing-web
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: .next
   
→ Add Environment Variable:
   Key: NEXT_PUBLIC_API_URL
   Value: https://YOUR-BACKEND-URL.onrender.com/api
   
→ Click "Create Static Site"
→ Wait 5-10 minutes for deployment
```

**4. Update Backend CORS**

```
→ Go back to your backend service in Render
→ Click "Environment"
→ Update FRONTEND_URL to your new frontend URL
   (e.g., https://bus-ticketing-web.onrender.com)
→ Save changes
→ Backend will auto-redeploy (2-3 minutes)
```

✅ **Frontend is live!**

---

#### PART 6: TEST YOUR APPLICATION (5 minutes)

**1. Visit Your Frontend**
```
→ Open: https://YOUR-FRONTEND-URL.onrender.com
→ You should see the homepage!
```

**2. Test Booking Flow**
```
1. Select cities (e.g., N'Djamena → Moundou)
2. Choose tomorrow's date
3. Click "Rechercher des voyages"
4. You should see available trips!
```

**3. Test Admin Login**
```
→ Go to: https://YOUR-FRONTEND-URL.onrender.com/auth/login
→ Phone: +23566778899
→ Request OTP
→ Check backend logs in Render for OTP code
→ Enter OTP and login
```

**To see OTP in logs:**
```
→ Go to Render Dashboard
→ Click on backend service
→ Click "Logs" tab
→ Look for "OTP sent: { phoneNumber: '+23566778899', otp: 'XXXXXX' }"
```

✅ **Everything works!**

---

## 🎨 BONUS: ADD CUSTOM DOMAIN (Optional)

**1. Buy a domain** (or use free subdomain)
- Freenom: Free domains (.tk, .ml, .ga)
- Namecheap: Cheap domains ($1-10/year)

**2. Connect to Render**
```
→ In Render Dashboard, go to your frontend service
→ Click "Settings"
→ Scroll to "Custom Domains"
→ Click "Add Custom Domain"
→ Enter your domain (e.g., chadbustickets.com)
→ Follow DNS instructions to point domain to Render
→ Wait 24-48 hours for DNS propagation
```

✅ **Custom domain connected!**

---

## 📋 OPTION 2: RAILWAY.APP (ALTERNATIVE)

### Step-by-Step for Railway

**1. Create Account**
```
→ Go to: https://railway.app
→ Login with GitHub
```

**2. Deploy Database**
```
→ Click "New Project"
→ Select "Provision PostgreSQL"
→ Copy connection URL
```

**3. Deploy Backend**
```
→ Click "New"
→ Select "GitHub Repo"
→ Select your repository
→ Add environment variables (same as Render)
→ Set root directory: backend
→ Railway auto-deploys
```

**4. Deploy Frontend**
```
→ Click "New"  
→ Select GitHub Repo
→ Set root directory: frontend
→ Add NEXT_PUBLIC_API_URL
→ Deploy
```

✅ **Done! Railway handles everything automatically**

---

## 📋 OPTION 3: VERCEL + SUPABASE (ALTERNATIVE)

### For Frontend (Vercel)

**1. Deploy Frontend**
```
→ Go to: https://vercel.com
→ Sign up with GitHub
→ Click "New Project"
→ Import your GitHub repository
→ Root Directory: frontend
→ Add environment variable: NEXT_PUBLIC_API_URL
→ Deploy
```

### For Backend (Render or Railway)
Use Render or Railway for backend (Vercel doesn't support Express well)

### For Database (Supabase - FREE)

**1. Create Supabase Account**
```
→ Go to: https://supabase.com
→ Sign up with GitHub
→ Click "New Project"
→ Name: bus-ticketing-db
→ Database Password: Create strong password
→ Region: Closest to Chad
→ Click "Create new project"
→ Wait 2-3 minutes
```

**2. Get Database URL**
```
→ Click "Settings" (left sidebar)
→ Click "Database"
→ Scroll to "Connection string"
→ Copy "URI" format
→ It looks like: postgresql://postgres:PASSWORD@HOST:5432/postgres
```

**3. Use this URL in your backend deployment**

✅ **All set with Supabase!**

---

## 🔧 IMPORTANT NOTES

### Free Tier Limitations

**Render Free Tier:**
- ⚠️ Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- 750 hours/month free (enough for 24/7)
- Database: 1GB storage, 97 hours/month

**Railway Free Tier:**
- $5 credit per month
- Enough for small app (lasts ~month)
- No sleep time

**How to Handle Cold Starts:**
1. Use a service like UptimeRobot (free) to ping your app every 5 minutes
2. Or upgrade to paid tier ($7/month) for always-on

### Database Backups

**On Render:**
```
→ Go to database in dashboard
→ Click "Backups" tab
→ Manual backup: Click "Create Backup"
→ Download backup files
```

**Automatic Backups:**
- Set up cron job to backup daily
- Use `pg_dump` command
- Store in Google Drive/Dropbox

---

## 🎯 PRODUCTION CHECKLIST

Before going live with real users:

- [ ] Change JWT_SECRET to random strong value
- [ ] Set up Twilio for WhatsApp (free trial: $15 credit)
- [ ] Configure SMTP for emails (Gmail free tier works)
- [ ] Set up domain name
- [ ] Enable SSL (automatic on Render)
- [ ] Test all features thoroughly
- [ ] Create admin account
- [ ] Seed routes and buses
- [ ] Set up monitoring (UptimeRobot - free)
- [ ] Configure backups
- [ ] Test on mobile devices
- [ ] Train admin staff

---

## 🔐 SECURITY FOR PRODUCTION

**1. Environment Variables**
- Never commit .env files to GitHub
- Use different secrets for production
- Rotate JWT_SECRET regularly

**2. Database**
- Enable SSL (automatic on Render/Supabase)
- Regular backups
- Strong password

**3. API**
- Rate limiting (add to backend)
- CORS properly configured
- Input validation enabled

---

## 📱 OPTIONAL: CONFIGURE WHATSAPP (FREE TRIAL)

**1. Create Twilio Account**
```
→ Go to: https://www.twilio.com
→ Sign up (free trial: $15 credit)
→ Verify phone number
→ Get Account SID and Auth Token
```

**2. Set Up WhatsApp Sandbox**
```
→ In Twilio Console
→ Go to Messaging → Try it out → Send a WhatsApp message
→ Follow instructions to join sandbox
→ Copy WhatsApp number
```

**3. Add to Render Environment**
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**4. Test**
- Create a booking
- Check your WhatsApp for confirmation!

---

## 🆘 TROUBLESHOOTING

### "Application Error" on Render

**Check logs:**
```
→ Go to service in Render Dashboard
→ Click "Logs" tab
→ Look for error messages
```

**Common fixes:**
- Check DATABASE_URL is correct
- Verify all environment variables are set
- Check build logs for errors
- Make sure migrations ran successfully

### "Cannot connect to database"

**Fix:**
```
→ Verify DATABASE_URL is correct
→ Check database is running in Render
→ Make sure DATABASE_URL includes ?sslmode=require
→ Check firewall settings
```

### Frontend can't reach backend

**Fix:**
```
→ Check NEXT_PUBLIC_API_URL is correct
→ Verify backend is deployed and running
→ Check CORS settings in backend
→ Test backend URL directly in browser
```

### Cold start is slow

**Solutions:**
1. **Free option:** Use UptimeRobot to ping every 5 minutes
   ```
   → Go to: https://uptimerobot.com
   → Sign up free
   → Add monitor
   → URL: Your Render backend URL
   → Monitoring interval: 5 minutes
   ```

2. **Paid option:** Upgrade to Render paid tier ($7/month)

---

## 💰 COST BREAKDOWN

### Completely Free Option:
- Hosting: Render Free Tier ($0)
- Database: Render PostgreSQL Free ($0)
- Domain: Freenom (.tk domain) ($0)
- SSL: Automatic ($0)
- **Total: $0/month**

### Recommended Production Option:
- Hosting: Render Starter ($7/month)
- Database: Render PostgreSQL Starter ($7/month)
- Domain: .com from Namecheap ($10/year = $0.83/month)
- Twilio WhatsApp: Pay as you go (~$0.01/message)
- **Total: ~$15/month**

---

## 🎉 CONGRATULATIONS!

Your bus ticketing system is now live on the internet! 

**Your URLs:**
- Frontend: https://your-app.onrender.com
- Backend API: https://your-api.onrender.com
- Database: Managed by Render

**Next Steps:**
1. Test thoroughly
2. Configure WhatsApp
3. Train your team
4. Start selling tickets!

---

## 📞 NEED HELP?

If you get stuck:
1. Check the logs in Render Dashboard
2. Review this guide step by step
3. Check Render documentation: https://render.com/docs
4. Verify all environment variables are set correctly
5. Make sure code is pushed to GitHub

**Common Support Resources:**
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Railway Docs: https://docs.railway.app

---

**Good luck with your deployment! 🚀**
