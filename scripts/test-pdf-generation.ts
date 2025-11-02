import { generateImpalementProtectionPDF } from '../lib/pdf-generator';
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

// Sample form data for testing
const sampleFormData = {
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  inspections: [
    {
      startTime: "08:00",
      endTime: "08:30",
      location: "Building A - East Wing, 2nd Floor Deck",
      locationPhotos: [
        {
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          size: 100,
          width: 800,
          height: 600
        }
      ],
      hazardDescription: "Exposed vertical rebar along the perimeter edge, approximately 15 stakes ranging from 18-24 inches in height. Stakes are uncapped and pose fall hazard risk.",
      hazardPhotos: [
        {
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          size: 100,
          width: 800,
          height: 600
        },
        {
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          size: 100,
          width: 800,
          height: 600
        }
      ],
      correctiveMeasures: "All exposed rebar to be capped with orange mushroom caps. Work to be completed by end of day.",
      measuresPhotos: [
        {
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          size: 100,
          width: 800,
          height: 600
        }
      ],
      creatingEmployer: "Steel Dynamics LLC",
      supervisor: "Mike Johnson - (555) 123-4567"
    },
    {
      startTime: "09:00",
      endTime: "09:15",
      location: "Building B - North Entrance Foundation",
      hazardDescription: "Ground-level anchor bolts protruding 6-8 inches from concrete foundation. Total of 8 bolts require protective caps.",
      hazardPhotos: [
        {
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          size: 100,
          width: 800,
          height: 600
        }
      ],
      correctiveMeasures: "Install protective caps on all 8 anchor bolts. Estimated completion: 2 hours.",
      creatingEmployer: "Foundation Pro Services",
      supervisor: "Sarah Williams - (555) 987-6543"
    },
    {
      startTime: "10:00",
      endTime: "10:10",
      location: "Parking Structure - Level 3",
      hazardDescription: "No impalement hazards observed. Area clear and safe.",
      correctiveMeasures: "None required.",
      creatingEmployer: "N/A",
      supervisor: "N/A"
    }
  ],
  signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
};

function testPDFGeneration() {
  try {
    console.log('Generating PDF with Apple aesthetic...');

    const pdfBuffer = generateImpalementProtectionPDF(submissionInfo, sampleFormData);

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
