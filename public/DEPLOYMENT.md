# GitHub Pages Deployment Guide

This guide explains how to deploy the CrawlMapper frontend to GitHub Pages.

## Prerequisites

- GitHub repository
- Git installed on your machine
- GitHub account with repository access

## Deployment Steps

### 1. Prepare Your Repository

1. Create a new GitHub repository or use an existing one
2. Make sure your repository is public (GitHub Pages requires public repos for free accounts)

### 2. Upload Frontend Files

Upload the contents of the `public/` folder to your repository root:

```
├── index.html
├── 404.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── DEPLOYMENT.md (this file)
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

### 4. Access Your Site

Your site will be available at: `https://yourusername.github.io/repository-name`

## Features Available on GitHub Pages

✅ **Frontend Demo**: Complete UI/UX experience  
✅ **Responsive Design**: Works on desktop and mobile  
✅ **Interactive Elements**: Form validation, animations  
✅ **Visual Effects**: Matrix background animation  
✅ **Export Functionality**: Download search results as JSON  

⚠️ **Limited Functionality**: Backend-dependent features are disabled

## GitHub Pages Limitations

Since GitHub Pages only hosts static files, the following features will show a GitHub Pages message:

- ❌ Sitemap crawling and parsing
- ❌ Content search across web pages
- ❌ Real-time search results

## Full-Stack Deployment Options

For complete functionality, deploy the backend server along with the frontend:

### Option 1: Heroku + GitHub Pages

1. **Backend**: Deploy to Heroku using the provided `server.js`
2. **Frontend**: Deploy to GitHub Pages
3. **API Configuration**: Update frontend to point to Heroku API endpoint

### Option 2: Vercel (Recommended)

Deploy both frontend and backend to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow prompts to configure
```

### Option 3: Netlify

Deploy both frontend and backend to Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from project root
netlify deploy --prod --dir=public
```

## Custom Domain (Optional)

1. Add a `CNAME` file to your repository root with your domain:
   ```
   yourdomain.com
   ```

2. Configure DNS settings with your domain provider:
   - Add CNAME record: `www` → `yourusername.github.io`
   - Add A records for apex domain

## Troubleshooting

### 404 Errors
- Ensure `404.html` is in the root directory
- Check that file paths are relative (not absolute)

### CORS Issues
- GitHub Pages doesn't support server-side code
- Use client-side workarounds or deploy backend separately

### Broken Styling
- Verify CSS file paths are correct
- Check that `styles.css` is in `css/` directory

### JavaScript Errors
- Ensure `app.js` is in `js/` directory
- Check browser console for specific errors

## File Structure Reference

```
public/
├── index.html          # Main application page
├── 404.html           # Custom 404 error page
├── css/
│   └── styles.css     # Application styles
├── js/
│   └── app.js         # Application logic
└── DEPLOYMENT.md      # This deployment guide
```

## Support

For issues related to:
- **Frontend**: Check browser console for JavaScript errors
- **GitHub Pages**: Consult [GitHub Pages documentation](https://docs.github.com/en/pages)
- **Deployment**: Review deployment platform documentation

## Version Information

- **Frontend Version**: 2.0.1
- **GitHub Pages Compatible**: Yes
- **Backend Required**: No (demo mode available)
- **Mobile Responsive**: Yes

---

**Note**: This is a static deployment. For full sitemap crawling functionality, deploy the backend server separately.