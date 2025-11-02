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
    userinfo: "https://api.procore.com/rest/v1.0/me",
    profile(profile: any) {
      return {
        id: profile.id.toString(),
        name: profile.name || `${profile.first_name} ${profile.last_name}`,
        email: profile.login || profile.email,
        procoreUserId: profile.id.toString(),
        procoreCompanyId: profile.company?.id?.toString(),
      };
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
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        // Find user in database
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
      // Handle Procore OAuth sign-in
      if (account?.provider === "procore") {
        try {
          console.log("[Procore OAuth] User:", user);
          console.log("[Procore OAuth] Profile:", profile);

          const procoreUserId = (profile as any)?.id?.toString();
          const procoreCompanyId = (profile as any)?.company?.id?.toString();
          const email = user.email || "";
          const name = user.name || "";

          console.log("[Procore OAuth] Extracted - ID:", procoreUserId, "Email:", email, "Name:", name);

          if (!procoreUserId || !email) {
            console.error("[Procore OAuth] Missing required fields - ID:", procoreUserId, "Email:", email);
            return false;
          }

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
              name,
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
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.authProvider = (user as any).authProvider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).authProvider = token.authProvider;
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
