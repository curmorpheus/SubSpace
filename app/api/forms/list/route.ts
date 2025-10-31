import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // In production, add authentication check here
    const authHeader = request.headers.get("authorization");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all form submissions, ordered by most recent first
    const submissions = await db
      .select()
      .from(formSubmissions)
      .orderBy(desc(formSubmissions.submittedAt));

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
