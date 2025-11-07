"use client";

import { useState } from "react";
import QRCode from "qrcode";

interface ProcoreProject {
  id: number;
  name: string;
  project_number?: string;
  display_name?: string;
  company_name?: string;
  origin_data?: string;
}

interface QRGeneratorTabProps {
  superintendentEmail: string;
  procoreProjects: ProcoreProject[];
  loadingProjects: boolean;
}

export default function QRGeneratorTab({
  superintendentEmail,
  procoreProjects,
  loadingProjects,
}: QRGeneratorTabProps) {
  const [qrJobNumber, setQrJobNumber] = useState("");
  const [qrSuperintendentEmail, setQrSuperintendentEmail] =
    useState(superintendentEmail);
  const [qrProjectEmail, setQrProjectEmail] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  const generateQRCode = async () => {
    if (!qrJobNumber.trim()) {
      alert("Please enter a job number");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("jobNumber", qrJobNumber);

      if (qrSuperintendentEmail.trim()) {
        params.append("superintendentEmail", qrSuperintendentEmail.trim());
      }

      if (qrProjectEmail.trim()) {
        params.append("projectEmail", qrProjectEmail.trim());
      }

      const formUrl = `${window.location.origin}/forms/impalement-protection?${params.toString()}`;

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

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">📱</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Generate QR Code for Job Site
              </h3>
              <p className="text-sm text-gray-700">
                Create printable QR codes that subcontractors can scan on-site to
                quickly access the Impalement Protection form with job details
                pre-filled.
              </p>
            </div>
          </div>
        </div>

        {loadingProjects && (
          <div className="mb-4 text-center text-sm text-gray-600">
            Loading your Procore projects...
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Number *
                {procoreProjects.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({procoreProjects.length} projects from Procore)
                  </span>
                )}
              </label>
              {procoreProjects.length > 0 ? (
                <select
                  value={qrJobNumber}
                  onChange={(e) => {
                    const selectedProject = procoreProjects.find(
                      (p) =>
                        (p.project_number || p.name) === e.target.value
                    );
                    setQrJobNumber(e.target.value);
                    setQrProjectEmail(selectedProject?.origin_data || "");
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-medium bg-white"
                >
                  <option value="">Select a project...</option>
                  {procoreProjects.map((project) => (
                    <option
                      key={project.id}
                      value={project.project_number || project.name}
                    >
                      {project.project_number || project.name} - {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={qrJobNumber}
                  onChange={(e) => setQrJobNumber(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && generateQRCode()}
                  placeholder="e.g., 2025-001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-medium"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Email
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Pre-filled)
                </span>
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
        </div>

        {qrCodeDataUrl && (
          <div className="bg-white rounded-lg border-2 border-orange-300 p-6 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                QR Code for Job #{qrJobNumber}
              </h3>
              <p className="text-sm text-gray-600">
                Scan this code to open the Impalement Protection form with job
                number pre-filled
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
                Print Flyer
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              URL: {window.location.origin}/forms/impalement-protection?
              jobNumber={qrJobNumber}
            </div>
          </div>
        )}

        {/* Print-only flyer layout */}
        {qrCodeDataUrl && (
          <div className="hidden print:block print:page-break-after-always">
            <style jsx>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-flyer,
                .print-flyer * {
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
              <div
                className="w-full"
                style={{ backgroundColor: "#1e3a5f", padding: "1rem 0" }}
              >
                <div className="max-w-5xl mx-auto flex justify-center">
                  <span className="text-white text-3xl font-black tracking-widest">
                    DEACON
                  </span>
                </div>
              </div>

              <div className="w-full max-w-5xl mx-auto px-6 pt-4">
                <div className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-4"></div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-start">
                    <div className="bg-gray-50 rounded-xl p-4 shadow-md border-2 border-gray-200">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>

                    <div className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg px-6 py-3 shadow-md">
                      <p className="text-3xl font-black text-center">
                        JOB #{qrJobNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-start space-y-4">
                    <div>
                      <h1 className="text-3xl font-black text-gray-900 mb-1 leading-tight">
                        Impalement Protection
                      </h1>
                      <p className="text-lg font-semibold text-orange-600">
                        Safety Inspection Form
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📱</span>
                        <span>How to Use This QR Code</span>
                      </h2>
                      <ol className="space-y-2 text-gray-700">
                        <li className="flex gap-2 items-center">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                            1
                          </span>
                          <span className="text-sm font-medium">
                            Open your phone&apos;s camera app
                          </span>
                        </li>
                        <li className="flex gap-2 items-center">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                            2
                          </span>
                          <span className="text-sm font-medium">
                            Point it at the QR code
                          </span>
                        </li>
                        <li className="flex gap-2 items-center">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                            3
                          </span>
                          <span className="text-sm font-medium">
                            Tap the notification that appears
                          </span>
                        </li>
                        <li className="flex gap-2 items-center">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                            4
                          </span>
                          <span className="text-sm font-medium">
                            Complete the safety inspection form
                          </span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <p className="text-base font-black text-gray-900">
                            SAFETY FIRST
                          </p>
                          <p className="text-xs font-semibold text-gray-700 mt-0.5">
                            All impalement hazards must be reported and corrected
                            immediately
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
