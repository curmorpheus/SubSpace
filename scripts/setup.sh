#!/bin/bash

echo "🚀 SubSpace Setup Script"
echo "========================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local file found"
    source .env.local
else
    echo "❌ .env.local file not found"
    echo ""
    echo "Please create .env.local with:"
    echo "  DATABASE_URL=your-neon-connection-string"
    echo "  ADMIN_PASSWORD=your-admin-password"
    echo ""
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.local"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database schema..."
npm run db:push

echo ""
echo "🌱 Seeding database with initial data..."
npx tsx db/seed.ts

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Visit http://localhost:3000"
echo "  3. Test the form submission"
echo "  4. Login to admin dashboard with your password"
echo ""
echo "Ready to deploy? Run 'vercel --prod'"
echo ""
