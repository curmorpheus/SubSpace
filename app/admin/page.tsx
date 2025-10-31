"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

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

  // QR Code Generator state
  const [qrJobNumber, setQrJobNumber] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [showQrGenerator, setShowQrGenerator] = useState(false);

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

  const generateQRCode = async () => {
    if (!qrJobNumber.trim()) {
      alert("Please enter a job number");
      return;
    }

    try {
      // Generate URL with job number parameter
      const formUrl = `${window.location.origin}/forms/impalement-protection?jobNumber=${encodeURIComponent(qrJobNumber)}`;

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(formUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code");
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `impalement-protection-qr-${qrJobNumber}.png`;
    link.href = qrCodeDataUrl;
    link.click();
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
    <>
      {/* Print-only flyer layout */}
      {qrCodeDataUrl && (
        <div className="hidden print:block print:page-break-after-always">
          <style jsx>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-flyer, .print-flyer * {
                visibility: visible;
              }
              .print-flyer {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              @page {
                margin: 0;
              }
            }
          `}</style>
          <div className="print-flyer w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white p-12">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-black mb-4">IMPALEMENT PROTECTION</h1>
              <p className="text-3xl font-bold text-orange-100">Safety Inspection Form</p>
            </div>

            <div className="bg-white rounded-3xl p-12 shadow-2xl mb-8">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-96 h-96" />
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border-4 border-white">
              <p className="text-5xl font-black text-center">JOB #{qrJobNumber}</p>
            </div>

            <div className="max-w-3xl text-center space-y-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white">
                <h2 className="text-3xl font-bold mb-3">📱 How to Use This QR Code</h2>
                <ol className="text-left text-xl space-y-2 font-medium">
                  <li>1. Open your phone&apos;s camera app</li>
                  <li>2. Point it at the QR code above</li>
                  <li>3. Tap the notification that appears</li>
                  <li>4. Complete the safety inspection form</li>
                </ol>
              </div>

              <div className="bg-yellow-400 text-gray-900 rounded-xl p-6 border-4 border-yellow-300">
                <p className="text-2xl font-black">⚠️ SAFETY FIRST</p>
                <p className="text-lg font-semibold mt-2">All impalement hazards must be reported and corrected immediately</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-xl font-semibold text-orange-100">SubSpace - Construction Form Management</p>
              <p className="text-lg text-orange-200 mt-2">For assistance, contact your site superintendent</p>
            </div>
          </div>
        </div>
      )}

      {/* Regular dashboard view */}
      <div className="min-h-screen bg-gray-50 py-8 px-4 print:hidden">
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

          {/* QR Code Generator Section */}
          <div className="mb-6 border-2 border-orange-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowQrGenerator(!showQrGenerator)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center hover:from-orange-600 hover:to-orange-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <div className="font-bold text-lg">Generate QR Code for Job Site</div>
                  <div className="text-sm text-orange-100">Create QR codes for subcontractors to scan on site</div>
                </div>
              </div>
              <span className="text-2xl">{showQrGenerator ? "▼" : "▶"}</span>
            </button>

            {showQrGenerator && (
              <div className="p-6 bg-orange-50">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Number
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={qrJobNumber}
                        onChange={(e) => setQrJobNumber(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && generateQRCode()}
                        placeholder="e.g., 2025-001"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-medium"
                      />
                      <button
                        onClick={generateQRCode}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                      >
                        Generate QR Code
                      </button>
                    </div>
                  </div>

                  {qrCodeDataUrl && (
                    <div className="bg-white rounded-lg p-6 text-center border-2 border-orange-300">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          QR Code for Job #{qrJobNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Scan this code to open the Impalement Protection form with job number pre-filled
                        </p>
                      </div>

                      <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg mb-4">
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={downloadQRCode}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                        >
                          <span>⬇️</span>
                          Download QR Code
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                        >
                          <span>🖨️</span>
                          Print
                        </button>
                      </div>

                      <div className="mt-4 text-xs text-gray-500">
                        URL: {window.location.origin}/forms/impalement-protection?jobNumber={qrJobNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
    </>
  );
}
