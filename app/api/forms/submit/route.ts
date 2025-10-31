import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      formType,
      jobNumber,
      submittedBy,
      submittedByEmail,
      submittedByCompany,
      data,
      signature,
    } = body;

    // Validate required fields
    if (!formType || !jobNumber || !submittedBy || !submittedByEmail || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For now, we'll use formTypeId: 1 for impalement-protection
    // In a full implementation, you'd look up the form type ID from the formTypes table
    const formTypeId = 1;

    // Insert the form submission (including signature in data)
    const submissionData = { ...data, signature };

    const [submission] = await db
      .insert(formSubmissions)
      .values({
        formTypeId,
        jobNumber,
        submittedBy,
        submittedByEmail,
        submittedByCompany,
        data: submissionData,
      })
      .returning();

    return NextResponse.json({
      success: true,
      id: submission.id,
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
