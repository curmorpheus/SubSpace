import { pgTable, serial, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

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

  // Superintendent tracking - who should receive this submission
  superintendentEmail: text("superintendent_email"),
  projectEmail: text("project_email"),

  // Form data stored as JSON for flexibility
  data: jsonb("data").notNull(),

  // PDF storage - the generated PDF that was emailed (stored as base64)
  pdfData: text("pdf_data"),

  // Review tracking
  reviewed: boolean("reviewed").default(false).notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),

  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Superintendent users table
export const superintendents = pgTable("superintendents", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),

  // Password auth (nullable for OAuth users)
  password: text("password"), // Will be hashed for local auth users

  // OAuth fields
  authProvider: text("auth_provider").notNull().default("local"), // 'local' or 'procore'
  procoreUserId: text("procore_user_id"), // Unique Procore user ID
  procoreCompanyId: text("procore_company_id"), // Procore company ID

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type FormType = typeof formTypes.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type Superintendent = typeof superintendents.$inferSelect;
