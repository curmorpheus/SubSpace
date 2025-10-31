import jsPDF from "jspdf";

interface CompressedImage {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

interface InspectionData {
  startTime: string;
  endTime: string;
  location: string;
  locationPhotos?: CompressedImage[];
  hazardDescription: string;
  hazardPhotos?: CompressedImage[];
  correctiveMeasures: string;
  measuresPhotos?: CompressedImage[];
  creatingEmployer: string;
  supervisor: string;
}

interface FormData {
  date: string;
  inspections: InspectionData[];
  signature?: string;
}

interface SubmissionInfo {
  jobNumber: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedByCompany: string;
  submittedAt?: string;
}

/**
 * Helper function to add images to PDF
 * Returns the new Y position after adding images
 */
function addImagesToPDF(
  doc: jsPDF,
  images: CompressedImage[],
  yPosition: number,
  margin: number,
  pageWidth: number
): number {
  if (!images || images.length === 0) return yPosition;

  const imageWidth = 70; // Width of each image
  const imageHeight = 50; // Height of each image
  const imageSpacing = 10; // Space between images
  const imagesPerRow = 2;
  const pageHeight = doc.internal.pageSize.getHeight();

  let currentY = yPosition;

  for (let i = 0; i < images.length; i++) {
    const col = i % imagesPerRow;
    const xPosition = margin + col * (imageWidth + imageSpacing);

    // Check if we need a new page
    if (currentY + imageHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    try {
      // Add the image
      doc.addImage(images[i].dataUrl, "JPEG", xPosition, currentY, imageWidth, imageHeight);

      // Add image number label
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Photo ${i + 1}`, xPosition, currentY + imageHeight + 4);
      doc.setTextColor(0, 0, 0);
    } catch (error) {
      console.error(`Error adding image ${i + 1} to PDF:`, error);
    }

    // Move to next row if needed
    if (col === imagesPerRow - 1 || i === images.length - 1) {
      currentY += imageHeight + 8;
    }
  }

  return currentY + 5; // Add extra spacing after images
}

export function generateImpalementProtectionPDF(
  submissionInfo: SubmissionInfo,
  formData: FormData
): Buffer {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 15;

  // Helper function to add a section header with background
  const addSectionHeader = (text: string, y: number): number => {
    // Draw orange background with subtle gradient effect
    doc.setFillColor(249, 115, 22); // Orange-500
    doc.roundedRect(margin, y - 4, contentWidth, 8, 1, 1, "F");

    // Add white text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin + 2, y + 1);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    return y + 8;
  };

  // Helper function to add a field with label - consistent formatting
  const addField = (label: string, value: string, y: number, bold: boolean = false): number => {
    // Label styling - consistent across all fields
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);

    // Value styling
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(value, contentWidth - 3);
    doc.text(lines, margin, y + 3.5);

    return y + (lines.length * 4) + 5;
  };

  // Title Banner - lighter and more compact
  doc.setFillColor(249, 115, 22); // Orange-500
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("IMPALEMENT PROTECTION FORM", margin, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Safety Inspection Report", pageWidth - margin, 12, { align: "right" });

  doc.setTextColor(0, 0, 0);
  yPosition = 25;

  // Form Information Section
  yPosition = addSectionHeader("Form Information", yPosition);

  // Two-column layout for basic info - consistent formatting
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  let infoY = yPosition;

  // Column 1 - Job Number
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFont("helvetica", "bold");
  doc.text("Job Number", col1X, infoY);
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(submissionInfo.jobNumber, col1X, infoY + 4);

  // Column 2 - Inspection Date
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFont("helvetica", "bold");
  doc.text("Inspection Date", col2X, infoY);
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(formData.date, col2X, infoY + 4);

  infoY += 9;

  // Column 1 - Submitted By
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFont("helvetica", "bold");
  doc.text("Submitted By", col1X, infoY);
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.submittedBy, col1X, infoY + 4);

  // Column 2 - Email
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFont("helvetica", "bold");
  doc.text("Email", col2X, infoY);
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.submittedByEmail, col2X, infoY + 4);

  infoY += 9;

  // Column 1 - Company
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.setFont("helvetica", "bold");
  doc.text("Company", col1X, infoY);
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.submittedByCompany, col1X, infoY + 4);

  yPosition = infoY + 11;

  // Inspections
  formData.inspections.forEach((inspection, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Inspection Header
    yPosition = addSectionHeader(`Inspection Details #${index + 1}`, yPosition);

    // Time Information - consistent formatting
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont("helvetica", "bold");
    doc.text("Start Time", col1X, yPosition);
    doc.text("End Time", col2X, yPosition);

    doc.setTextColor(31, 41, 55); // Gray-800
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(inspection.startTime, col1X, yPosition + 3.5);
    doc.text(inspection.endTime, col2X, yPosition + 3.5);
    yPosition += 9;

    // Location
    yPosition = addField("Location of Inspection", inspection.location, yPosition, true);

    // Add location photos if available
    if (inspection.locationPhotos && inspection.locationPhotos.length > 0) {
      if (yPosition > pageHeight - 70) {
        doc.addPage();
        yPosition = 20;
      }
      yPosition = addImagesToPDF(doc, inspection.locationPhotos, yPosition, margin, pageWidth);
    }

    // Check for new page before hazard section
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Hazard Description
    yPosition = addField("Description of Impalement Hazard Observed", inspection.hazardDescription, yPosition);

    // Add hazard photos if available
    if (inspection.hazardPhotos && inspection.hazardPhotos.length > 0) {
      if (yPosition > pageHeight - 70) {
        doc.addPage();
        yPosition = 20;
      }
      yPosition = addImagesToPDF(doc, inspection.hazardPhotos, yPosition, margin, pageWidth);
    }

    // Check for new page before corrective measures
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Corrective Measures
    yPosition = addField("Corrective Measures Taken", inspection.correctiveMeasures, yPosition);

    // Add corrective measures photos if available
    if (inspection.measuresPhotos && inspection.measuresPhotos.length > 0) {
      if (yPosition > pageHeight - 70) {
        doc.addPage();
        yPosition = 20;
      }
      yPosition = addImagesToPDF(doc, inspection.measuresPhotos, yPosition, margin, pageWidth);
    }

    // Check for new page before employer info
    if (yPosition > pageHeight - 25) {
      doc.addPage();
      yPosition = 20;
    }

    // Employer Information
    yPosition = addField("Creating/Exposing Employer(s)", inspection.creatingEmployer, yPosition);
    yPosition = addField("Supervisor of Creating/Exposing Employer(s)", inspection.supervisor, yPosition);

    yPosition += 5;
  });

  // Add signature if available
  if (formData.signature) {
    // Check if we need a new page for signature
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Inspector Signature:`, margin, yPosition);
    yPosition += 5;

    try {
      doc.addImage(formData.signature, "PNG", margin, yPosition, 60, 20);
      yPosition += 25;
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
    }
  }

  // Add footer with timestamp
  if (submissionInfo.submittedAt) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    const footerText = `Submitted: ${new Date(
      submissionInfo.submittedAt
    ).toLocaleString()}`;
    doc.text(
      footerText,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
