# SubSpace Quick Start Guide

Get SubSpace up and running in 10 minutes.

## What You'll Need

1. Neon Postgres database (free tier works great)
2. Admin password for superintendent access
3. Node.js (already installed if you're reading this!)

## Quick Setup

### 1. Set Up Your Database (2 minutes)

```bash
# Go to https://console.neon.tech
# - Create a new project called "SubSpace"
# - Copy your connection string (starts with postgresql://)
```

### 2. Configure Environment (1 minute)

Edit `.env.local` file in your project root:

```bash
DATABASE_URL=your-neon-connection-string-here
ADMIN_PASSWORD=ChooseAStrongPassword123!
```

### 3. Set Up Database Schema (2 minutes)

```bash
npm run db:push
npx tsx db/seed.ts
```

### 4. Start Development Server (1 minute)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Test It Out

### As a Subcontractor:
1. Click "Impalement Protection" form
2. Fill out the form with test data
3. Add multiple inspections (optional)
4. Click "Submit Form"

### As a Superintendent:
1. Click "Superintendent Dashboard"
2. Enter your admin password (from `.env.local`)
3. View the test form you just submitted
4. Try searching by job number or name
5. Click a submission to see full details

## Deploy to Production

Ready to go live?

```bash
# Push to GitHub
git add .
git commit -m "Initial SubSpace setup"
git push

# Deploy to Vercel (follow prompts)
vercel --prod
```

Don't forget to add your environment variables in Vercel dashboard!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## What's Next?

- Customize the forms for your specific needs
- Add more form types (see README.md)
- Set up custom domain (forms.deacon.build)
- Configure email notifications
- Add your company logo

## Common Issues

**Can't connect to database?**
- Check your `DATABASE_URL` is correct
- Ensure it ends with `?sslmode=require`

**Build errors?**
- Run `npm install` again
- Delete `.next` folder and rebuild

**Admin login not working?**
- Check `ADMIN_PASSWORD` is set in `.env.local`
- Try restarting the dev server

## Project Structure

```
SubSpace/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── admin/             # Superintendent dashboard
│   ├── forms/             # Form submissions
│   └── api/               # API endpoints
├── db/                    # Database files
│   ├── schema.ts          # Database schema
│   ├── index.ts           # Database connection
│   └── seed.ts            # Initial data
└── ...config files
```

## Need Help?

Check the [README.md](./README.md) for more detailed information.

---

**Pro Tip**: Bookmark the admin dashboard on your superintendents' phones for quick access!
