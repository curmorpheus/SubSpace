"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import StatsCards from "@/components/admin/StatsCards";
import ReportsTab from "@/components/admin/ReportsTab";
import QRGeneratorTab from "@/components/admin/QRGeneratorTab";
import InvitationsTab from "@/components/admin/InvitationsTab";

interface FormSubmission {
  id: number;
  formTypeId: number;
  jobNumber: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedByCompany: string;
  data: any;
  pdfData: string | null;
  submittedAt: string;
  superintendentEmail?: string | null;
  projectEmail?: string | null;
}

interface ProcoreProject {
  id: number;
  name: string;
  project_number?: string;
  display_name?: string;
  company_name?: string;
  origin_data?: string;
}

type TabType = "reports" | "qr-generator" | "invitations";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("reports");

  // Procore integration
  const [procoreProjects, setProcoreProjects] = useState<ProcoreProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const result = await signIn("credentials", {
        email: "admin@subspace.local",
        password,
        redirect: false,
      });

      if (result?.ok) {
        setPassword("");
      } else {
        setAuthError(result?.error || "Invalid password");
      }
    } catch (error) {
      setAuthError("Authentication failed");
    }
  };

  const handleProcoreLogin = async () => {
    setAuthError("");
    console.log("[Client] Starting Procore sign-in...");
    await signIn("procore", {
      callbackUrl: "/admin",
    });
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/forms/list", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      } else {
        console.error("Failed to fetch submissions:", response.status);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcoreProjects = async () => {
    if ((session?.user as any)?.authProvider !== "procore") {
      return;
    }

    setLoadingProjects(true);
    try {
      const response = await fetch("/api/procore/projects", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProcoreProjects(data.projects || []);
      } else {
        console.error("Failed to fetch Procore projects:", response.status);
      }
    } catch (error) {
      console.error("Error fetching Procore projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubmissions();
      fetchProcoreProjects();
    }
  }, [status, session]);

  const handleLogout = async () => {
    setSubmissions([]);
    await signOut({ redirect: false });
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Superintendent Login
            </h1>

            {/* Procore OAuth Login */}
            <button
              onClick={handleProcoreLogin}
              className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-3 mb-6"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
              Sign in with Procore
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with password
                </span>
              </div>
            </div>

            {/* Password Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Login
              </button>
            </form>

            <button
              onClick={() => router.push("/")}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-md font-black tracking-wider text-sm">
                SUBSPACE
              </div>
              <span className="text-gray-400 text-sm hidden sm:inline">
                by DEACON
              </span>
            </div>

            {/* Right: User Profile */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">
                  {session?.user?.name || session?.user?.email}
                </span>
                <span className="text-xs text-gray-500">
                  {(session?.user as any)?.authProvider === "procore"
                    ? "Procore Account"
                    : "Local Account"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* User Initials Circle */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {session?.user?.name
                    ? session.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : session?.user?.email?.[0].toUpperCase() || "U"}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Superintendent Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your safety forms, QR codes, and subcontractor invitations
          </p>
        </div>

        {/* Statistics Cards */}
        <StatsCards submissions={submissions} />

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === "reports"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">📊</span>
                  <span className="hidden sm:inline">My Reports</span>
                  <span className="sm:hidden">Reports</span>
                  {submissions.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                      {submissions.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab("qr-generator")}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === "qr-generator"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">📱</span>
                  <span className="hidden sm:inline">QR Generator</span>
                  <span className="sm:hidden">QR</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("invitations")}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === "invitations"
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">✉️</span>
                  <span className="hidden sm:inline">Invitations</span>
                  <span className="sm:hidden">Invite</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "reports" && (
              <ReportsTab
                submissions={submissions}
                loading={loading}
                onRefresh={fetchSubmissions}
              />
            )}
            {activeTab === "qr-generator" && (
              <QRGeneratorTab
                superintendentEmail={session?.user?.email || ""}
                procoreProjects={procoreProjects}
                loadingProjects={loadingProjects}
              />
            )}
            {activeTab === "invitations" && (
              <InvitationsTab
                superintendentEmail={session?.user?.email || ""}
                procoreProjects={procoreProjects}
                loadingProjects={loadingProjects}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
