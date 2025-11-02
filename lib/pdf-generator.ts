import jsPDF from "jspdf";

interface CompressedImage {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

// PDF generation always uses base64 images for reliable embedding
type ImageData = CompressedImage;

interface InspectionData {
  startTime: string;
  endTime: string;
  location: string;
  locationPhotos?: ImageData[];
  hazardDescription: string;
  hazardPhotos?: ImageData[];
  correctiveMeasures: string;
  measuresPhotos?: ImageData[];
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
 * Helper function to add images to PDF - Apple aesthetic
 * Returns the new Y position after adding images
 */
function addImagesToPDF(
  doc: jsPDF,
  images: ImageData[],
  yPosition: number,
  margin: number,
  pageWidth: number
): number {
  if (!images || images.length === 0) return yPosition;

  // Apple style: Larger images with generous spacing
  const imageWidth = 75;
  const imageHeight = 56;
  const imageSpacing = 15; // More breathing room between images
  const imagesPerRow = 2;
  const pageHeight = doc.internal.pageSize.getHeight();

  // Apple colors
  const GRAY_LIGHT = [142, 142, 147] as const;
  const BLACK = [0, 0, 0] as const;

  let currentY = yPosition;

  for (let i = 0; i < images.length; i++) {
    const col = i % imagesPerRow;
    const xPosition = margin + col * (imageWidth + imageSpacing);

    // Check if we need a new page
    if (currentY + imageHeight > pageHeight - 25) {
      doc.addPage();
      currentY = 25;
    }

    try {
      const image = images[i];

      // Embed base64 image directly into PDF
      doc.addImage(image.dataUrl, "JPEG", xPosition, currentY, imageWidth, imageHeight);

      // Apple style: Subtle image caption
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_LIGHT);
      doc.text(`Photo ${i + 1}`, xPosition, currentY + imageHeight + 4);
      doc.setTextColor(...BLACK);
    } catch (error) {
      console.error(`Error adding image ${i + 1} to PDF:`, error);
    }

    // Move to next row if needed
    if (col === imagesPerRow - 1 || i === images.length - 1) {
      currentY += imageHeight + 12; // Apple spacing
    }
  }

  return currentY + 10; // Extra breathing room after image section
}

export function generateImpalementProtectionPDF(
  submissionInfo: SubmissionInfo,
  formData: FormData
): Buffer {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Apple aesthetic: Generous margins (2.5x normal)
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 25;

  // Apple Design System: Only 2 font sizes, 2 weights
  const TITLE_SIZE = 16;
  const BODY_SIZE = 10;

  // Apple Color Palette: Black, Gray, Orange accent
  const BLACK = [0, 0, 0] as const;
  const GRAY_LIGHT = [142, 142, 147] as const; // Apple system gray
  const ORANGE = [255, 149, 0] as const; // Apple orange

  // Helper function to add section header - Apple minimal style
  const addSectionHeader = (text: string, y: number): number => {
    // Single hairline divider above section (no colored accents, no boxes)
    doc.setDrawColor(...GRAY_LIGHT);
    doc.setLineWidth(0.25);
    doc.line(margin, y, margin + contentWidth, y);

    // Section header - simple, clean typography
    doc.setTextColor(...BLACK);
    doc.setFontSize(BODY_SIZE);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y + 8);

    doc.setTextColor(...BLACK);
    doc.setDrawColor(...BLACK);

    // Apple spacing: 3x normal breathing room
    return y + 18;
  };

  // Helper function to add a field - extreme simplicity
  const addField = (label: string, value: string, y: number): number => {
    // Label: smaller, uppercase, gray
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_LIGHT);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), margin, y);

    // Value: body size, black, regular weight
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    const lines = doc.splitTextToSize(value, contentWidth);
    doc.text(lines, margin, y + 6);

    // Apple spacing: generous vertical rhythm
    return y + (lines.length * 5) + 12;
  };

  // Apple Header: Absolute minimalism - no bars, no boxes, no borders
  doc.setTextColor(...BLACK);
  doc.setFontSize(TITLE_SIZE);
  doc.setFont("helvetica", "normal"); // Regular weight, not bold
  doc.text("Impalement Protection", margin, yPosition);

  // Subtitle in gray - minimal hierarchy
  doc.setTextColor(...GRAY_LIGHT);
  doc.setFontSize(BODY_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text("Safety Inspection Report", margin, yPosition + 7);

  // Reset
  doc.setTextColor(...BLACK);

  // Apple spacing: Massive breathing room after header
  yPosition = yPosition + 30;

  // Form Information Section
  yPosition = addSectionHeader("Form Information", yPosition);

  // Apple grid: precise two-column layout with generous gutter
  const col1X = margin;
  const col2X = pageWidth / 2 + 10;

  // Row 1: Job Number and Date on same baseline - no stacking
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_LIGHT);
  doc.setFont("helvetica", "normal");
  doc.text("JOB NUMBER", col1X, yPosition);
  doc.text("INSPECTION DATE", col2X, yPosition);

  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text(submissionInfo.jobNumber, col1X, yPosition + 6);
  doc.text(formData.date, col2X, yPosition + 6);

  yPosition += 20; // Apple spacing

  // Row 2: Submitted By and Email
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("SUBMITTED BY", col1X, yPosition);
  doc.text("EMAIL", col2X, yPosition);

  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(submissionInfo.submittedBy, col1X, yPosition + 6);
  doc.text(submissionInfo.submittedByEmail, col2X, yPosition + 6);

  yPosition += 20; // Apple spacing

  // Row 3: Company (full width for better readability)
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("COMPANY", col1X, yPosition);

  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(submissionInfo.submittedByCompany, col1X, yPosition + 6);

  yPosition += 28; // Extra breathing room before inspections

  // Inspections
  formData.inspections.forEach((inspection, index) => {
    // Check if we need a new page - Apple uses more generous page breaks
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 25; // Consistent top margin
    }

    // Inspection Header
    yPosition = addSectionHeader(`Inspection ${index + 1}`, yPosition);

    // Time Information - aligned to grid
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_LIGHT);
    doc.setFont("helvetica", "normal");
    doc.text("START TIME", col1X, yPosition);
    doc.text("END TIME", col2X, yPosition);

    doc.setTextColor(...BLACK);
    doc.setFontSize(BODY_SIZE);
    doc.text(inspection.startTime, col1X, yPosition + 6);
    doc.text(inspection.endTime, col2X, yPosition + 6);
    yPosition += 20;

    // Location - full width for emphasis
    yPosition = addField("Location", inspection.location, yPosition);

    // Add location photos if available
    if (inspection.locationPhotos && inspection.locationPhotos.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 25;
      }
      yPosition = addImagesToPDF(doc, inspection.locationPhotos, yPosition, margin, pageWidth);
    }

    // Check for new page before hazard section
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 25;
    }

    // Hazard Description - concise label
    yPosition = addField("Hazard Observed", inspection.hazardDescription, yPosition);

    // Add hazard photos if available
    if (inspection.hazardPhotos && inspection.hazardPhotos.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 25;
      }
      yPosition = addImagesToPDF(doc, inspection.hazardPhotos, yPosition, margin, pageWidth);
    }

    // Check for new page before corrective measures
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 25;
    }

    // Corrective Measures - concise label
    yPosition = addField("Corrective Action", inspection.correctiveMeasures, yPosition);

    // Add corrective measures photos if available
    if (inspection.measuresPhotos && inspection.measuresPhotos.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 25;
      }
      yPosition = addImagesToPDF(doc, inspection.measuresPhotos, yPosition, margin, pageWidth);
    }

    // Check for new page before employer info
    if (yPosition > pageHeight - 35) {
      doc.addPage();
      yPosition = 25;
    }

    // Employer Information
    yPosition = addField("Employer", inspection.creatingEmployer, yPosition);
    yPosition = addField("Supervisor", inspection.supervisor, yPosition);

    yPosition += 12; // Apple spacing between inspections
  });

  // Add signature if available
  if (formData.signature) {
    // Check if we need a new page for signature
    if (yPosition > 210) {
      doc.addPage();
      yPosition = 25;
    }

    yPosition += 12; // Apple spacing before signature

    doc.setFontSize(8);
    doc.setTextColor(...GRAY_LIGHT);
    doc.setFont("helvetica", "normal");
    doc.text("INSPECTOR SIGNATURE", margin, yPosition);
    doc.setTextColor(...BLACK);
    yPosition += 8;

    try {
      // Apple style: Larger, more prominent signature
      doc.addImage(formData.signature, "PNG", margin, yPosition, 80, 24);
      yPosition += 30;
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
    }
  }

  // Apple footer: Minimal, centered, gray
  if (submissionInfo.submittedAt) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_LIGHT);
    const footerText = `Submitted ${submissionInfo.submittedAt}`;
    doc.text(
      footerText,
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
