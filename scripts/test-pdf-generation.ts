import { generateBuckSandersPDF } from '../lib/pdf-generator';
import fs from 'fs';
import path from 'path';

// Submission information
const submissionInfo = {
  jobNumber: "2024-1234",
  submittedBy: "John Smith",
  submittedByEmail: "john.smith@example.com",
  submittedByCompany: "ABC Construction Co.",
  submittedAt: new Date().toISOString()
};

// Sample form data for testing - Buck Sanders format
const sampleFormData = {
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  whoCompleting: "John Smith",
  location: "Building A - East Wing Construction Site",
  inspectedWith: "Mike Johnson, Safety Supervisor",
  generalHazardManagement: {
    ahasAvailable: "Yes" as const,
    ahasAvailableComment: "All AHAs are current and available on-site",
    ahasReviewedWithEmployees: "Yes" as const,
    ahasReviewedComment: "Reviewed during morning safety briefing",
    discussedInMeetings: "Yes" as const,
    discussedInMeetingsComment: "Covered in weekly safety meeting"
  },
  inspectionItems: {
    generalComments: "Yes" as const,
    generalCommentsText: "Site conditions are generally good with proper safety measures in place.",
    generalSitePhotos: "Yes" as const,
    sitePhotos: [
      {
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        size: 100,
        width: 800,
        height: 600
      }
    ],
    eliminateRebarReviewed: "Yes" as const,
    eliminateRebarComment: "All exposed rebar has been capped with orange mushroom caps",
    ahaCompleted: "Yes" as const,
    ahaCompletedComment: "AHA completed and signed by crew",
    engineeringControls: "Yes" as const,
    engineeringControlsComment: "Guardrails and barricades installed",
    workAreaIsolated: "Yes" as const,
    workAreaIsolatedComment: "Work zones properly barricaded",
    warningSignage: "Yes" as const,
    warningSignageComment: "Warning signs posted at all entry points",
    workAreaInspected: "Yes" as const,
    workAreaInspectedComment: "Daily pre-work inspection completed",
    devicesReplaced: "Yes" as const,
    devicesReplacedComment: "All protection devices maintained and replaced as needed",
    proceduresReviewed: "Yes" as const,
    proceduresReviewedComment: "Safety procedures reviewed with all crew members",
    adequateProtection: "Yes" as const,
    adequateProtectionComment: "All identified hazards have appropriate protection measures",
    rebarStorageInspected: "Yes" as const,
    rebarStorageComment: "Storage area organized with all materials properly capped"
  },
  safetyObservations: {
    observation1: "Crew demonstrated excellent awareness of impalement hazards and proper use of PPE.",
    observation2: "Recommend additional mushroom caps be ordered for next phase of construction.",
    observation3: "Overall site safety culture is strong with good communication between trades."
  },
  signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
};

function testPDFGeneration() {
  try {
    console.log('Generating PDF with Apple aesthetic...');

    const pdfBuffer = generateBuckSandersPDF(submissionInfo, sampleFormData);

    // Save to local file
    const outputPath = path.join(__dirname, '..', 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generated successfully!`);
    console.log(`📄 Saved to: ${outputPath}`);
    console.log(`\nYou can now open this file to review the Apple aesthetic design.`);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

testPDFGeneration();
