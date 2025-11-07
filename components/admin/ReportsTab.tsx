"use client";

import { useState, useMemo } from "react";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbarContainer,
  GridToolbarQuickFilter,
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
  superintendentEmail?: string | null;
  projectEmail?: string | null;
  reviewed?: boolean;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

interface ReportsTabProps {
  submissions: FormSubmission[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ReportsTab({ submissions, loading, onRefresh }: ReportsTabProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<FormSubmission | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<"all" | "reviewed" | "unreviewed">("all");

  // Get unique projects for filter
  const uniqueProjects = useMemo(() => {
    const projects = new Set(
      submissions.map((s) => s.jobNumber).filter(Boolean)
    );
    return Array.from(projects).sort();
  }, [submissions]);

  // Filter submissions based on selected filters
  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === "today") {
      filtered = filtered.filter((s) => new Date(s.submittedAt) >= today);
    } else if (dateFilter === "week") {
      filtered = filtered.filter((s) => new Date(s.submittedAt) >= weekAgo);
    } else if (dateFilter === "month") {
      filtered = filtered.filter((s) => new Date(s.submittedAt) >= monthAgo);
    }

    // Project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter((s) => s.jobNumber === projectFilter);
    }

    // Review status filter
    if (reviewStatusFilter === "reviewed") {
      filtered = filtered.filter((s) => s.reviewed === true);
    } else if (reviewStatusFilter === "unreviewed") {
      filtered = filtered.filter((s) => !s.reviewed);
    }

    return filtered;
  }, [submissions, dateFilter, projectFilter, reviewStatusFilter]);

  const toggleReviewStatus = async (submissionId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/forms/${submissionId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          reviewed: !currentStatus,
        }),
      });

      if (response.ok) {
        // Refresh the submissions list
        onRefresh();
      } else {
        console.error("Failed to update review status");
        alert("Failed to update review status");
      }
    } catch (error) {
      console.error("Error updating review status:", error);
      alert("Error updating review status");
    }
  };

  const formatDate = (dateString: string) => {
    if (
      dateString.includes("/") ||
      dateString.includes("AM") ||
      dateString.includes("PM")
    ) {
      return dateString;
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
      field: "reviewed",
      headerName: "Status",
      width: 120,
      headerClassName: "font-bold bg-gray-50",
      renderCell: (params) => {
        const isReviewed = params.row.reviewed;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleReviewStatus(params.row.id, isReviewed);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              isReviewed
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }`}
          >
            {isReviewed ? "✓ Reviewed" : "• New"}
          </button>
        );
      },
    },
    {
      field: "id",
      headerName: "ID",
      width: 70,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "jobNumber",
      headerName: "Job Number",
      width: 130,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedBy",
      headerName: "Submitted By",
      width: 160,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedByCompany",
      headerName: "Company",
      width: 180,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedByEmail",
      headerName: "Email",
      width: 200,
      headerClassName: "font-bold bg-gray-50",
    },
    {
      field: "submittedAt",
      headerName: "Submitted At (Local)",
      width: 200,
      headerClassName: "font-bold bg-gray-50",
      valueGetter: (value, row) => {
        return row.data?.submittedAtLocal || value;
      },
      valueFormatter: (value) => formatDate(value),
    },
  ];

  const downloadPDF = (submission: FormSubmission) => {
    try {
      let pdfData: Uint8Array;

      if (submission.pdfData) {
        console.log("Using stored PDF from database");
        const base64Data = submission.pdfData;
        const binaryString = atob(base64Data);
        pdfData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pdfData[i] = binaryString.charCodeAt(i);
        }
      } else {
        console.log("Generating PDF on the fly");
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

      const blobArray = Uint8Array.from(pdfData);
      const blob = new Blob([blobArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const filename = `Impalement_Protection_Form_${submission.jobNumber}_${Date.now()}.pdf`;
      link.download = filename;
      link.href = url;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Status:
            </label>
            <select
              value={reviewStatusFilter}
              onChange={(e) =>
                setReviewStatusFilter(e.target.value as "all" | "reviewed" | "unreviewed")
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="unreviewed">New</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Date Range:
            </label>
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "all" | "today" | "week" | "month")
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Project:
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing <span className="font-bold">{filteredSubmissions.length}</span> of{" "}
            <span className="font-bold">{submissions.length}</span> reports
          </div>
        </div>
      </div>

      {/* Data Grid */}
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

      {/* Submission Details Modal */}
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
                  <span className="text-sm font-semibold text-gray-700">
                    Submission ID:
                  </span>
                  <div className="font-semibold text-gray-900">
                    {selectedSubmission.id}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Job Number:
                  </span>
                  <div className="font-semibold text-gray-900">
                    {selectedSubmission.jobNumber}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Submitted By:
                  </span>
                  <div className="font-semibold text-gray-900">
                    {selectedSubmission.submittedBy}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Email:
                  </span>
                  <div className="font-semibold text-gray-900">
                    {selectedSubmission.submittedByEmail}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Company:
                  </span>
                  <div className="font-semibold text-gray-900">
                    {selectedSubmission.submittedByCompany}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    Submitted At (Local):
                  </span>
                  <div className="font-semibold text-gray-900">
                    {formatDate(
                      selectedSubmission.data?.submittedAtLocal ||
                        selectedSubmission.submittedAt
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Form Data
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Date of Inspection:
                    </span>
                    <div className="font-semibold text-gray-900">
                      {selectedSubmission.data.date}
                    </div>
                  </div>

                  {selectedSubmission.data.inspections?.map(
                    (inspection: any, idx: number) => (
                      <div
                        key={idx}
                        className="border-2 border-gray-200 rounded-lg p-4"
                      >
                        <h4 className="font-bold text-gray-900 mb-3">
                          Inspection #{idx + 1}
                        </h4>
                        <div className="grid gap-3">
                          <div>
                            <span className="text-sm font-semibold text-gray-700">
                              Time:
                            </span>
                            <div className="font-medium text-gray-900">
                              {inspection.startTime} - {inspection.endTime}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">
                              Location:
                            </span>
                            <div className="font-medium text-gray-900">
                              {inspection.location}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">
                              Hazard Description:
                            </span>
                            <div className="font-medium text-gray-900">
                              {inspection.hazardDescription}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">
                              Corrective Measures:
                            </span>
                            <div className="font-medium text-gray-900">
                              {inspection.correctiveMeasures}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">
                              Creating/Exposing Employer:
                            </span>
                            <div className="font-medium text-gray-900">
                              {inspection.creatingEmployer}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700">
                              Supervisor:
                            </span>
                            <div className="font-medium text-gray-900">
                              {inspection.supervisor}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
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
  );
}
