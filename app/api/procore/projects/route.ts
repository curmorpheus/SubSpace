import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const procoreAccessToken = (session.user as any).procoreAccessToken;

    if (!procoreAccessToken) {
      return NextResponse.json(
        { error: "No Procore access token available" },
        { status: 400 }
      );
    }

    // Fetch user's companies first
    const companiesResponse = await fetch("https://api.procore.com/rest/v1.0/companies", {
      headers: {
        Authorization: `Bearer ${procoreAccessToken}`,
      },
    });

    if (!companiesResponse.ok) {
      console.error("Failed to fetch Procore companies:", companiesResponse.status);
      return NextResponse.json(
        { error: "Failed to fetch Procore companies" },
        { status: companiesResponse.status }
      );
    }

    const companies = await companiesResponse.json();

    // Fetch projects for each company
    const allProjects = [];
    for (const company of companies) {
      const projectsResponse = await fetch(
        `https://api.procore.com/rest/v1.0/projects?company_id=${company.id}`,
        {
          headers: {
            Authorization: `Bearer ${procoreAccessToken}`,
          },
        }
      );

      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        // Add company name to each project for context
        const projectsWithCompany = projects.map((project: any) => ({
          ...project,
          company_name: company.name,
        }));
        allProjects.push(...projectsWithCompany);
      }
    }

    return NextResponse.json({
      projects: allProjects,
      count: allProjects.length,
    });
  } catch (error) {
    console.error("Error fetching Procore projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
