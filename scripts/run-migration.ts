import { db } from "@/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Running migration: Add pdf_data column...");

    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'form_submissions'
        AND column_name = 'pdf_data';
    `);

    if (result.rows.length > 0) {
      console.log("Column pdf_data already exists, skipping migration");
      process.exit(0);
    }

    // Add the column
    await db.execute(sql`
      ALTER TABLE form_submissions ADD COLUMN pdf_data TEXT;
    `);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
