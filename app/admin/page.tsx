"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbarContainer,
  GridToolbarQuickFilter
} from "@mui/x-data-grid";
import { generateImpalementProtectionPDF } from "@/lib/pdf-generator";

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
  const [qrSuperintendentEmail, setQrSuperintendentEmail] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [showQrGenerator, setShowQrGenerator] = useState(false);

  // Subcontractor Invitation state
  const [showInvitation, setShowInvitation] = useState(false);
  const [inviteSubName, setInviteSubName] = useState("");
  const [inviteSubEmail, setInviteSubEmail] = useState("");
  const [inviteSubCompany, setInviteSubCompany] = useState("");
  const [inviteJobNumber, setInviteJobNumber] = useState("");
  const [inviteSuperintendentEmail, setInviteSuperintendentEmail] = useState("");
  const [invitePersonalNote, setInvitePersonalNote] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

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
    // If it's already formatted (from client device), return as-is
    // Otherwise, format the database timestamp
    if (dateString.includes('/') || dateString.includes('AM') || dateString.includes('PM')) {
      return dateString; // Already formatted local time
    }
    return new Date(dateString).toLocaleString();
  };

  // Custom toolbar with quick filter
  function CustomToolbar() {
    return (
      <GridToolbarContainer sx={{ padding: "8px 16px" }}>
        <GridToolbarQuickFilter
          placeholder="Search all fields..."
          sx={{ flex: 1 }}
          debounceMs={200}
        />
      </GridToolbarContainer>
    );
  }

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 80,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "jobNumber",
      headerName: "Job Number",
      width: 150,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedBy",
      headerName: "Submitted By",
      width: 180,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedByCompany",
      headerName: "Company",
      width: 200,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedByEmail",
      headerName: "Email",
      width: 220,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedAt",
      headerName: "Submitted At (Local)",
      width: 220,
      headerClassName: "font-bold bg-gray-50",
      valueGetter: (value, row) => {
        // Prefer local device time if available
        return row.data?.submittedAtLocal || value;
      },
      valueFormatter: (value) => formatDate(value),
    },
  ];

  const generateQRCode = async () => {
    if (!qrJobNumber.trim()) {
      alert("Please enter a job number");
      return;
    }

    try {
      // Build URL with parameters
      const params = new URLSearchParams();
      params.append("jobNumber", qrJobNumber);

      // Add email parameter if provided
      if (qrSuperintendentEmail.trim()) {
        params.append("superintendentEmail", qrSuperintendentEmail.trim());
      }

      const formUrl = `${window.location.origin}/forms/impalement-protection?${params.toString()}`;

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

  const sendSubcontractorInvitation = async () => {
    if (!inviteSubEmail || !inviteSubName || !inviteSubCompany || !inviteJobNumber || !inviteSuperintendentEmail) {
      setInviteError("Please fill in all required fields");
      return;
    }

    setInviteSending(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const response = await fetch("/api/invite-subcontractor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subcontractorName: inviteSubName,
          subcontractorEmail: inviteSubEmail,
          subcontractorCompany: inviteSubCompany,
          jobNumber: inviteJobNumber,
          superintendentEmail: inviteSuperintendentEmail,
          personalNote: invitePersonalNote,
        }),
      });

      if (response.ok) {
        setInviteSuccess(`Invitation sent successfully to ${inviteSubEmail}!`);
        // Clear form after 3 seconds
        setTimeout(() => {
          setInviteSubName("");
          setInviteSubEmail("");
          setInviteSubCompany("");
          setInviteJobNumber("");
          setInviteSuperintendentEmail("");
          setInvitePersonalNote("");
          setInviteSuccess("");
        }, 3000);
      } else if (response.status === 401) {
        setInviteError("Your session has expired. Please refresh the page and log in again.");
      } else {
        const data = await response.json();
        setInviteError(data.error || "Failed to send invitation");
      }
    } catch (error) {
      setInviteError("Failed to send invitation. Please try again.");
    } finally {
      setInviteSending(false);
    }
  };

  const downloadPDF = (submission: FormSubmission) => {
    try {
      let pdfData: Uint8Array;

      // Check if we have a stored PDF
      if (submission.pdfData) {
        console.log("Using stored PDF from database");
        // Convert base64 to Uint8Array
        const base64Data = submission.pdfData;
        const binaryString = atob(base64Data);
        pdfData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pdfData[i] = binaryString.charCodeAt(i);
        }
      } else {
        console.log("Generating PDF on the fly");
        // Generate PDF on the fly (backwards compatibility)
        const pdfBuffer = generateImpalementProtectionPDF(
          {
            jobNumber: submission.jobNumber,
            submittedBy: submission.submittedBy,
            submittedByEmail: submission.submittedByEmail,
            submittedByCompany: submission.submittedByCompany,
            submittedAt: submission.submittedAt,
          },
          submission.data
        );
        pdfData = new Uint8Array(pdfBuffer);
      }

      // Create blob and download
      // Create a proper Uint8Array from the data
      const blobArray = Uint8Array.from(pdfData);
      const blob = new Blob([blobArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Create link element with download attribute
      const link = document.createElement("a");
      const filename = `Impalement_Protection_Form_${submission.jobNumber}_${Date.now()}.pdf`;
      link.download = filename;
      link.href = url;
      link.style.display = "none";

      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
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
                margin: 0.5in;
                size: letter portrait;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          `}</style>
          <div className="print-flyer w-full bg-white">
            {/* Full-width blue header bar with logo */}
            <div className="w-full" style={{ backgroundColor: '#1e3a5f', padding: '1rem 0' }}>
              <div className="max-w-5xl mx-auto flex justify-center">
                <span className="text-white text-3xl font-black tracking-widest">DEACON</span>
              </div>
            </div>

            <div className="w-full max-w-5xl mx-auto px-6 pt-4">
              {/* Thin orange accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-4"></div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - QR Code */}
                <div className="flex flex-col items-center justify-start">
                  <div className="bg-gray-50 rounded-xl p-4 shadow-md border-2 border-gray-200">
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                  </div>

                  <div className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg px-6 py-3 shadow-md">
                    <p className="text-3xl font-black text-center">JOB #{qrJobNumber}</p>
                  </div>
                </div>

                {/* Right Column - Instructions */}
                <div className="flex flex-col justify-start space-y-4">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-1 leading-tight">Impalement Protection</h1>
                    <p className="text-lg font-semibold text-orange-600">Safety Inspection Form</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">📱</span>
                      <span>How to Use This QR Code</span>
                    </h2>
                    <ol className="space-y-2 text-gray-700">
                      <li className="flex gap-2 items-center">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
                        <span className="text-sm font-medium">Open your phone&apos;s camera app</span>
                      </li>
                      <li className="flex gap-2 items-center">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
                        <span className="text-sm font-medium">Point it at the QR code</span>
                      </li>
                      <li className="flex gap-2 items-center">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
                        <span className="text-sm font-medium">Tap the notification that appears</span>
                      </li>
                      <li className="flex gap-2 items-center">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">4</span>
                        <span className="text-sm font-medium">Complete the safety inspection form</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-base font-black text-gray-900">SAFETY FIRST</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5">All impalement hazards must be reported and corrected immediately</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Job Number *
                      </label>
                      <input
                        type="text"
                        value={qrJobNumber}
                        onChange={(e) => setQrJobNumber(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && generateQRCode()}
                        placeholder="e.g., 2025-001"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={qrSuperintendentEmail}
                        onChange={(e) => setQrSuperintendentEmail(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && generateQRCode()}
                        placeholder="superintendent@deacon.com"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <button
                      onClick={generateQRCode}
                      className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      Generate QR Code
                    </button>
                    {qrSuperintendentEmail && (
                      <p className="mt-2 text-xs text-gray-600 text-center">
                        💡 Your email will be pre-filled in the form when scanned
                      </p>
                    )}
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

          {/* Subcontractor Invitation Section */}
          <div className="mb-6 border-2 border-blue-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowInvitation(!showInvitation)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex justify-between items-center hover:from-blue-600 hover:to-blue-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✉️</span>
                <div className="text-left">
                  <div className="font-bold text-lg">Invite Subcontractor to Participate</div>
                  <div className="text-sm text-blue-100">Send a personalized invitation to join impalement protection inspections</div>
                </div>
              </div>
              <span className="text-2xl">{showInvitation ? "▼" : "▶"}</span>
            </button>

            {showInvitation && (
              <div className="p-6 bg-blue-50">
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subcontractor Name *
                      </label>
                      <input
                        type="text"
                        value={inviteSubName}
                        onChange={(e) => setInviteSubName(e.target.value)}
                        placeholder="e.g., John Smith"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subcontractor Email *
                      </label>
                      <input
                        type="email"
                        value={inviteSubEmail}
                        onChange={(e) => setInviteSubEmail(e.target.value)}
                        placeholder="john@contractor.com"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subcontractor Company *
                      </label>
                      <input
                        type="text"
                        value={inviteSubCompany}
                        onChange={(e) => setInviteSubCompany(e.target.value)}
                        placeholder="e.g., ABC Contractors"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Job Number *
                      </label>
                      <input
                        type="text"
                        value={inviteJobNumber}
                        onChange={(e) => setInviteJobNumber(e.target.value)}
                        placeholder="e.g., 2024-001"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Email (for receiving forms) *
                      </label>
                      <input
                        type="email"
                        value={inviteSuperintendentEmail}
                        onChange={(e) => setInviteSuperintendentEmail(e.target.value)}
                        placeholder="superintendent@example.com"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Personal Note (Optional)
                    </label>
                    <textarea
                      value={invitePersonalNote}
                      onChange={(e) => setInvitePersonalNote(e.target.value)}
                      placeholder="Add a personalized message to the subcontractor..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium resize-none"
                    />
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={sendSubcontractorInvitation}
                      disabled={inviteSending}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviteSending ? "Sending..." : "Send Invitation"}
                    </button>
                  </div>

                  {inviteSuccess && (
                    <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-4">
                      <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                        <span>✓</span> {inviteSuccess}
                      </p>
                    </div>
                  )}

                  {inviteError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-4">
                      <p className="text-sm font-bold text-red-900 flex items-center gap-2">
                        <span>⚠</span> {inviteError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Form Submissions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click any row to view full details
            </p>
          </div>

          <div style={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={filteredSubmissions}
              columns={columns}
              loading={loading}
              slots={{
                toolbar: CustomToolbar,
              }}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: "submittedAt", sort: "desc" }],
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              onRowClick={(params: GridRowParams) => {
                setSelectedSubmission(params.row as FormSubmission);
              }}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                "& .MuiDataGrid-cell:hover": {
                  cursor: "pointer",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f9fafb",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
                },
              }}
            />
          </div>
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
                    <span className="text-sm font-semibold text-gray-700">Submission ID:</span>
                    <div className="font-semibold text-gray-900">{selectedSubmission.id}</div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Job Number:</span>
                    <div className="font-semibold text-gray-900">{selectedSubmission.jobNumber}</div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Submitted By:</span>
                    <div className="font-semibold text-gray-900">{selectedSubmission.submittedBy}</div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Email:</span>
                    <div className="font-semibold text-gray-900">{selectedSubmission.submittedByEmail}</div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Company:</span>
                    <div className="font-semibold text-gray-900">{selectedSubmission.submittedByCompany}</div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Submitted At (Local):</span>
                    <div className="font-semibold text-gray-900">
                      {formatDate(selectedSubmission.data?.submittedAtLocal || selectedSubmission.submittedAt)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Form Data</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Date of Inspection:</span>
                      <div className="font-semibold text-gray-900">{selectedSubmission.data.date}</div>
                    </div>

                    {selectedSubmission.data.inspections?.map((inspection: any, idx: number) => (
                      <div key={idx} className="border-2 border-gray-200 rounded-lg p-4">
                        <h4 className="font-bold text-gray-900 mb-3">
                          Inspection #{idx + 1}
                        </h4>
                        <div className="grid gap-3">
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Time:</span>
                            <div className="font-medium text-gray-900">{inspection.startTime} - {inspection.endTime}</div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Location:</span>
                            <div className="font-medium text-gray-900">{inspection.location}</div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Hazard Description:</span>
                            <div className="font-medium text-gray-900">{inspection.hazardDescription}</div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Corrective Measures:</span>
                            <div className="font-medium text-gray-900">{inspection.correctiveMeasures}</div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Creating/Exposing Employer:</span>
                            <div className="font-medium text-gray-900">{inspection.creatingEmployer}</div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Supervisor:</span>
                            <div className="font-medium text-gray-900">{inspection.supervisor}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => downloadPDF(selectedSubmission)}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  📥 Download PDF
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
