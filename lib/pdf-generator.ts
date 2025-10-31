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
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("IMPALEMENT PROTECTION INSPECTION FORM", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 15;

  // Header Information
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Date: ${formData.date}`, margin, yPosition);
  doc.text(`Job #: ${submissionInfo.jobNumber}`, pageWidth / 2, yPosition);
  yPosition += 7;

  doc.text(`Submitted by: ${submissionInfo.submittedBy}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Email: ${submissionInfo.submittedByEmail}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Company: ${submissionInfo.submittedByCompany}`, margin, yPosition);
  yPosition += 10;

  // Draw line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Inspections
  formData.inspections.forEach((inspection, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Inspection #${index + 1}`, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Start Time: ${inspection.startTime}`, margin, yPosition);
    doc.text(`End Time: ${inspection.endTime}`, pageWidth / 2, yPosition);
    yPosition += 7;

    doc.text(`Location of inspection:`, margin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    const locationLines = doc.splitTextToSize(inspection.location, contentWidth);
    doc.text(locationLines, margin + 5, yPosition);
    yPosition += locationLines.length * 5 + 3;

    // Add location photos if available
    if (inspection.locationPhotos && inspection.locationPhotos.length > 0) {
      yPosition = addImagesToPDF(doc, inspection.locationPhotos, yPosition, margin, pageWidth);
    }

    doc.setFont("helvetica", "normal");
    doc.text(`Description of Impalement Hazard Observed:`, margin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    const hazardLines = doc.splitTextToSize(
      inspection.hazardDescription,
      contentWidth
    );
    doc.text(hazardLines, margin + 5, yPosition);
    yPosition += hazardLines.length * 5 + 3;

    // Add hazard photos if available
    if (inspection.hazardPhotos && inspection.hazardPhotos.length > 0) {
      yPosition = addImagesToPDF(doc, inspection.hazardPhotos, yPosition, margin, pageWidth);
    }

    doc.setFont("helvetica", "normal");
    doc.text(`Corrective Measures Taken:`, margin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    const measuresLines = doc.splitTextToSize(
      inspection.correctiveMeasures,
      contentWidth
    );
    doc.text(measuresLines, margin + 5, yPosition);
    yPosition += measuresLines.length * 5 + 3;

    // Add corrective measures photos if available
    if (inspection.measuresPhotos && inspection.measuresPhotos.length > 0) {
      yPosition = addImagesToPDF(doc, inspection.measuresPhotos, yPosition, margin, pageWidth);
    }

    doc.setFont("helvetica", "normal");
    doc.text(`Creating/Exposing Employer(s):`, margin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    doc.text(inspection.creatingEmployer, margin + 5, yPosition);
    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Supervisor of Creating/Exposing Employer(s):`, margin, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    doc.text(inspection.supervisor, margin + 5, yPosition);
    yPosition += 10;

    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
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
