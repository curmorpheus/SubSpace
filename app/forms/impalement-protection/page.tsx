"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import ImageUpload from "@/components/ImageUpload";
import SignaturePad, { SignaturePadRef } from "@/components/SignaturePad";
import RadioButtonGroup from "@/components/RadioButtonGroup";
import ConditionalTextArea from "@/components/ConditionalTextArea";
import type { CompressedImage } from "@/lib/image-compression";
import {
  queueSubmission,
  getPendingCount,
  processPendingSubmissions,
} from "@/lib/offline-storage";

const CACHE_KEY = "subspace-form-cache";

function BuckSandersFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [justNavigated, setJustNavigated] = useState(false);
  const [successData, setSuccessData] = useState<{ id: number; email: string } | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const totalSteps = 3;

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load cached values from localStorage (only once on mount)
  const [formData, setFormData] = useState(() => {
    let cached: any = {};
    let isClient = typeof window !== "undefined";

    if (isClient) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        cached = cachedData ? JSON.parse(cachedData) : {};
      } catch {
        cached = {};
      }
    }

    return {
      date: isClient ? getTodayDate() : "",
      whoCompleting: "",
      location: "",
      inspectedWith: "",
      jobNumber: cached.jobNumber || "",
      submittedBy: cached.submittedBy || "",
      submittedByEmail: cached.submittedByEmail || "",
      submittedByCompany: cached.submittedByCompany || "",
      generalHazardManagement: {
        ahasAvailable: "",
        ahasAvailableComment: "",
        ahasReviewedWithEmployees: "",
        ahasReviewedComment: "",
        discussedInMeetings: "",
        discussedInMeetingsComment: "",
      },
      inspectionItems: {
        generalComments: "",
        generalCommentsText: "",
        generalSitePhotos: "",
        sitePhotos: [] as CompressedImage[],
        eliminateRebarReviewed: "",
        eliminateRebarComment: "",
        ahaCompleted: "",
        ahaCompletedComment: "",
        engineeringControls: "",
        engineeringControlsComment: "",
        workAreaIsolated: "",
        workAreaIsolatedComment: "",
        warningSignage: "",
        warningSignageComment: "",
        workAreaInspected: "",
        workAreaInspectedComment: "",
        devicesReplaced: "",
        devicesReplacedComment: "",
        proceduresReviewed: "",
        proceduresReviewedComment: "",
        adequateProtection: "",
        adequateProtectionComment: "",
        rebarStorageInspected: "",
        rebarStorageComment: "",
      },
      safetyObservations: {
        observation1: "",
        observation2: "",
        observation3: "",
      },
    };
  });

  // State for accessibility preferences
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  });

  const [largeButtons, setLargeButtons] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("largeButtons") === "true";
    }
    return false;
  });

  // Check if we have saved user info
  const [hasSavedInfo, setHasSavedInfo] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setHasSavedInfo(!!(parsed.submittedBy || parsed.submittedByEmail || parsed.submittedByCompany));
        } catch {}
      }
    }
  }, []);

  // Offline mode state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Detect online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Update pending count
  const updatePendingCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error("Error getting pending count:", error);
    }
  };

  // Load pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, []);

  // Process pending submissions when coming back online
  useEffect(() => {
    if (!isOnline || pendingCount === 0 || isSyncing) return;

    const syncPending = async () => {
      setIsSyncing(true);
      try {
        const result = await processPendingSubmissions(
          (id) => {
            console.log("Successfully synced submission:", id);
          },
          (id, error) => {
            console.error("Failed to sync submission:", id, error);
          }
        );

        if (result.succeeded > 0) {
          console.log(
            `Successfully synced ${result.succeeded} pending submission${
              result.succeeded > 1 ? "s" : ""
            }!`
          );
        }

        await updatePendingCount();
      } catch (error) {
        console.error("Error syncing pending submissions:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Wait a bit before syncing to ensure connection is stable
    const timeout = setTimeout(syncPending, 2000);
    return () => clearTimeout(timeout);
  }, [isOnline, pendingCount, isSyncing]);

  // Scroll detection for sticky header
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldCollapse = scrollPosition > 80;

      if (shouldCollapse !== isHeaderCollapsed) {
        setIsHeaderCollapsed(shouldCollapse);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHeaderCollapsed]);

  const [emailOptions, setEmailOptions] = useState(() => {
    let cached: any = {};

    if (typeof window !== "undefined") {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        cached = cachedData ? JSON.parse(cachedData) : {};
      } catch {
        cached = {};
      }
    }

    return {
      recipientEmail: cached.recipientEmail || "",
      ccEmails: "",
      emailSubject: "",
      projectEmail: "",
    };
  });

  // Set date value after mount to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => {
      if (prev.date) return prev;
      return {
        ...prev,
        date: getTodayDate(),
      };
    });
  }, []);

  // Read job number, superintendent email, project email from URL parameters
  useEffect(() => {
    const jobNumberParam = searchParams.get('jobNumber');
    const superintendentEmailParam = searchParams.get('superintendentEmail');
    const projectEmailParam = searchParams.get('projectEmail');

    if (jobNumberParam) {
      setFormData(prev => ({
        ...prev,
        jobNumber: jobNumberParam,
      }));
    }

    if (superintendentEmailParam) {
      setEmailOptions(prev => ({
        ...prev,
        recipientEmail: superintendentEmailParam,
      }));
    }

    if (projectEmailParam) {
      setEmailOptions(prev => ({
        ...prev,
        projectEmail: projectEmailParam,
      }));
    }
  }, [searchParams]);

  const validateStep = (step: number): boolean => {
    setError("");

    if (step === 1) {
      if (!formData.date || !formData.whoCompleting || !formData.location || !formData.inspectedWith) {
        setError("Please fill in all required fields");
        return false;
      }
    } else if (step === 2) {
      // Validate all radio buttons have a selection
      const { generalHazardManagement, inspectionItems } = formData;

      if (!generalHazardManagement.ahasAvailable ||
          !generalHazardManagement.ahasReviewedWithEmployees ||
          !generalHazardManagement.discussedInMeetings) {
        setError("Please answer all General Hazard Management questions");
        return false;
      }

      if (!inspectionItems.generalComments ||
          !inspectionItems.generalSitePhotos ||
          !inspectionItems.eliminateRebarReviewed ||
          !inspectionItems.ahaCompleted ||
          !inspectionItems.engineeringControls ||
          !inspectionItems.workAreaIsolated ||
          !inspectionItems.warningSignage ||
          !inspectionItems.workAreaInspected ||
          !inspectionItems.devicesReplaced ||
          !inspectionItems.proceduresReviewed ||
          !inspectionItems.adequateProtection ||
          !inspectionItems.rebarStorageInspected) {
        setError("Please answer all Inspection Items questions");
        return false;
      }
    } else if (step === 3) {
      if (!emailOptions.recipientEmail) {
        setError("Please provide a recipient email address");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setJustNavigated(true);
      setCurrentStep(current => Math.min(current + 1, totalSteps));
      setIsHeaderCollapsed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        setJustNavigated(false);
      }, 500);
    }
  };

  const handlePrevious = () => {
    setJustNavigated(true);
    setCurrentStep(current => Math.max(current - 1, 1));
    setIsHeaderCollapsed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setJustNavigated(false);
    }, 500);
  };

  const handleRememberMeToggle = (checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem("rememberMe", checked.toString());
  };

  const handleLargeButtonsToggle = (checked: boolean) => {
    setLargeButtons(checked);
    localStorage.setItem("largeButtons", checked.toString());
  };

  const handleClearSavedInfo = () => {
    if (confirm("Clear your saved information (Name, Email, Company)?")) {
      localStorage.removeItem(CACHE_KEY);
      setFormData({
        ...formData,
        submittedBy: "",
        submittedByEmail: "",
        submittedByCompany: "",
      });
      setHasSavedInfo(false);
      setRememberMe(false);
      localStorage.setItem("rememberMe", "false");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Prevent submission if not on final step (step 3)
    if (currentStep !== 3) {
      return;
    }

    // Prevent accidental submission right after navigation
    if (justNavigated) {
      console.log("Prevented accidental submission - just navigated to this step");
      return;
    }

    // Final validation
    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture local time as a formatted string (not UTC)
      const now = new Date();
      const submittedAtLocal = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Extract signature if provided
      let signature = "";
      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        signature = signaturePadRef.current.toDataURL();
      }

      const payload = {
        formType: "impalement-protection",
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
        submittedAtLocal,
        signature,
        data: {
          date: formData.date,
          whoCompleting: formData.whoCompleting,
          location: formData.location,
          inspectedWith: formData.inspectedWith,
          generalHazardManagement: formData.generalHazardManagement,
          inspectionItems: formData.inspectionItems,
          safetyObservations: formData.safetyObservations,
        },
        emailOptions: {
          recipientEmail: emailOptions.recipientEmail,
          ccEmails: emailOptions.ccEmails,
          emailSubject: emailOptions.emailSubject || `Buck Sanders Inspection Survey Report - ${formData.jobNumber || 'New Submission'}`,
          projectEmail: emailOptions.projectEmail,
        },
      };

      // Check if offline - queue submission instead
      if (!isOnline) {
        const queuedId = await queueSubmission(payload);
        console.log("Queued submission for later:", queuedId);

        await updatePendingCount();

        // Cache commonly reused fields for next time
        const cacheData = {
          jobNumber: formData.jobNumber,
          submittedBy: formData.submittedBy,
          submittedByEmail: formData.submittedByEmail,
          submittedByCompany: formData.submittedByCompany,
          recipientEmail: emailOptions.recipientEmail,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        alert(
          `You're currently offline. Form saved locally and will be submitted automatically when you're back online.\n\nJob #${formData.jobNumber}\nTo: ${emailOptions.recipientEmail}`
        );

        router.push("/");
        return;
      }

      const endpoint = "/api/forms/submit";

      console.log("Submitting payload:", payload);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");

        // Check if response is JSON before parsing
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const textResponse = await response.text();
          console.error("Non-JSON response:", textResponse);
          throw new Error(`Server error (${response.status}): ${textResponse || 'No response body'}`);
        }

        // Parse validation errors for better error messages
        let errorMessage = errorData.error || "Failed to submit form";

        if (errorData.details) {
          console.error("Validation errors:", errorData.details);

          // If we have detailed validation errors, show them
          const fieldErrors = errorData.details.fieldErrors || {};
          const formErrors = errorData.details.formErrors || [];

          const allErrors: string[] = [...formErrors];
          Object.entries(fieldErrors).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              allErrors.push(...errors.map((err: string) => `${field}: ${err}`));
            }
          });

          if (allErrors.length > 0) {
            errorMessage = allErrors.join("\n");
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Cache commonly reused fields for next time
      const cacheData = {
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
        recipientEmail: emailOptions.recipientEmail,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      // Show success modal
      setSuccessData({ id: result.id, email: emailOptions.recipientEmail });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Large Buttons CSS */}
      <style jsx>{`
        .large-buttons input[type="text"],
        .large-buttons input[type="email"],
        .large-buttons textarea {
          padding: 1rem 1.25rem !important;
          font-size: 1.125rem !important;
          min-height: 56px;
        }
        .large-buttons button {
          padding: 1rem 1.5rem !important;
          font-size: 1.125rem !important;
          min-height: 56px;
        }
        .large-buttons input[type="checkbox"] {
          width: 2.25rem !important;
          height: 2.25rem !important;
          cursor: pointer;
        }
        .large-buttons label {
          font-size: 1rem !important;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        {/* Header Card - Expanded */}
        <div className={`bg-white rounded-lg shadow-sm mb-8 overflow-hidden border border-gray-200 transition-all duration-300 ${
          isHeaderCollapsed ? 'opacity-0 -mt-32' : 'opacity-100'
        }`}>
          <div className="bg-white px-6 sm:px-8 py-8 border-b border-gray-100">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium inline-flex items-center transition-colors mb-6"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Buck Sanders Inspection Survey Report
            </h1>
            <p className="text-gray-600 mt-2 text-base font-normal">
              Impalement Protection Inspection
            </p>
            <div className="mt-4 flex items-center gap-2 text-gray-500">
              <span className="text-sm">Estimated time: 10-15 minutes</span>
            </div>
          </div>
        </div>

        {/* Header - Collapsed (Sticky) */}
        <div className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-md z-40 transition-all duration-300 ${
          isHeaderCollapsed ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => router.push("/")}
                  className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
                  aria-label="Back to Home"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    Buck Sanders Inspection Survey Report
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {formData.jobNumber && (
                  <span className="hidden sm:inline text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    Job #{formData.jobNumber}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        currentStep === step
                          ? 'bg-orange-500 text-white'
                          : currentStep > step
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {currentStep > step ? '✓' : step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offline Mode Indicator */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Currently offline</p>
                <p className="text-sm text-gray-600 mt-1">
                  Forms will be saved locally and submitted automatically when you&apos;re back online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Submissions Indicator */}
        {isOnline && pendingCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-blue-500'}`}></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {isSyncing ? "Syncing pending submissions..." : `${pendingCount} pending submission${pendingCount > 1 ? 's' : ''} waiting to sync`}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isSyncing ? "Please wait..." : "Your queued forms will be submitted automatically."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Progress Indicator */}
          <div className="bg-white px-6 sm:px-8 py-8 border-b border-gray-100">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                    currentStep === step
                      ? 'bg-orange-500 text-white'
                      : currentStep > step
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep > step ? '✓' : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 sm:w-24 h-px mx-2 transition-all ${
                      currentStep > step ? 'bg-gray-900' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-sm font-medium text-gray-900">
                Step {currentStep} of {totalSteps}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep === 1 && 'Basic Information'}
                {currentStep === 2 && 'Inspection Checklist'}
                {currentStep === 3 && 'Safety Observations & Email Delivery'}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting the form on steps 1 and 2
              if (e.key === 'Enter' && currentStep !== 3) {
                e.preventDefault();
              }
            }}
            noValidate
            className={`p-6 sm:p-8 lg:p-10 ${largeButtons ? 'large-buttons' : ''}`}
          >

            {/* Step 1: Basic Information Section */}
            <div className={`mb-10 ${currentStep === 1 ? 'block' : 'hidden'}`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Basic Information
                </h2>
                <p className="text-sm text-gray-500 mt-2">Step 1 of 3</p>
              </div>

              {/* Preferences - Only on Step 1 */}
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={largeButtons}
                      onChange={(e) => handleLargeButtonsToggle(e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Larger buttons
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => handleRememberMeToggle(e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Remember me
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-6">
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  label="Date"
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Who is completing the IISR? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whoCompleting}
                    onChange={(e) => setFormData({ ...formData, whoCompleting: e.target.value })}
                    placeholder="Enter name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Inspected with <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inspectedWith}
                    onChange={(e) => setFormData({ ...formData, inspectedWith: e.target.value })}
                    placeholder="Enter name(s)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Inspection Checklist Section */}
            <div className={`mb-10 ${currentStep === 2 ? 'block' : 'hidden'}`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Inspection Checklist
                </h2>
                <p className="text-sm text-gray-500 mt-2">Step 2 of 3</p>
              </div>

              <div className="space-y-8">
                {/* SECTION: General Hazard Management */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">
                    General Hazard Management
                  </h3>

                  <div className="space-y-6">
                    {/* Question 1 */}
                    <div>
                      <RadioButtonGroup
                        label="Are impalement hazard AHAs/JHAs/JSAs or equivalent available?"
                        value={formData.generalHazardManagement.ahasAvailable as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          generalHazardManagement: {
                            ...formData.generalHazardManagement,
                            ahasAvailable: value,
                          }
                        })}
                        required
                        name="ahasAvailable"
                      />
                      <ConditionalTextArea
                        show={formData.generalHazardManagement.ahasAvailable === "No"}
                        value={formData.generalHazardManagement.ahasAvailableComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          generalHazardManagement: {
                            ...formData.generalHazardManagement,
                            ahasAvailableComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 2 */}
                    <div>
                      <RadioButtonGroup
                        label="Has the impalement hazard AHA/JHA/JSA been reviewed with exposed employees?"
                        value={formData.generalHazardManagement.ahasReviewedWithEmployees as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          generalHazardManagement: {
                            ...formData.generalHazardManagement,
                            ahasReviewedWithEmployees: value,
                          }
                        })}
                        required
                        name="ahasReviewedWithEmployees"
                      />
                      <ConditionalTextArea
                        show={formData.generalHazardManagement.ahasReviewedWithEmployees === "No"}
                        value={formData.generalHazardManagement.ahasReviewedComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          generalHazardManagement: {
                            ...formData.generalHazardManagement,
                            ahasReviewedComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 3 */}
                    <div>
                      <RadioButtonGroup
                        label="Is impalement hazard safety being discussed weekly in tailgate safety meetings and/or other meetings?"
                        value={formData.generalHazardManagement.discussedInMeetings as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          generalHazardManagement: {
                            ...formData.generalHazardManagement,
                            discussedInMeetings: value,
                          }
                        })}
                        required
                        name="discussedInMeetings"
                      />
                      <ConditionalTextArea
                        show={formData.generalHazardManagement.discussedInMeetings === "No"}
                        value={formData.generalHazardManagement.discussedInMeetingsComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          generalHazardManagement: {
                            ...formData.generalHazardManagement,
                            discussedInMeetingsComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION: Inspection Items */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">
                    Inspection Items
                  </h3>

                  <div className="space-y-6">
                    {/* Question 4 - General Comments */}
                    <div>
                      <RadioButtonGroup
                        label="General Comments"
                        value={formData.inspectionItems.generalComments as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            generalComments: value,
                          }
                        })}
                        required
                        name="generalComments"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.generalComments === "Yes" || formData.inspectionItems.generalComments === "No"}
                        value={formData.inspectionItems.generalCommentsText}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            generalCommentsText: value,
                          }
                        })}
                        placeholder="Enter general comments..."
                        maxLength={1000}
                      />
                    </div>

                    {/* Question 5 - General Site Conditions - Photos */}
                    <div>
                      <RadioButtonGroup
                        label="General Site Conditions - Photos"
                        value={formData.inspectionItems.generalSitePhotos as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            generalSitePhotos: value,
                          }
                        })}
                        required
                        name="generalSitePhotos"
                      />
                      {formData.inspectionItems.generalSitePhotos === "Yes" && (
                        <div className="mt-3 ml-4">
                          <ImageUpload
                            label="Upload Site Photos"
                            images={formData.inspectionItems.sitePhotos}
                            onChange={(photos) => setFormData({
                              ...formData,
                              inspectionItems: {
                                ...formData.inspectionItems,
                                sitePhotos: photos,
                              }
                            })}
                            maxImages={5}
                            maxSizeMB={8}
                          />
                        </div>
                      )}
                    </div>

                    {/* Question 6 */}
                    <div>
                      <RadioButtonGroup
                        label="Have you reviewed the possibility of eliminating vertical rebar ends (potential impalement hazards) based on the approved drawings?"
                        value={formData.inspectionItems.eliminateRebarReviewed as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            eliminateRebarReviewed: value,
                          }
                        })}
                        required
                        name="eliminateRebarReviewed"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.eliminateRebarReviewed === "No"}
                        value={formData.inspectionItems.eliminateRebarComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            eliminateRebarComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 7 */}
                    <div>
                      <RadioButtonGroup
                        label="Has an AHA/JHA/JSA or equivalent been completed and reviewed with potentially exposed employees?"
                        value={formData.inspectionItems.ahaCompleted as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            ahaCompleted: value,
                          }
                        })}
                        required
                        name="ahaCompleted"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.ahaCompleted === "No"}
                        value={formData.inspectionItems.ahaCompletedComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            ahaCompletedComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 8 */}
                    <div>
                      <RadioButtonGroup
                        label="Have you reviewed the possibility, within reason, to use engineering controls (such as raising the rebar ends above 6')? Note: Candy caning the rebar is not allowed by Cal OSHA."
                        value={formData.inspectionItems.engineeringControls as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            engineeringControls: value,
                          }
                        })}
                        required
                        name="engineeringControls"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.engineeringControls === "No"}
                        value={formData.inspectionItems.engineeringControlsComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            engineeringControlsComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 9 */}
                    <div>
                      <RadioButtonGroup
                        label="Has a reasonable attempt to isolate (administrative control) the work area behind caution tape been made?"
                        value={formData.inspectionItems.workAreaIsolated as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            workAreaIsolated: value,
                          }
                        })}
                        required
                        name="workAreaIsolated"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.workAreaIsolated === "No"}
                        value={formData.inspectionItems.workAreaIsolatedComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            workAreaIsolatedComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 10 */}
                    <div>
                      <RadioButtonGroup
                        label="Is WARNING signage posted?"
                        value={formData.inspectionItems.warningSignage as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            warningSignage: value,
                          }
                        })}
                        required
                        name="warningSignage"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.warningSignage === "No"}
                        value={formData.inspectionItems.warningSignageComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            warningSignageComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 11 */}
                    <div>
                      <RadioButtonGroup
                        label="Has the work area you control been inspected for impalement hazards prior to allowing access?"
                        value={formData.inspectionItems.workAreaInspected as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            workAreaInspected: value,
                          }
                        })}
                        required
                        name="workAreaInspected"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.workAreaInspected === "No"}
                        value={formData.inspectionItems.workAreaInspectedComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            workAreaInspectedComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 12 */}
                    <div>
                      <RadioButtonGroup
                        label="Were impalement protection devices replaced as needed during the proceeding shift or workday?"
                        value={formData.inspectionItems.devicesReplaced as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            devicesReplaced: value,
                          }
                        })}
                        required
                        name="devicesReplaced"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.devicesReplaced === "No"}
                        value={formData.inspectionItems.devicesReplacedComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            devicesReplacedComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 13 */}
                    <div>
                      <RadioButtonGroup
                        label="Have procedures been reviewed for the removal and replacement of impalement protection, where necessary, due to work?"
                        value={formData.inspectionItems.proceduresReviewed as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            proceduresReviewed: value,
                          }
                        })}
                        required
                        name="proceduresReviewed"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.proceduresReviewed === "No"}
                        value={formData.inspectionItems.proceduresReviewedComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            proceduresReviewedComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 14 */}
                    <div>
                      <RadioButtonGroup
                        label='Is there adequate impalement protection where work may be considered by Cal OSHA as "working above exposed rebar?"'
                        value={formData.inspectionItems.adequateProtection as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            adequateProtection: value,
                          }
                        })}
                        required
                        name="adequateProtection"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.adequateProtection === "No"}
                        value={formData.inspectionItems.adequateProtectionComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            adequateProtectionComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>

                    {/* Question 15 */}
                    <div>
                      <RadioButtonGroup
                        label="Have areas where rebar is stored been inspected for potential impalement hazards?"
                        value={formData.inspectionItems.rebarStorageInspected as "Yes" | "No" | "N/A" | ""}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            rebarStorageInspected: value,
                          }
                        })}
                        required
                        name="rebarStorageInspected"
                      />
                      <ConditionalTextArea
                        show={formData.inspectionItems.rebarStorageInspected === "No"}
                        value={formData.inspectionItems.rebarStorageComment}
                        onChange={(value) => setFormData({
                          ...formData,
                          inspectionItems: {
                            ...formData.inspectionItems,
                            rebarStorageComment: value,
                          }
                        })}
                        placeholder="Please provide additional details..."
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Safety Observations & Email Delivery Section */}
            <div className={`mb-10 ${currentStep === 3 ? 'block' : 'hidden'}`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Safety Observations & Email Delivery
                </h2>
                <p className="text-sm text-gray-500 mt-2">Step 3 of 3</p>
              </div>

              <div className="space-y-8">
                {/* Safety Observations Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Safety Observations
                    </h3>
                    <p className="text-sm text-gray-600">
                      Document any additional safety observations (optional)
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Safety Observation 1 <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.safetyObservations.observation1}
                        onChange={(e) => setFormData({
                          ...formData,
                          safetyObservations: {
                            ...formData.safetyObservations,
                            observation1: e.target.value,
                          }
                        })}
                        placeholder="Enter observation..."
                        maxLength={1000}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-gray-900"
                      />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {formData.safetyObservations.observation1.length}/1000 characters
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Safety Observation 2 <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.safetyObservations.observation2}
                        onChange={(e) => setFormData({
                          ...formData,
                          safetyObservations: {
                            ...formData.safetyObservations,
                            observation2: e.target.value,
                          }
                        })}
                        placeholder="Enter observation..."
                        maxLength={1000}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-gray-900"
                      />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {formData.safetyObservations.observation2.length}/1000 characters
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Safety Observation 3 <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.safetyObservations.observation3}
                        onChange={(e) => setFormData({
                          ...formData,
                          safetyObservations: {
                            ...formData.safetyObservations,
                            observation3: e.target.value,
                          }
                        })}
                        placeholder="Enter observation..."
                        maxLength={1000}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-gray-900"
                      />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {formData.safetyObservations.observation3.length}/1000 characters
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Delivery Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      Email Delivery
                    </h3>
                    <p className="text-sm text-gray-600">
                      This form will be emailed as a PDF
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Recipient Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={emailOptions.recipientEmail}
                        onChange={(e) => setEmailOptions({ ...emailOptions, recipientEmail: e.target.value })}
                        placeholder="superintendent@example.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CC Emails <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={emailOptions.ccEmails}
                        onChange={(e) => setEmailOptions({ ...emailOptions, ccEmails: e.target.value })}
                        placeholder="email1@example.com, email2@example.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900"
                      />
                      <p className="text-xs text-gray-700 font-medium mt-1">Separate multiple emails with commas</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Subject <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={emailOptions.emailSubject}
                        onChange={(e) => setEmailOptions({ ...emailOptions, emailSubject: e.target.value })}
                        placeholder={`Buck Sanders Inspection Survey Report - ${formData.jobNumber || '...'}`}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900">
                        Inspector Signature
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Sign below to certify this inspection report is accurate
                      </p>
                    </div>
                    <SignaturePad ref={signaturePadRef} required={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Error</h3>
                    <p className="text-sm text-gray-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              {currentStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="flex-1 py-4 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    Next →
                  </button>
                </>
              ) : currentStep === 2 ? (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-4 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    Next →
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-4 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                  >
                    ← Previous
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting & Emailing..." : "Submit & Email Form"}
                  </button>
                </>
              )}
            </div>

            {/* Saved Info Indicator - Below Buttons */}
            {hasSavedInfo && rememberMe && currentStep === 1 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Using saved information</p>
                    <p className="text-xs text-green-700 mt-1">
                      {formData.submittedBy && `${formData.submittedBy}`}
                      {formData.submittedByEmail && ` (${formData.submittedByEmail})`}
                      {formData.submittedByCompany && ` from ${formData.submittedByCompany}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSavedInfo}
                  className="text-xs text-green-700 hover:text-green-900 font-semibold underline whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>SubSpace - Construction Form Management</p>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-md w-full p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 border-2 border-green-500 mb-6">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Form Submitted Successfully
              </h3>

              {/* Message */}
              <p className="text-sm text-gray-600 mb-2">
                Your inspection report has been generated and emailed.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Sent to: <span className="font-medium text-gray-700">{successData.email}</span>
              </p>

              {/* Return Button */}
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors shadow-sm"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuckSandersForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-700">Loading form...</div>
        </div>
      </div>
    }>
      <BuckSandersFormContent />
    </Suspense>
  );
}
