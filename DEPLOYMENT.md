# Deploying SubSpace to Vercel

This guide will walk you through deploying SubSpace to Vercel with Neon Postgres.

## Prerequisites

- GitHub account
- Vercel account (connected to your GitHub)
- Neon account

## Step 1: Set Up Neon Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click "New Project"
3. Name your project "SubSpace" or similar
4. Select your region (closest to your users)
5. Click "Create Project"
6. Copy your connection string (you'll need this for Vercel)
   - It looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

## Step 2: Push Code to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - SubSpace form management system"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/SubSpace.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended for first deployment)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your SubSpace repository from GitHub
4. Configure the project:
   - **Team**: Select "deacon-construction-team"
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add `DATABASE_URL`: Paste your Neon connection string
   - Add `ADMIN_PASSWORD`: Create a strong password for superintendent access
   - Make sure both are available for "Production", "Preview", and "Development"

6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? deacon-construction-team
# - Link to existing project? No
# - Project name? subspace
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add DATABASE_URL
# Paste your Neon connection string

vercel env add ADMIN_PASSWORD
# Enter your admin password

# Deploy to production
vercel --prod
```

## Step 4: Set Up Database

After deployment, you need to push the database schema and seed it:

1. Install Vercel CLI if you haven't: `npm install -g vercel`
2. Link your local project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Push database schema:
   ```bash
   npm run db:push
   ```
5. Seed the database:
   ```bash
   npx tsx db/seed.ts
   ```

## Step 5: Test Your Deployment

1. Visit your Vercel URL (e.g., `subspace.vercel.app`)
2. Test the Impalement Protection form:
   - Fill out and submit a test form
3. Test the Superintendent Dashboard:
   - Go to `/admin`
   - Login with your `ADMIN_PASSWORD`
   - Verify you can see the test submission

## Step 6: Set Up Custom Domain (Optional)

Since you use `deacon.build` domain with DNSimple:

1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain (e.g., `forms.deacon.build` or `subspace.deacon.build`)
4. Vercel will provide DNS records
5. Go to DNSimple and add the records:
   - Type: `CNAME`
   - Name: `forms` (or `subspace`)
   - Content: `cname.vercel-dns.com`
   - TTL: `3600`
6. Wait for DNS propagation (usually 5-15 minutes)

## Monitoring and Maintenance

### View Logs
```bash
vercel logs
```

### View Deployments
```bash
vercel ls
```

### Rollback to Previous Deployment
1. Go to Vercel dashboard
2. Click on "Deployments"
3. Find the working deployment
4. Click "..." → "Promote to Production"

### Update Environment Variables
```bash
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
```

Or use the Vercel dashboard → Settings → Environment Variables

## Automatic Deployments

Every push to `main` branch will automatically deploy to production. To set up preview deployments:

1. Create a new branch:
   ```bash
   git checkout -b feature/new-form
   ```
2. Make changes and push:
   ```bash
   git push origin feature/new-form
   ```
3. Vercel will create a preview deployment
4. Test the preview URL
5. Merge to `main` when ready

## Database Backups

Neon provides automatic backups. To access them:

1. Go to Neon dashboard
2. Select your project
3. Click "Backups"
4. You can restore from any backup point

## Security Checklist

- [ ] Strong `ADMIN_PASSWORD` set in environment variables
- [ ] `DATABASE_URL` is not committed to git (check `.gitignore`)
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Environment variables are set to production only (not exposed in preview)
- [ ] Neon database has connection pooling enabled

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check Neon database is running
- Ensure connection string includes `?sslmode=require`

### Forms Not Submitting
- Check API routes are working: Visit `/api/forms/submit`
- Check browser console for errors
- Verify database schema is pushed

### Can't Login to Admin Dashboard
- Verify `ADMIN_PASSWORD` environment variable is set in Vercel
- Check browser console for authentication errors
- Try redeploying after setting environment variables

## Cost Estimate

- **Vercel**: Free tier is sufficient for most small teams
- **Neon**: Free tier includes 3 projects with 0.5GB storage each
- **Total**: $0/month for development and small-scale production use

Upgrade to paid tiers as your usage grows.

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review Vercel documentation: https://vercel.com/docs
- Review Neon documentation: https://neon.tech/docs
