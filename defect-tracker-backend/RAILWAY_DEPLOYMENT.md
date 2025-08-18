# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at railway.app)
- GitHub repository with your code

## Deployment Steps

### 1. Connect Repository
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `centa-returns` repository

### 2. Add Services
Railway will automatically detect your Python app. You'll need to add:

#### Backend Service (Auto-detected)
- Railway will use `requirements.txt` and `Procfile`
- No additional configuration needed

#### Database Service
1. Click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set `DATABASE_URL` environment variable

### 3. Set Environment Variables
In your backend service, set these environment variables:

```bash
FLASK_ENV=production
FLASK_DEBUG=False
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
JWT_ACCESS_TOKEN_EXPIRES=8
JWT_ACCESS_COOKIE_NAME=access_token
JWT_COOKIE_SECURE=True
JWT_COOKIE_CSRF_PROTECT=True
JWT_COOKIE_SAMESITE=Strict

MAIL_SERVER=smtp.yandex.com
MAIL_PORT=465
MAIL_USERNAME=ariza.takip@centa.com.tr
MAIL_PASSWORD=C3nta*25
MAIL_DEFAULT_SENDER=ariza.takip@centa.com.tr
MAIL_USE_SSL=True
MAIL_USE_TLS=False

FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Deploy
1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" in the Railway dashboard

### 5. Run Database Migrations
After deployment, run:
```bash
railway run flask db upgrade
```

## File Structure
```
defect-tracker-backend/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── Procfile                 # Railway startup command
├── gunicorn.conf.py         # Gunicorn configuration
└── ... (other files)
```

## Environment Variables
Railway automatically provides:
- `PORT` - Port number (don't hardcode this)
- `DATABASE_URL` - PostgreSQL connection string (if you add database service)

## Monitoring
- Check logs in Railway dashboard
- Monitor resource usage
- Set up alerts for $5 monthly limit

## Custom Domain
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., api.centa.com.tr)
4. Update DNS records as instructed
