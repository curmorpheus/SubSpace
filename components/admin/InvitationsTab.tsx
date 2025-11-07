"use client";

import { useState } from "react";

interface ProcoreProject {
  id: number;
  name: string;
  project_number?: string;
  display_name?: string;
  company_name?: string;
  origin_data?: string;
}

interface InvitationsTabProps {
  superintendentEmail: string;
  procoreProjects: ProcoreProject[];
  loadingProjects: boolean;
}

export default function InvitationsTab({
  superintendentEmail,
  procoreProjects,
  loadingProjects,
}: InvitationsTabProps) {
  const [inviteSubName, setInviteSubName] = useState("");
  const [inviteSubEmail, setInviteSubEmail] = useState("");
  const [inviteSubCompany, setInviteSubCompany] = useState("");
  const [inviteJobNumber, setInviteJobNumber] = useState("");
  const [inviteProjectEmail, setInviteProjectEmail] = useState("");
  const [inviteSuperintendentEmail, setInviteSuperintendentEmail] =
    useState(superintendentEmail);
  const [invitePersonalNote, setInvitePersonalNote] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  const sendSubcontractorInvitation = async () => {
    if (
      !inviteSubEmail ||
      !inviteSubName ||
      !inviteSubCompany ||
      !inviteJobNumber ||
      !inviteSuperintendentEmail
    ) {
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
          projectEmail: inviteProjectEmail,
          personalNote: invitePersonalNote,
        }),
      });

      if (response.ok) {
        setInviteSuccess(
          `Invitation sent successfully to ${inviteSubEmail}!`
        );
        // Clear form after 3 seconds
        setTimeout(() => {
          setInviteSubName("");
          setInviteSubEmail("");
          setInviteSubCompany("");
          setInviteJobNumber("");
          setInviteProjectEmail("");
          setInvitePersonalNote("");
          setInviteSuccess("");
        }, 3000);
      } else if (response.status === 401) {
        setInviteError(
          "Your session has expired. Please refresh the page and log in again."
        );
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

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">✉️</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Invite Subcontractor to Participate
              </h3>
              <p className="text-sm text-gray-700">
                Send a personalized invitation email to subcontractors with a
                pre-filled form link. They&apos;ll receive a customized link that
                makes it easy to submit inspection reports.
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
          <h3 className="text-md font-bold text-gray-900 mb-4">
            Subcontractor Information
          </h3>

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

          <h3 className="text-md font-bold text-gray-900 mb-4 mt-6">
            Project Details
          </h3>

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
                  value={inviteJobNumber}
                  onChange={(e) => {
                    const selectedProject = procoreProjects.find(
                      (p) =>
                        (p.project_number || p.name) === e.target.value
                    );
                    setInviteJobNumber(e.target.value);
                    setInviteProjectEmail(selectedProject?.origin_data || "");
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
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
                  value={inviteJobNumber}
                  onChange={(e) => setInviteJobNumber(e.target.value)}
                  placeholder="e.g., 2024-001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Email (for receiving forms) *
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Pre-filled)
                </span>
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

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2">
            What happens when you send an invitation?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • The subcontractor receives a professional email with your
              personal note
            </li>
            <li>
              • The email includes a link to a form pre-filled with their
              information
            </li>
            <li>
              • When they submit the form, you&apos;ll receive the report via email
            </li>
            <li>• The report will also appear in your Reports tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
