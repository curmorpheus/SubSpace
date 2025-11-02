"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import ImageUpload from "@/components/ImageUpload";
import SignaturePad, { SignaturePadRef } from "@/components/SignaturePad";
import VoiceInputButton from "@/components/VoiceInputButton";
import type { CompressedImage } from "@/lib/image-compression";
import {
  queueSubmission,
  getPendingCount,
  processPendingSubmissions,
} from "@/lib/offline-storage";

const CACHE_KEY = "subspace-form-cache";

// Generate unique ID for inspections
const generateInspectionId = () => `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function ImpalementProtectionFormContent() {
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

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get current time + 10 minutes in HH:mm format
  const getTimeAfter10Minutes = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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
      jobNumber: cached.jobNumber || "",
      submittedBy: cached.submittedBy || "",
      submittedByEmail: cached.submittedByEmail || "",
      submittedByCompany: cached.submittedByCompany || "",
      inspections: [
        {
          id: generateInspectionId(),
          startTime: isClient ? getCurrentTime() : "",
          endTime: isClient ? getTimeAfter10Minutes() : "",
          location: "",
          hazardDescription: "",
          correctiveMeasures: "",
          creatingEmployer: "",
          supervisor: "",
          locationPhotos: [],
          hazardPhotos: [],
          measuresPhotos: [],
          noHazardsObserved: false,
        }
      ],
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
    };
  });

  // Set date/time values after mount to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => {
      // Only update if values are actually empty to avoid unnecessary re-renders
      const needsUpdate = !prev.date || (prev.inspections[0] && (!prev.inspections[0].startTime || !prev.inspections[0].endTime));
      if (!needsUpdate) return prev;

      return {
        ...prev,
        date: prev.date || getTodayDate(),
        inspections: prev.inspections.map((inspection, index) =>
          index === 0 ? {
            ...inspection,
            startTime: inspection.startTime || getCurrentTime(),
            endTime: inspection.endTime || getTimeAfter10Minutes(),
          } : inspection
        )
      };
    });
  }, []);

  // Read job number, superintendent email, and subcontractor info from URL parameters
  useEffect(() => {
    const jobNumberParam = searchParams.get('jobNumber');
    const superintendentEmailParam = searchParams.get('superintendentEmail');
    const nameParam = searchParams.get('name');
    const emailParam = searchParams.get('email');
    const companyParam = searchParams.get('company');

    if (jobNumberParam) {
      setFormData(prev => ({
        ...prev,
        jobNumber: jobNumberParam,
      }));
    }

    // Pre-fill subcontractor info from invitation link
    if (nameParam) {
      setFormData(prev => ({
        ...prev,
        submittedBy: nameParam,
      }));
    }

    if (emailParam) {
      setFormData(prev => ({
        ...prev,
        submittedByEmail: emailParam,
      }));
    }

    if (companyParam) {
      setFormData(prev => ({
        ...prev,
        submittedByCompany: companyParam,
      }));
    }

    if (superintendentEmailParam) {
      setFormData(prev => ({
        ...prev,
        recipientEmail: superintendentEmailParam,
      }));
    }
  }, [searchParams]);

  // Inspection management functions
  const addInspection = () => {
    setFormData(prev => ({
      ...prev,
      inspections: [
        ...prev.inspections,
        {
          id: generateInspectionId(),
          startTime: getCurrentTime(),
          endTime: getTimeAfter10Minutes(),
          location: "",
          hazardDescription: "",
          correctiveMeasures: "",
          creatingEmployer: "",
          supervisor: "",
          locationPhotos: [],
          hazardPhotos: [],
          measuresPhotos: [],
          noHazardsObserved: false,
        }
      ]
    }));
  };

  const updateInspection = (inspectionId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      inspections: prev.inspections.map(inspection =>
        inspection.id === inspectionId
          ? { ...inspection, [field]: value }
          : inspection
      )
    }));
  };

  const deleteInspection = (inspectionId: string) => {
    setFormData(prev => {
      // Don't allow deleting if only one inspection remains
      if (prev.inspections.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        inspections: prev.inspections.filter(inspection => inspection.id !== inspectionId)
      };
    });
  };

  const validateStep = (step: number): boolean => {
    setError("");

    if (step === 1) {
      if (!formData.date || !formData.jobNumber || !formData.submittedBy ||
          !formData.submittedByEmail || !formData.submittedByCompany) {
        setError("Please fill in all required fields");
        return false;
      }
    } else if (step === 2) {
      // Validate all inspections
      if (!formData.inspections || formData.inspections.length === 0) {
        setError("At least one inspection is required");
        return false;
      }

      for (let i = 0; i < formData.inspections.length; i++) {
        const inspection = formData.inspections[i];
        const hazardsPresent = !inspection.noHazardsObserved;

        // Time and location are always required
        if (!inspection.startTime || !inspection.endTime || !inspection.location) {
          setError(`Please fill in time and location for Inspection #${i + 1}`);
          return false;
        }

        // Only validate these fields if hazards were actually observed
        if (hazardsPresent) {
          if (!inspection.hazardDescription || inspection.hazardDescription.trim() === '') {
            setError(`Please describe the hazard for Inspection #${i + 1}`);
            return false;
          }
          if (!inspection.correctiveMeasures || inspection.correctiveMeasures.trim() === '') {
            setError(`Please describe corrective measures for Inspection #${i + 1}`);
            return false;
          }
          if (!inspection.creatingEmployer || inspection.creatingEmployer.trim() === '') {
            setError(`Please provide the creating employer for Inspection #${i + 1}`);
            return false;
          }
          if (!inspection.supervisor || inspection.supervisor.trim() === '') {
            setError(`Please provide the supervisor name for Inspection #${i + 1}`);
            return false;
          }
        }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset the flag after a short delay to prevent accidental submission
      setTimeout(() => {
        setJustNavigated(false);
      }, 500);
    }
  };

  const handlePrevious = () => {
    setJustNavigated(true);
    setCurrentStep(current => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset the flag after a short delay
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

  const handleTestAutofill = () => {
    setFormData({
      date: getTodayDate(),
      jobNumber: "TEST-2025-001",
      submittedBy: "Test User",
      submittedByEmail: "test@deacon.com",
      submittedByCompany: "Deacon Construction",
      inspections: [{
        id: generateInspectionId(),
        startTime: "08:00",
        endTime: "08:15",
        location: "Building A, 3rd Floor, North Wing",
        hazardDescription: "Exposed rebar on concrete slab near north stairwell. Multiple vertical rebars without protective caps.",
        correctiveMeasures: "Installed protective rebar caps on all exposed vertical rebars. Posted warning signs around the area.",
        creatingEmployer: "ABC Concrete Co.",
        supervisor: "John Smith",
        locationPhotos: [],
        hazardPhotos: [],
        measuresPhotos: [],
        noHazardsObserved: false,
      }],
    });
    setEmailOptions({
      recipientEmail: "curt.mills@deacon.com",
      ccEmails: "",
      emailSubject: "TEST - Impalement Protection Form - Job #TEST-2025-001",
    });
    setCurrentStep(3);
    alert("Form autofilled with test data! Click 'Submit & Email Form' to test.");
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
        submittedAtLocal, // Local device time
        signature, // Inspector signature (optional)
        data: {
          date: formData.date,
          inspections: formData.inspections,
        },
        emailOptions: {
          recipientEmail: emailOptions.recipientEmail,
          ccEmails: emailOptions.ccEmails,
          emailSubject: emailOptions.emailSubject || `Impalement Protection Form - Job #${formData.jobNumber}`,
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
              Impalement Protection
            </h1>
            <p className="text-gray-600 mt-2 text-base font-normal">
              Safety Inspection Form
            </p>
            <div className="mt-4 flex items-center gap-2 text-gray-500">
              <span className="text-sm">Estimated time: 5-10 minutes</span>
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
                    Impalement Inspection
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

        {/* Voice Input Indicator - Mobile Only */}
        <div className="md:hidden bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Voice input available
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Use your device&apos;s microphone to fill out text fields
              </p>
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
                {currentStep === 2 && `Inspection Details · ${formData.inspections.length} ${formData.inspections.length === 1 ? 'inspection' : 'inspections'}`}
                {currentStep === 3 && 'Email Delivery'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DatePicker
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    label="Inspection Date"
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.jobNumber}
                      onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                      placeholder="e.g., 2025-001"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.submittedBy}
                    onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.submittedByEmail}
                    onChange={(e) => setFormData({ ...formData, submittedByEmail: e.target.value })}
                    placeholder="john@company.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.submittedByCompany}
                    onChange={(e) => setFormData({ ...formData, submittedByCompany: e.target.value })}
                    placeholder="Company Name"
                    autoComplete="organization"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Inspection Details Section */}
            <div className={`mb-10 ${currentStep === 2 ? 'block' : 'hidden'}`}>
              <div className="mb-8">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Inspection Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                      Step 2 of 3 · {formData.inspections.length} {formData.inspections.length === 1 ? 'inspection' : 'inspections'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {formData.inspections.map((inspection, index) => (
                  <div key={inspection.id} className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                      <h3 className="text-base font-semibold text-gray-900">
                        Inspection {index + 1}
                      </h3>
                      {formData.inspections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteInspection(inspection.id)}
                          className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <TimePicker
                          value={inspection.startTime}
                          onChange={(time) => updateInspection(inspection.id, 'startTime', time)}
                          label="Start Time"
                          required
                        />

                        <TimePicker
                          value={inspection.endTime}
                          onChange={(time) => updateInspection(inspection.id, 'endTime', time)}
                          label="End Time"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Location of Inspection <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={inspection.location}
                            onChange={(e) => updateInspection(inspection.id, 'location', e.target.value)}
                            placeholder="e.g., Building A, 3rd Floor, North Wing"
                            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                          />
                          <VoiceInputButton
                            currentValue={inspection.location}
                            onTranscript={(text) => updateInspection(inspection.id, 'location', text)}
                          />
                        </div>

                        <div className="mt-3">
                          <ImageUpload
                            label="Location Photos (Optional)"
                            images={inspection.locationPhotos}
                            onChange={(photos) => updateInspection(inspection.id, 'locationPhotos', photos)}
                            maxImages={3}
                            maxSizeMB={5}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description of Impalement Hazard Observed <span className="text-red-500">*</span>
                        </label>

                        {/* Quick option for no hazards */}
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inspection.noHazardsObserved}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateInspection(inspection.id, 'noHazardsObserved', checked);
                                if (checked) {
                                  updateInspection(inspection.id, 'hazardDescription', 'There were no impalement hazards observed during this inspection.');
                                  updateInspection(inspection.id, 'correctiveMeasures', 'N/A - No hazards present');
                                } else {
                                  updateInspection(inspection.id, 'hazardDescription', '');
                                  updateInspection(inspection.id, 'correctiveMeasures', '');
                                }
                              }}
                              className="mt-0.5 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">No impalement hazards observed</span>
                              <p className="text-xs text-gray-600 mt-1">
                                Check this if no hazards were found during inspection
                              </p>
                            </div>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <textarea
                            {...(!inspection.noHazardsObserved && { required: true })}
                            rows={4}
                            value={inspection.hazardDescription}
                            onChange={(e) => {
                              updateInspection(inspection.id, 'hazardDescription', e.target.value);
                              if (inspection.noHazardsObserved) {
                                updateInspection(inspection.id, 'noHazardsObserved', false);
                              }
                            }}
                            placeholder="Describe the hazard in detail..."
                            disabled={inspection.noHazardsObserved}
                            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                          />
                          {!inspection.noHazardsObserved && (
                            <VoiceInputButton
                              currentValue={inspection.hazardDescription}
                              onTranscript={(text) => updateInspection(inspection.id, 'hazardDescription', text)}
                            />
                          )}
                        </div>

                        <div className="mt-3">
                          <ImageUpload
                            label="Hazard Photos (Optional)"
                            images={inspection.hazardPhotos}
                            onChange={(photos) => updateInspection(inspection.id, 'hazardPhotos', photos)}
                            maxImages={5}
                            maxSizeMB={8}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Corrective Measures Taken {inspection.noHazardsObserved ? (
                            <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                          ) : (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            {...(!inspection.noHazardsObserved && { required: true })}
                            rows={4}
                            value={inspection.correctiveMeasures}
                            onChange={(e) => {
                              updateInspection(inspection.id, 'correctiveMeasures', e.target.value);
                              if (inspection.noHazardsObserved && e.target.value !== "N/A - No hazards present") {
                                updateInspection(inspection.id, 'noHazardsObserved', false);
                              }
                            }}
                            placeholder="Describe what actions were taken to address the hazard..."
                            disabled={inspection.noHazardsObserved}
                            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                          />
                          {!inspection.noHazardsObserved && (
                            <VoiceInputButton
                              currentValue={inspection.correctiveMeasures}
                              onTranscript={(text) => updateInspection(inspection.id, 'correctiveMeasures', text)}
                            />
                          )}
                        </div>

                        <div className="mt-3">
                          <ImageUpload
                            label="After Photos (Optional)"
                            images={inspection.measuresPhotos}
                            onChange={(photos) => updateInspection(inspection.id, 'measuresPhotos', photos)}
                            maxImages={5}
                            maxSizeMB={8}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Creating/Exposing Employer(s) {inspection.noHazardsObserved ? (
                            <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                          ) : (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          {...(!inspection.noHazardsObserved && { required: true })}
                          value={inspection.creatingEmployer}
                          onChange={(e) => updateInspection(inspection.id, 'creatingEmployer', e.target.value)}
                          placeholder="Company name(s)"
                          disabled={inspection.noHazardsObserved}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Supervisor of Creating/Exposing Employer(s) {inspection.noHazardsObserved ? (
                            <span className="text-gray-700 text-xs font-medium">(Optional)</span>
                          ) : (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          {...(!inspection.noHazardsObserved && { required: true })}
                          value={inspection.supervisor}
                          onChange={(e) => updateInspection(inspection.id, 'supervisor', e.target.value)}
                          placeholder="Supervisor name"
                          disabled={inspection.noHazardsObserved}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Inspection Button */}
                <button
                  type="button"
                  onClick={addInspection}
                  className="w-full py-4 px-6 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  Add Another Inspection
                </button>
              </div>
            </div>

            {/* Step 3: Email Delivery Section */}
            <div className={`mb-10 ${currentStep === 3 ? 'block' : 'hidden'}`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Email Delivery
                </h2>
                <p className="text-sm text-gray-500 mt-2">Step 3 of 3</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    This form will be emailed as a PDF
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter the recipient&apos;s email address below to receive the completed inspection form
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
                        placeholder={`Impalement Protection Form - Job #${formData.jobNumber || '...'}`}
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
          <p>
            SubSpace
            <sup
              onClick={handleTestAutofill}
              className="cursor-pointer hover:text-gray-700 transition-colors"
              title="Test Mode"
            >
              ™
            </sup>
            {" "}- Construction Form Management
          </p>
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

export default function ImpalementProtectionForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-700">Loading form...</div>
        </div>
      </div>
    }>
      <ImpalementProtectionFormContent />
    </Suspense>
  );
}
