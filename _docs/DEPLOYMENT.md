# Deployment Guide

This guide covers deploying the Notify Chat Application to production using Vercel (frontend) and Render.com (backend).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (Render.com)](#backend-deployment-rendercom)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub repository with your code
- ✅ Vercel account (free tier available)
- ✅ Render.com account (free tier available)
- ✅ Domain name (optional, for custom domains)

## Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Select the repository containing your monorepo

### Step 2: Configure Project Settings

**Project Configuration:**
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm install && pnpm --filter @notify/web build`
- **Output Directory**: `.next`
- **Install Command**: `cd ../.. && pnpm install`

**Environment Variables:**
Add the following environment variables in Vercel:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend-url.onrender.com

# Optional: Analytics, etc.
NEXT_PUBLIC_APP_URL=https://your-frontend-url.vercel.app
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies using PNPM
   - Build the Next.js application
   - Deploy to production
3. Your app will be available at `https://your-project.vercel.app`

### Step 4: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

### Vercel Configuration File

The project includes `vercel.json` at the root:

```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter @notify/web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "rootDirectory": "apps/web"
}
```

## Backend Deployment (Render.com)

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `notify-db` (or your preferred name)
   - **Database**: `notify`
   - **User**: Auto-generated
   - **Region**: Choose closest to your users
   - **Plan**: Free tier available (upgrade for production)
4. Click **"Create Database"**
5. **Save the connection string** - you'll need it later

### Step 2: Create Redis Instance

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `notify-redis`
   - **Region**: Same as database
   - **Plan**: Free tier available
3. Click **"Create Redis"**
4. **Save the connection string**

### Step 3: Create Web Service (Backend)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name**: `notify-api` (or your preferred name)
- **Region**: Same as database
- **Branch**: `main` or `develop`
- **Root Directory**: `apps/api`
- **Runtime**: `Node`
- **Build Command**: `cd ../.. && pnpm install && pnpm --filter @notify/api build`
- **Start Command**: `cd ../.. && pnpm --filter @notify/api start`

**Environment Variables:**
Add the following (click **"Add Environment Variable"** for each):

```env
# Server Configuration
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# Database (from Step 1)
DATABASE_URL=<your-postgres-connection-string>

# Redis (from Step 2)
REDIS_URL=<your-redis-connection-string>
REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
REDIS_PASSWORD=<redis-password>

# JWT Configuration
JWT_SECRET=<generate-a-strong-secret-key>
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-frontend-url.vercel.app

# Logging
LOG_LEVEL=info
```

**Generate JWT Secret:**
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build the TypeScript backend
   - Start the service
3. Your API will be available at `https://your-service.onrender.com`

### Step 5: Run Database Migrations

After the first deployment:

1. Go to your Web Service dashboard
2. Click **"Shell"** tab
3. Run migrations:
   ```bash
   cd apps/api
   pnpm migration:run
   ```

Or use Render's **"Manual Deploy"** with a one-time command.

### Render Configuration File

The project includes `render.yaml` at the root:

```yaml
version: 0.1

build:
  commands:
    - cd ../.. && pnpm install
    - cd ../.. && pnpm --filter @notify/api build

start:
  command: cd ../.. && pnpm --filter @notify/api start

env:
  - key: NODE_ENV
    value: production
```

## Database Setup

### Initial Migration

After creating the PostgreSQL database, run migrations:

**Option 1: Using Render Shell**
1. Go to your Web Service → **Shell**
2. Run:
   ```bash
   cd apps/api
   pnpm migration:run
   ```

**Option 2: Using Local Connection**
```bash
# Connect to Render database locally
psql <your-database-url>

# Or use migration command
cd apps/api
DATABASE_URL=<your-database-url> pnpm migration:run
```

### Database Backup

Render provides automatic backups for paid plans. For free tier:
- Export database manually using `pg_dump`
- Set up scheduled backups using Render's API

## Redis Setup

### Configuration

Redis is automatically configured when you provide the connection string. The backend will:
- Connect to Redis on startup
- Use Redis for:
  - Rate limiting
  - Session management
  - WebSocket pub/sub (for horizontal scaling)

### Testing Redis Connection

Check logs in Render dashboard to verify Redis connection.

## Environment Variables

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://notify-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://notify-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `https://notify.vercel.app` |

### Backend (Render.com)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment | Yes (`production`) |
| `PORT` | Server port | Yes (`10000` for Render) |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `REDIS_URL` | Redis connection | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | JWT expiration | No (default: `7d`) |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |
| `LOG_LEVEL` | Logging level | No (default: `info`) |

## Post-Deployment

### 1. Update Frontend Environment Variables

After backend is deployed, update frontend environment variables in Vercel:
- `NEXT_PUBLIC_API_URL` → Your Render backend URL
- `NEXT_PUBLIC_WS_URL` → Your Render WebSocket URL

### 2. Test the Application

1. **Frontend**: Visit your Vercel URL
2. **Backend Health**: `https://your-backend.onrender.com/health` (if configured)
3. **API**: Test endpoints using Postman or curl

### 3. Monitor Logs

**Vercel:**
- Go to **Deployments** → Click deployment → **Logs**

**Render:**
- Go to your service → **Logs** tab
- Monitor for errors and performance

### 4. Set Up Custom Domains

**Vercel:**
1. Settings → Domains → Add domain
2. Configure DNS as instructed

**Render:**
1. Settings → Custom Domains → Add domain
2. Configure DNS records
3. SSL certificates are auto-provisioned

## Troubleshooting

### Frontend Issues

**Build Fails:**
- Check Vercel build logs
- Ensure `pnpm` is available (Vercel auto-detects)
- Verify root directory is `apps/web`
- Check for TypeScript errors

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend
- Ensure backend is running

### Backend Issues

**Service Won't Start:**
- Check Render logs
- Verify all environment variables are set
- Check database connection string format
- Ensure `PORT` is set to `10000` (Render requirement)

**Database Connection Errors:**
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure database allows connections from Render IPs
- Run migrations if tables don't exist

**Redis Connection Errors:**
- Verify `REDIS_URL` is correct
- Check Redis instance is running
- Verify Redis credentials

**Build Timeout:**
- Render free tier has 10-minute build timeout
- Optimize build: reduce dependencies or upgrade plan
- Use build cache if available

### Common Solutions

**Monorepo Build Issues:**
```bash
# Ensure build commands include workspace navigation
cd ../.. && pnpm install && pnpm --filter @notify/api build
```

**Port Configuration:**
- Render requires `PORT` environment variable
- Backend should listen on `0.0.0.0` not `localhost`

**CORS Errors:**
- Add frontend URL to `CORS_ORIGIN` in backend
- Include protocol: `https://your-app.vercel.app`

## Production Checklist

- [ ] Database migrations run successfully
- [ ] All environment variables configured
- [ ] Frontend connects to backend API
- [ ] WebSocket connections working
- [ ] CORS configured correctly
- [ ] SSL certificates active (automatic on Vercel/Render)
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring and logging set up
- [ ] Database backups configured
- [ ] Error tracking configured (optional)

## Cost Estimation

### Free Tier (Development/Testing)

- **Vercel**: Free (with limitations)
- **Render**: Free (with limitations)
  - Web Service: Spins down after 15 min inactivity
  - PostgreSQL: 90-day retention
  - Redis: 25MB limit

### Production Tier (Recommended)

- **Vercel Pro**: $20/month
- **Render**: ~$7-25/month
  - Web Service: $7/month (always on)
  - PostgreSQL: $7/month (starter)
  - Redis: $10/month (starter)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)

---

**Need Help?** Open an issue on GitHub or check the project's README.md for more information.

