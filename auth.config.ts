import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { superintendents } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Custom Procore OAuth Provider
 * Procore uses OAuth 2.0 for authentication
 * Documentation: https://developers.procore.com/documentation/oauth-introduction
 */
function ProcoreProvider(options: {
  clientId: string;
  clientSecret: string;
}) {
  return {
    id: "procore",
    name: "Procore",
    type: "oauth" as const,
    authorization: {
      url: "https://login.procore.com/oauth/authorize",
      params: {
        scope: "", // Procore doesn't use scopes - uses app-level permissions
      },
    },
    token: "https://login.procore.com/oauth/token",
    userinfo: {
      url: "https://api.procore.com/rest/v1.0/me",
      async request({ tokens }: any) {
        console.log("[Procore OAuth] Tokens received:", JSON.stringify(tokens, null, 2));
        const accessToken = tokens.access_token || tokens.accessToken;
        console.log("[Procore OAuth] Using access token:", accessToken ? `${accessToken.substring(0, 20)}...` : "MISSING");

        // Fetch user info
        const userResponse = await fetch("https://api.procore.com/rest/v1.0/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          console.error("[Procore OAuth] Userinfo request failed:", userResponse.status, userResponse.statusText);
          const text = await userResponse.text();
          console.error("[Procore OAuth] Response body:", text);
          throw new Error(`Failed to fetch user info: ${userResponse.status} ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        console.log("[Procore OAuth] User data response:", JSON.stringify(userData, null, 2));

        // Fetch user's companies
        const companiesResponse = await fetch("https://api.procore.com/rest/v1.0/companies", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!companiesResponse.ok) {
          console.error("[Procore OAuth] Companies request failed:", companiesResponse.status, companiesResponse.statusText);
          const text = await companiesResponse.text();
          console.error("[Procore OAuth] Companies response body:", text);
          // Don't throw, just return user data without company
          return userData;
        }

        const companies = await companiesResponse.json();
        console.log("[Procore OAuth] Companies response:", JSON.stringify(companies, null, 2));

        // Add companies array to user data
        return {
          ...userData,
          companies: companies,
        };
      },
    },
    profile(profile: any) {
      console.log("[Procore OAuth] Profile function called with:", JSON.stringify(profile, null, 2));

      // Handle empty/whitespace names from Procore
      const firstName = profile.first_name?.trim() || "";
      const lastName = profile.last_name?.trim() || "";
      const fullName = profile.name?.trim() || "";
      const combinedName = `${firstName} ${lastName}`.trim();
      const email = profile.login || profile.email || "";

      // Use full name if available, otherwise first+last, otherwise email prefix
      const displayName = fullName || combinedName || email.split('@')[0] || "Procore User";

      // Extract company IDs from companies array
      const companyIds = profile.companies?.map((c: any) => c.id?.toString()).filter(Boolean) || [];
      console.log("[Procore OAuth] Extracted company IDs:", companyIds);

      const result = {
        id: profile.id?.toString() || "",
        name: displayName,
        email,
        procoreUserId: profile.id?.toString(),
        procoreCompanyIds: companyIds, // Array of all company IDs user has access to
      };

      console.log("[Procore OAuth] Profile function returning:", JSON.stringify(result, null, 2));
      return result;
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}

export const authConfig: NextAuthConfig = {
  providers: [
    // Procore OAuth Provider
    ProcoreProvider({
      clientId: process.env.PROCORE_CLIENT_ID!,
      clientSecret: process.env.PROCORE_CLIENT_SECRET!,
    }),

    // Password-based authentication (fallback)
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        // Check for admin password authentication (no email required)
        if (email === "admin@subspace.local") {
          const adminPassword = process.env.ADMIN_PASSWORD;
          if (adminPassword && password === adminPassword) {
            return {
              id: "admin",
              email: "admin@subspace.local",
              name: "Admin",
              authProvider: "local",
            };
          }
          return null;
        }

        // Find superintendent user in database
        const user = await db
          .select()
          .from(superintendents)
          .where(eq(superintendents.email, email))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const superintendent = user[0];

        // Verify password (only for local auth users)
        if (superintendent.authProvider === "local" && superintendent.password) {
          const passwordsMatch = await bcrypt.compare(
            password,
            superintendent.password
          );

          if (!passwordsMatch) {
            return null;
          }

          // Update last login
          await db
            .update(superintendents)
            .set({ lastLoginAt: new Date() })
            .where(eq(superintendents.id, superintendent.id));

          return {
            id: superintendent.id.toString(),
            email: superintendent.email,
            name: superintendent.name,
            authProvider: superintendent.authProvider,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[SignIn Callback] Provider:", account?.provider);
      console.log("[SignIn Callback] User:", JSON.stringify(user, null, 2));
      console.log("[SignIn Callback] Account:", JSON.stringify(account, null, 2));
      console.log("[SignIn Callback] Profile:", JSON.stringify(profile, null, 2));

      // Handle Procore OAuth sign-in
      if (account?.provider === "procore") {
        try {
          // Read from user object (transformed by profile function), not raw profile
          const procoreUserId = (user as any)?.procoreUserId;
          const procoreCompanyIds = (user as any)?.procoreCompanyIds || [];
          const email = user.email || "";
          const name = user.name || "";

          console.log("[Procore OAuth] Extracted - ID:", procoreUserId, "Email:", email, "Name:", name);
          console.log("[Procore OAuth] User has access to companies:", procoreCompanyIds);

          if (!email) {
            console.error("[Procore OAuth] Email is required but missing");
            return false;
          }

          // Restrict access to specific Procore company only
          const ALLOWED_COMPANY_ID = "562949953430360";
          const hasAccess = procoreCompanyIds.includes(ALLOWED_COMPANY_ID);

          if (!hasAccess) {
            console.error(
              `[Procore OAuth] Access denied - User does not have access to required company.\n` +
              `User companies: ${JSON.stringify(procoreCompanyIds)}\n` +
              `Required company: "${ALLOWED_COMPANY_ID}"`
            );
            return false;
          }

          console.log("[Procore OAuth] Company access verified, proceeding with sign-in");

          // Store the allowed company ID for this user
          const procoreCompanyId = ALLOWED_COMPANY_ID;

          // Check if user exists
          const existingUser = await db
            .select()
            .from(superintendents)
            .where(eq(superintendents.email, email))
            .limit(1);

          if (existingUser.length > 0) {
            console.log("[Procore OAuth] Updating existing user:", email);
            // Update existing user with Procore info
            await db
              .update(superintendents)
              .set({
                authProvider: "procore",
                procoreUserId,
                procoreCompanyId,
                lastLoginAt: new Date(),
              })
              .where(eq(superintendents.id, existingUser[0].id));
          } else {
            console.log("[Procore OAuth] Creating new user:", email);
            // Create new user from Procore
            await db.insert(superintendents).values({
              email,
              name: name || email.split('@')[0], // Fallback to email prefix if no name
              authProvider: "procore",
              procoreUserId,
              procoreCompanyId,
              password: null, // No password for OAuth users
              lastLoginAt: new Date(),
            });
          }

          console.log("[Procore OAuth] Sign-in successful for:", email);
          return true;
        } catch (error) {
          console.error("[Procore OAuth] Error during sign-in:", error);
          console.error("[Procore OAuth] Error stack:", (error as Error).stack);
          // Return true anyway to see if the issue is in DB operations
          console.log("[Procore OAuth] Allowing sign-in despite error");
          return true;
        }
      }

      console.log("[SignIn Callback] Allowing sign-in for provider:", account?.provider);
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.authProvider = (user as any).authProvider;
      }
      // Set authProvider based on OAuth provider
      if (account?.provider === "procore") {
        token.authProvider = "procore";
        // Store Procore access token for API calls
        if (account.access_token) {
          token.procoreAccessToken = account.access_token;
        }
      } else if (account?.provider === "credentials") {
        token.authProvider = "local";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).authProvider = token.authProvider;
        (session.user as any).procoreAccessToken = token.procoreAccessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin", // Custom sign-in page
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (matching existing auth)
  },
};
