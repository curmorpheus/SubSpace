# SubSpace

A modern web application for construction subcontractors to submit inspection forms and superintendents to manage submissions.

## Features

- **Mobile-responsive form submission** - Subcontractors can easily fill out forms on any device
- **Digital signature capture** - Sign forms with your finger or mouse
- **PDF generation** - Automatically creates professional PDFs of completed forms
- **Email delivery** - Send forms as PDF attachments directly to superintendents
- **Multiple inspection entries** - Add multiple inspections to a single form
- **Superintendent dashboard** - View, search, and manage all form submissions
- **Secure authentication** - Password-protected admin access
- **Expandable architecture** - Easy to add new form types
- **Export capabilities** - Print or save forms as PDFs

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Neon Postgres** - Serverless PostgreSQL database
- **Drizzle ORM** - Type-safe database queries
- **Resend** - Email delivery service
- **jsPDF** - PDF generation
- **react-signature-canvas** - Digital signature capture
- **Vercel** - Deployment platform

## Setup Instructions

### 1. Create a Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (starts with `postgresql://...`)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL=your-neon-connection-string-here

# Admin password for superintendent access
ADMIN_PASSWORD=your-secure-password-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Database

Push the database schema to Neon:

```bash
npm run db:push
```

Seed the database with the initial form type:

```bash
npx tsx db/seed.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For Subcontractors

1. Go to the home page
2. Click on "Impalement Protection" form
3. Fill out the form details
4. Add multiple inspections if needed
5. Submit the form

### For Superintendents

1. Go to the home page
2. Click on "Superintendent Dashboard"
3. Enter the admin password (set in `.env.local`)
4. View all submitted forms
5. Search by job number, name, or company
6. Click any submission to view full details
7. Export forms as PDFs using the Print button

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
4. Deploy!

## Adding New Form Types

The architecture is designed to easily support additional form types:

1. Add a new form type entry to the database
2. Create a new form component in `app/forms/[form-type]/page.tsx`
3. Update the home page to link to the new form
4. Form submissions are automatically handled by the existing API

## Database Scripts

- `npm run db:generate` - Generate migration files
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Testing

### Unit Tests (Jest)
- `npm test` - Run all unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### End-to-End Tests (Playwright)
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run tests with UI mode
- `npm run test:e2e:debug` - Debug tests
- `npm run playwright:install` - Install Playwright browsers

### Playwright MCP Server

This project includes configuration for the Playwright MCP (Model Context Protocol) server, which enables Claude Code to interact with browsers for testing and debugging.

**Quick Start:**
```bash
# Install MCP server for Claude Code
claude mcp add playwright npx @playwright/mcp@latest

# Install Playwright browsers
npm run playwright:install
```

**Documentation:**
- Full guide: `MCP_SETUP.md`
- Quick reference: `docs/MCP_QUICK_START.md`

**Example usage with Claude:**
- "Navigate to http://localhost:3000 and test the form submission"
- "Check the accessibility of the dashboard page"
- "Fill out the impalement protection form with test data"

## Security Notes

- The current authentication uses a simple password stored in environment variables
- For production, consider implementing proper user authentication (NextAuth.js, Clerk, etc.)
- Always use strong passwords
- Enable HTTPS in production (automatic with Vercel)

## Future Enhancements

- Email notifications when forms are submitted
- Advanced PDF generation with company branding
- Photo upload capability for inspections
- Digital signatures
- Multi-user authentication with roles
- Form templates management UI
- Analytics and reporting dashboard

## License

Private - Deacon Construction Team
