"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";

const CACHE_KEY = "subspace-form-cache";

export default function ImpalementProtectionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

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
      startTime: isClient ? getCurrentTime() : "",
      endTime: isClient ? getTimeAfter10Minutes() : "",
      location: "",
      hazardDescription: "",
      correctiveMeasures: "",
      creatingEmployer: "",
      supervisor: "",
    };
  });

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
      emailSubject: "",
    };
  });

  // Set date/time values after mount to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => {
      // Only update if values are actually empty to avoid unnecessary re-renders
      const needsUpdate = !prev.date || !prev.startTime || !prev.endTime;
      if (!needsUpdate) return prev;

      return {
        ...prev,
        date: prev.date || getTodayDate(),
        startTime: prev.startTime || getCurrentTime(),
        endTime: prev.endTime || getTimeAfter10Minutes(),
      };
    });
  }, []);

  const validateStep = (step: number): boolean => {
    setError("");

    if (step === 1) {
      if (!formData.date || !formData.jobNumber || !formData.submittedBy ||
          !formData.submittedByEmail || !formData.submittedByCompany) {
        setError("Please fill in all required fields");
        return false;
      }
    } else if (step === 2) {
      if (!formData.startTime || !formData.endTime || !formData.location ||
          !formData.hazardDescription || !formData.correctiveMeasures ||
          !formData.creatingEmployer || !formData.supervisor) {
        setError("Please fill in all inspection details");
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
      setCurrentStep(current => Math.min(current + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(current => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Final validation
    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        formType: "impalement-protection",
        jobNumber: formData.jobNumber,
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByCompany: formData.submittedByCompany,
        data: {
          date: formData.date,
          inspections: [{
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location,
            hazardDescription: formData.hazardDescription,
            correctiveMeasures: formData.correctiveMeasures,
            creatingEmployer: formData.creatingEmployer,
            supervisor: formData.supervisor,
          }],
        },
        emailOptions: {
          recipientEmail: emailOptions.recipientEmail,
          emailSubject: emailOptions.emailSubject || `Impalement Protection Form - Job #${formData.jobNumber}`,
        },
      };

      const endpoint = "/api/forms/submit-and-email";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

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

      alert(`Form submitted and emailed successfully! Submission ID: ${result.id}\nEmail sent to: ${emailOptions.recipientEmail}`);

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 sm:px-8 py-6">
            <button
              onClick={() => router.push("/")}
              className="text-orange-100 hover:text-white mb-4 text-sm font-medium inline-flex items-center transition-colors"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Impalement Protection
            </h1>
            <p className="text-orange-100 mt-2 text-lg">
              Safety Inspection Form
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Indicator */}
          <div className="bg-gray-50 px-6 sm:px-8 py-6 border-b-2 border-gray-200">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                    currentStep === step
                      ? 'bg-orange-500 text-white scale-110 shadow-lg'
                      : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? '✓' : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 transition-all ${
                      currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <p className="text-sm font-semibold text-gray-700">
                Step {currentStep} of {totalSteps}:{' '}
                {currentStep === 1 && 'Basic Information'}
                {currentStep === 2 && 'Inspection Details'}
                {currentStep === 3 && 'Email Delivery'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10">

            {/* Step 1: Basic Information Section */}
            <div className={`mb-8 ${currentStep === 1 ? 'block' : 'hidden'}`}>
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-lg">1</span>
                </div>
                <h2 className="ml-4 text-2xl font-bold text-gray-900">
                  Basic Information
                </h2>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Inspection Details Section */}
            <div className={`mb-8 ${currentStep === 2 ? 'block' : 'hidden'}`}>
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">2</span>
                </div>
                <h2 className="ml-4 text-2xl font-bold text-gray-900">
                  Inspection Details
                </h2>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-6 sm:p-8">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <TimePicker
                      value={formData.startTime}
                      onChange={(time) => setFormData({ ...formData, startTime: time })}
                      label="Start Time"
                      required
                    />

                    <TimePicker
                      value={formData.endTime}
                      onChange={(time) => setFormData({ ...formData, endTime: time })}
                      label="End Time"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location of Inspection <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Building A, 3rd Floor, North Wing"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description of Impalement Hazard Observed <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.hazardDescription}
                      onChange={(e) => setFormData({ ...formData, hazardDescription: e.target.value })}
                      placeholder="Describe the hazard in detail..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Corrective Measures Taken <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.correctiveMeasures}
                      onChange={(e) => setFormData({ ...formData, correctiveMeasures: e.target.value })}
                      placeholder="Describe what actions were taken to address the hazard..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Creating/Exposing Employer(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.creatingEmployer}
                      onChange={(e) => setFormData({ ...formData, creatingEmployer: e.target.value })}
                      placeholder="Company name(s)"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Supervisor of Creating/Exposing Employer(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supervisor}
                      onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                      placeholder="Supervisor name"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Email Delivery Section */}
            <div className={`space-y-8 ${currentStep === 3 ? 'block' : 'hidden'}`}>
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">3</span>
                </div>
                <h2 className="ml-4 text-2xl font-bold text-gray-900">
                  Email Delivery
                </h2>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-2xl p-6 sm:p-8">
                <div className="mb-6">
                  <p className="text-base font-semibold text-gray-900 mb-2">
                    📧 This form will be emailed as a PDF
                  </p>
                  <p className="text-sm text-gray-600">
                    Enter the recipient&apos;s email address below to receive the completed inspection form
                  </p>
                </div>

                <div className="space-y-5 bg-white rounded-xl p-6 border-2 border-green-200">
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
                        Email Subject <span className="text-gray-500 text-xs">(Optional)</span>
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
              </div>
            </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
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
                    className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                  >
                    Next →
                  </button>
                </>
              ) : currentStep === 2 ? (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-lg"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                  >
                    Next →
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-lg"
                  >
                    ← Previous
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting & Emailing..." : "Submit & Email Form"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>SubSpace - Construction Form Management</p>
        </div>
      </div>
    </div>
  );
}
