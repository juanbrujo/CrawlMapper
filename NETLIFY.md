# Netlify Deployment Guide

This guide explains how to deploy CrawlMapper to Netlify with serverless functions as the backend.

## Features

✅ **Full Functionality**: Complete sitemap crawling and content search  
✅ **Serverless Backend**: Netlify Functions handle all API requests  
✅ **Frontend + Backend**: Single deployment for both frontend and API  
✅ **Auto-scaling**: Serverless functions scale automatically  
✅ **Custom Domains**: Support for custom domains and HTTPS  
✅ **Form Handling**: Built-in form handling capabilities  

## Prerequisites

- Netlify account (free tier available)
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 16+ installed locally (for development)

## Deployment Methods

### Method 1: Git Integration (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign in
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select your repository

3. **Configure Build Settings**
   - **Build command**: Leave empty (no build step required)
   - **Publish directory**: `public`
   - Click "Deploy site"

### Method 2: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   # Deploy to preview
   npm run netlify:deploy:preview
   
   # Deploy to production
   npm run netlify:deploy
   ```

### Method 3: Drag & Drop

1. **Build locally** (if needed)
   ```bash
   # No build step required for this project
   ```

2. **Deploy via Dashboard**
   - Go to Netlify dashboard
   - Drag the `public` folder to the deploy area

## Project Structure

```
├── netlify.toml              # Netlify configuration
├── netlify/
│   └── functions/
│       └── search.js         # Serverless function for API
├── public/                   # Frontend files
│   ├── index.html
│   ├── 404.html
│   ├── _redirects           # SPA routing rules
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── package.json
└── server.js                # Local development server
```

## Configuration Files

### netlify.toml
```toml
[build]
  publish = "public"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### public/_redirects
```
/*    /index.html   200
/api/*  /.netlify/functions/:splat  200
```

## Environment Variables

For production deployments, you may want to set environment variables:

1. Go to Site settings → Environment variables
2. Add variables if needed (none required for basic functionality)

## Local Development

### Start Development Server
```bash
# Start both frontend and functions locally
npm run netlify:dev

# Or start just the Node.js server
npm run dev
```

### Test Functions Locally
```bash
# Start Netlify dev environment
netlify dev

# Functions will be available at:
# http://localhost:8888/.netlify/functions/search
```

## API Endpoints

After deployment, the following endpoints will be available:

- **POST** `/api/search` - Search sitemap for content
- **GET** `/` - Frontend application
- **GET** `/*` - SPA routing

## Netlify Functions

The search functionality is implemented as a Netlify Function:

- **Location**: `netlify/functions/search.js`
- **Runtime**: Node.js 18
- **Timeout**: 10 seconds (configurable)
- **Memory**: 128MB (configurable)
- **Cold Start**: Minimal due to small function size

### Function Features

- CORS headers enabled
- Error handling and logging
- Batch processing for large sitemaps
- Timeout protection (10s per request)
- Automatic sitemap URL normalization

## Performance Optimizations

### Frontend
- Static file caching configured
- Gzip compression enabled
- CDN distribution automatic

### Backend
- Serverless cold start optimization
- Batch processing to avoid timeouts
- Efficient XML parsing
- Connection pooling

## Monitoring and Analytics

### Netlify Analytics
- Enable in Site settings → Analytics
- View traffic, function usage, and performance

### Function Logs
- Access via Site dashboard → Functions → search → Logs
- Real-time log streaming available

### Error Tracking
- Function errors logged automatically
- 500 errors trigger email notifications (configurable)

## Custom Domains

1. **Add Custom Domain**
   - Site settings → Domain management → Add custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Automatically provisioned by Netlify
   - Let's Encrypt certificates

3. **WWW Redirect**
   - Configure in Domain settings
   - Option to redirect www to non-www or vice versa

## Troubleshooting

### Build Failures
- Check build logs in Netlify dashboard
- Verify `netlify.toml` configuration
- Ensure Node.js version compatibility

### Function Errors
- Check function logs in dashboard
- Verify CORS headers if frontend can't connect
- Test function locally with `netlify dev`

### Routing Issues
- Verify `_redirects` file in `public/` directory
- Check SPA routing configuration
- Test 404 handling

### Performance Issues
- Monitor function execution time
- Check for timeout errors
- Consider increasing function memory/timeout

## Cost Estimation

### Free Tier Limits
- **Bandwidth**: 100GB/month
- **Function invocations**: 125,000/month
- **Function execution time**: 100 hours/month
- **Build minutes**: 300/month

### Paid Plans
- **Pro**: $19/month - Higher limits and features
- **Business**: $99/month - Advanced features
- **Enterprise**: Custom pricing

## Security

### Built-in Security
- HTTPS enforced
- DDoS protection
- Bot filtering
- Security headers configured

### Additional Recommendations
- Keep dependencies updated
- Monitor function logs for suspicious activity
- Use environment variables for sensitive data
- Implement rate limiting if needed

## Support

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Functions Guide**: [docs.netlify.com/functions](https://docs.netlify.com/functions)
- **Community**: [community.netlify.com](https://community.netlify.com)

---

**Deployment URL**: Your site will be available at `https://your-site-name.netlify.app`

**API Endpoint**: `https://your-site-name.netlify.app/api/search`