# Netlify Functions Troubleshooting Guide

## Issue: 404 Error on API Calls

If you're getting `404 (Not Found)` errors when calling the API, follow these steps:

## 1. Test Function Deployment

First, test if your functions are deploying at all:

**Visit these URLs in your browser:**
- `https://crawlmapper.netlify.app/.netlify/functions/hello`
- `https://crawlmapper.netlify.app/.netlify/functions/search`

If these return JSON responses, functions are working.
If they return 404 or HTML, functions aren't deploying.

## 2. Check Netlify Build Logs

1. Go to your Netlify dashboard
2. Click on your site
3. Go to **Deploys** tab
4. Click on the latest deploy
5. Check **Deploy log** for errors

Look for:
- ✅ `Functions dependencies installed`
- ❌ Any dependency installation errors
- ❌ Build failures

## 3. Common Solutions

### A. Missing Dependencies
If you see "Cannot find module 'axios'" errors:

1. ✅ **Fixed**: Created `netlify/functions/package.json`
2. ✅ **Fixed**: Updated `netlify.toml` to install function dependencies

### B. Redeploy
After adding the dependency files, trigger a new deploy:

1. Go to Netlify dashboard
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete
4. Check logs for successful dependency installation

### C. Manual Function Test
Test the search function directly:

```bash
curl -X POST https://crawlmapper.netlify.app/.netlify/functions/search \
  -H "Content-Type: application/json" \
  -d '{"url": "example.com", "query": "test"}'
```

## 4. Function URLs

Once working, your functions will be available at:

- **Health Check**: `https://crawlmapper.netlify.app/.netlify/functions/hello`
- **Search API**: `https://crawlmapper.netlify.app/.netlify/functions/search`

## 5. Frontend Integration

The frontend already calls `/api/search`, which Netlify redirects to the function via the redirect rule in `netlify.toml`.

## 6. If Still Not Working

### Check Function Logs
1. Netlify Dashboard → Functions tab
2. Click on the function name
3. View invocation logs

### Verify Build Configuration
Your `netlify.toml` should have:
```toml
[build]
  publish = "public"
  functions = "netlify/functions"
  command = "cd netlify/functions && npm install && echo 'Functions dependencies installed'"
```

## Expected Build Output

Look for this in your build logs:
```
6:13:05 PM: Functions dependencies installed
6:13:06 PM: Build command complete
```

## Still Having Issues?

If none of these solutions work:

1. Check that your Git repository has all the new files
2. Verify you're pushing to the correct branch
3. Try a manual deploy via Netlify CLI
4. Contact Netlify support with your build logs

---

**Quick Fix Summary:**
1. ✅ Added function dependencies (`package.json`)
2. ✅ Updated build configuration (`netlify.toml`)  
3. 🔄 **Redeploy your site**
4. 🧪 **Test the functions**