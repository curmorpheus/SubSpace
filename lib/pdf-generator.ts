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
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Helper function to add a section header with background
  const addSectionHeader = (text: string, y: number): number => {
    // Draw orange background
    doc.setFillColor(249, 115, 22); // Orange-500
    doc.roundedRect(margin, y - 6, contentWidth, 12, 2, 2, "F");

    // Add white text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin + 4, y + 2);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    return y + 15;
  };

  // Helper function to add a field with label
  const addField = (label: string, value: string, y: number, bold: boolean = false): number => {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(value, contentWidth - 5);
    doc.text(lines, margin, y + 4);

    return y + (lines.length * 5) + 6;
  };

  // Title Banner
  doc.setFillColor(249, 115, 22); // Orange-500
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("IMPALEMENT PROTECTION", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Safety Inspection Form", pageWidth / 2, 25, { align: "center" });

  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  // Form Information Section
  yPosition = addSectionHeader("FORM INFORMATION", yPosition);

  // Two-column layout for basic info
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");

  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  let infoY = yPosition;

  // Column 1
  doc.text("Job Number:", col1X, infoY);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(submissionInfo.jobNumber, col1X, infoY + 5);

  // Column 2
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  doc.text("Inspection Date:", col2X, infoY);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(formData.date, col2X, infoY + 5);

  infoY += 12;

  // Submitted by
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  doc.text("Submitted By:", col1X, infoY);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.submittedBy, col1X, infoY + 5);

  // Email
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  doc.text("Email:", col2X, infoY);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.submittedByEmail, col2X, infoY + 5);

  infoY += 12;

  // Company
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "bold");
  doc.text("Company:", col1X, infoY);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.submittedByCompany, col1X, infoY + 5);

  yPosition = infoY + 15;

  // Inspections
  formData.inspections.forEach((inspection, index) => {
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    // Inspection Header
    yPosition = addSectionHeader(`INSPECTION DETAILS #${index + 1}`, yPosition);

    // Time Information
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text("Start Time:", col1X, yPosition);
    doc.text("End Time:", col2X, yPosition);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(inspection.startTime, col1X, yPosition + 4);
    doc.text(inspection.endTime, col2X, yPosition + 4);
    yPosition += 12;

    // Location
    yPosition = addField("LOCATION OF INSPECTION", inspection.location, yPosition, true);

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
    yPosition = addField("DESCRIPTION OF IMPALEMENT HAZARD OBSERVED", inspection.hazardDescription, yPosition);

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
    yPosition = addField("CORRECTIVE MEASURES TAKEN", inspection.correctiveMeasures, yPosition);

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
    yPosition = addField("CREATING/EXPOSING EMPLOYER(S)", inspection.creatingEmployer, yPosition);
    yPosition = addField("SUPERVISOR OF CREATING/EXPOSING EMPLOYER(S)", inspection.supervisor, yPosition);

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
