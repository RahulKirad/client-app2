# Netlify Deployment Guide

This guide will walk you through deploying your React frontend application to Netlify.

## Prerequisites

- A Netlify account (sign up at [netlify.com](https://www.netlify.com) if you don't have one)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket) OR ready to use drag-and-drop

---

## Method 1: Deploy via Git Repository (Recommended)

### Step 1: Push Your Code to Git

1. **Initialize Git** (if not already done):
   ```bash
   cd project
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a repository on GitHub/GitLab/Bitbucket** and push your code:
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```

### Step 2: Connect to Netlify

1. **Log in to Netlify**: Go to [app.netlify.com](https://app.netlify.com) and sign in

2. **Add New Site**: Click "Add new site" → "Import an existing project"

3. **Connect Git Provider**: Choose GitHub, GitLab, or Bitbucket and authorize Netlify

4. **Select Repository**: Choose your repository from the list

### Step 3: Configure Build Settings

Netlify should automatically detect the settings from `netlify.toml`, but verify:

- **Base directory**: `project` (if your repo root contains the project folder)
  - OR leave empty if deploying from the `project` folder directly
- **Build command**: `npm run build` (already configured)
- **Publish directory**: `dist` (already configured)

**Note**: If your repository root is the `project` folder itself, leave "Base directory" empty.

### Step 4: Set Environment Variables (If Needed)

If your app uses environment variables (like `VITE_API_URL`):

1. Go to **Site settings** → **Environment variables**
2. Click **Add variable**
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend API URL (e.g., `https://your-backend-api.com/api`)
4. Click **Save**

### Step 5: Deploy

1. Click **Deploy site**
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be live at a URL like: `https://random-name-123.netlify.app`

---

## Method 2: Deploy via Drag & Drop

### Step 1: Build Your Application Locally

1. **Open terminal** in the `project` folder:
   ```bash
   cd project
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

   This creates a `dist` folder with your production-ready files.

### Step 2: Deploy to Netlify

1. **Log in to Netlify**: Go to [app.netlify.com](https://app.netlify.com)

2. **Drag & Drop**: 
   - Go to **Sites** page
   - Find the **"Want to deploy a new site without connecting to Git?"** section
   - Drag the entire `dist` folder onto the deploy area
   - Wait for upload and deployment to complete

3. **Your site is live!** You'll get a URL like `https://random-name-123.netlify.app`

**Note**: With drag-and-drop, you'll need to rebuild and redeploy manually whenever you make changes.

---

## Method 3: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This will open your browser to authorize the CLI.

### Step 3: Initialize and Deploy

1. **Navigate to your project folder**:
   ```bash
   cd project
   ```

2. **Initialize Netlify** (first time only):
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Follow the prompts

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

   Or for a draft/preview deployment:
   ```bash
   netlify deploy
   ```

---

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow the instructions to configure your domain

### Continuous Deployment

If you used Method 1 (Git), Netlify automatically:
- Deploys when you push to your main branch
- Creates preview deployments for pull requests
- Shows build status in your Git provider

### Environment Variables

Remember to set environment variables in Netlify dashboard:
- **Site settings** → **Environment variables**
- Add `VITE_API_URL` if your frontend needs to connect to a backend API

---

## Troubleshooting

### Build Fails

1. Check build logs in Netlify dashboard
2. Ensure Node.js version is compatible (Netlify uses Node 18 by default)
3. Verify all dependencies are in `package.json`

### Page Not Found Errors

- The `netlify.toml` file should handle this automatically
- Verify the redirect rule is present: `/* /index.html 200`

### API Connection Issues

- Set `VITE_API_URL` environment variable in Netlify
- Ensure your backend API allows CORS from your Netlify domain
- Check browser console for CORS errors

### Images Not Loading

- Ensure image paths in your code use relative paths (e.g., `/images/logo.png`)
- Check that images are in the `public` folder (they'll be copied to `dist` during build)

---

## Quick Reference

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18 (default, can be changed in Netlify settings)
- **Configuration File**: `netlify.toml` (already created)

---

## Need Help?

- Netlify Docs: [docs.netlify.com](https://docs.netlify.com)
- Netlify Support: [netlify.com/support](https://www.netlify.com/support)

