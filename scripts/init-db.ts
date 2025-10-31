import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function initDatabase() {
  console.log('🗄️  Initializing database schema...');

  try {
    // Create form_types table
    await sql`
      CREATE TABLE IF NOT EXISTS form_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        schema JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created form_types table');

    // Create form_submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id SERIAL PRIMARY KEY,
        form_type_id INTEGER REFERENCES form_types(id) NOT NULL,
        job_number TEXT,
        submitted_by TEXT,
        submitted_by_email TEXT,
        submitted_by_company TEXT,
        data JSONB NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created form_submissions table');

    // Create superintendents table
    await sql`
      CREATE TABLE IF NOT EXISTS superintendents (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created superintendents table');

    console.log('✨ Database schema initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

initDatabase();
