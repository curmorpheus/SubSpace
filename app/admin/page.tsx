"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FormSubmission {
  id: number;
  formTypeId: number;
  jobNumber: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedByCompany: string;
  data: any;
  submittedAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
        credentials: "include", // Important for cookies
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword(""); // Clear password from state
        fetchSubmissions();
      } else {
        const data = await response.json();
        setAuthError(data.error || "Invalid password");
      }
    } catch (error) {
      setAuthError("Authentication failed");
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/forms/list", {
        credentials: "include", // Important for cookies
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      } else {
        // If unauthorized, redirect to login
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          credentials: "include",
        });

        if (response.ok) {
          setIsAuthenticated(true);
          fetchSubmissions();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setIsAuthenticated(false);
    setPassword("");
    setSubmissions([]);
  };

  const filteredSubmissions = submissions.filter(
    (sub) =>
      sub.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.submittedByCompany.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Superintendent Login
            </h1>

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Superintendent Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by job number, name, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading submissions...</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600">No form submissions found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2">
                        Impalement Protection
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Job #{submission.jobNumber}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      ID: {submission.id}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Submitted by:</span>
                      <div className="font-medium">{submission.submittedBy}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <div className="font-medium">{submission.submittedByCompany}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <div className="font-medium">{formatDate(submission.submittedAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Submission Details
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <span className="text-sm text-gray-600">Submission ID:</span>
                    <div className="font-medium">{selectedSubmission.id}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Job Number:</span>
                    <div className="font-medium">{selectedSubmission.jobNumber}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Submitted By:</span>
                    <div className="font-medium">{selectedSubmission.submittedBy}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <div className="font-medium">{selectedSubmission.submittedByEmail}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Company:</span>
                    <div className="font-medium">{selectedSubmission.submittedByCompany}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Submitted At:</span>
                    <div className="font-medium">{formatDate(selectedSubmission.submittedAt)}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Form Data</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-600">Date of Inspection:</span>
                      <div className="font-medium">{selectedSubmission.data.date}</div>
                    </div>

                    {selectedSubmission.data.inspections?.map((inspection: any, idx: number) => (
                      <div key={idx} className="border-2 border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Inspection #{idx + 1}
                        </h4>
                        <div className="grid gap-3">
                          <div>
                            <span className="text-sm text-gray-600">Time:</span>
                            <div>{inspection.startTime} - {inspection.endTime}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Location:</span>
                            <div>{inspection.location}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Hazard Description:</span>
                            <div>{inspection.hazardDescription}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Corrective Measures:</span>
                            <div>{inspection.correctiveMeasures}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Creating/Exposing Employer:</span>
                            <div>{inspection.creatingEmployer}</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Supervisor:</span>
                            <div>{inspection.supervisor}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Print / Export PDF
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
