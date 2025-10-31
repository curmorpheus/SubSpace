import { z } from "zod";

/**
 * Validation schema for compressed image
 */
export const compressedImageSchema = z.object({
  dataUrl: z.string().refine(
    (data) => data.startsWith("data:image/"),
    { message: "Must be a valid image data URL" }
  ),
  size: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
});

/**
 * Validation schema for form submission
 */
export const formSubmissionSchema = z.object({
  formType: z.string().min(1, "Form type is required"),
  jobNumber: z.string().min(1, "Job number is required").max(50),
  submittedBy: z.string().min(1, "Name is required").max(100),
  submittedByEmail: z.string().email("Invalid email address"),
  submittedByCompany: z.string().min(1, "Company is required").max(200),
  signature: z.string().optional(),
  data: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    inspections: z.array(
      z.object({
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
        location: z.string().min(1, "Location is required").max(500),
        locationPhotos: z.array(compressedImageSchema).optional(),
        hazardDescription: z
          .string()
          .min(1, "Hazard description is required")
          .max(2000),
        hazardPhotos: z.array(compressedImageSchema).optional(),
        correctiveMeasures: z
          .string()
          .min(1, "Corrective measures are required")
          .max(2000),
        measuresPhotos: z.array(compressedImageSchema).optional(),
        creatingEmployer: z
          .string()
          .min(1, "Creating employer is required")
          .max(200),
        supervisor: z.string().min(1, "Supervisor is required").max(100),
      })
    ),
  }),
  emailOptions: z
    .object({
      recipientEmail: z.string().email("Invalid recipient email"),
      emailSubject: z.string().max(200).optional(),
    })
    .optional(),
});

/**
 * Validation schema for signature data
 */
export const signatureSchema = z
  .string()
  .refine(
    (data) => {
      if (!data) return true; // Optional
      // Check if it's a valid data URL
      return data.startsWith("data:image/png;base64,");
    },
    { message: "Signature must be a valid PNG data URL" }
  )
  .refine(
    (data) => {
      if (!data) return true; // Optional
      // Check size - limit to 1MB base64 string
      return data.length <= 1_400_000; // ~1MB base64
    },
    { message: "Signature image is too large (max 1MB)" }
  );

/**
 * Validation schema for admin login
 */
export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

/**
 * Validation schema for email address with allowlist
 */
export function createEmailAllowlistSchema(allowedDomains: string[]) {
  return z.string().email().refine(
    (email) => {
      if (allowedDomains.length === 0) return true; // No allowlist configured
      const domain = email.split("@")[1]?.toLowerCase();
      return allowedDomains.some((allowed) =>
        domain === allowed.toLowerCase()
      );
    },
    {
      message: `Email domain not allowed. Allowed domains: ${allowedDomains.join(", ")}`,
    }
  );
}

/**
 * Get allowed email domains from environment variable
 */
export function getAllowedEmailDomains(): string[] {
  const allowlist = process.env.EMAIL_ALLOWLIST || "";
  if (!allowlist) return []; // Empty array means no restriction
  return allowlist.split(",").map((d) => d.trim()).filter(Boolean);
}

/**
 * Validate email against allowlist
 */
export function validateEmailAllowlist(email: string): {
  valid: boolean;
  error?: string;
} {
  const allowedDomains = getAllowedEmailDomains();

  // If no allowlist configured, allow all valid emails
  if (allowedDomains.length === 0) {
    return { valid: true };
  }

  const domain = email.split("@")[1]?.toLowerCase();
  const isAllowed = allowedDomains.some(
    (allowed) => domain === allowed.toLowerCase()
  );

  if (!isAllowed) {
    return {
      valid: false,
      error: `Email domain not allowed. Allowed domains: ${allowedDomains.join(", ")}`,
    };
  }

  return { valid: true };
}

export type FormSubmissionInput = z.infer<typeof formSubmissionSchema>;
