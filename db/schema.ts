import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

// Form types table - defines available form templates
export const formTypes = pgTable("form_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "impalement-protection"
  displayName: text("display_name").notNull(), // e.g., "Impalement Protection Inspection"
  description: text("description"),
  schema: jsonb("schema").notNull(), // JSON schema defining form fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Form submissions table - stores all submitted forms
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formTypeId: integer("form_type_id").references(() => formTypes.id).notNull(),

  // Metadata fields
  jobNumber: text("job_number"),
  submittedBy: text("submitted_by"),
  submittedByEmail: text("submitted_by_email"),
  submittedByCompany: text("submitted_by_company"),

  // Form data stored as JSON for flexibility
  data: jsonb("data").notNull(),

  // PDF storage - the generated PDF that was emailed (stored as base64)
  pdfData: text("pdf_data"),

  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Superintendent users table
export const superintendents = pgTable("superintendents", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(), // Will be hashed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FormType = typeof formTypes.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type Superintendent = typeof superintendents.$inferSelect;
