import jsPDF from "jspdf";

interface CompressedImage {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

// PDF generation always uses base64 images for reliable embedding
type ImageData = CompressedImage;

interface ImpalementProtectionData {
  date: string;
  whoCompleting: string;
  location: string;
  inspectedWith: string;
  generalHazardManagement: {
    ahasAvailable: "Yes" | "No" | "N/A";
    ahasAvailableComment?: string;
    ahasReviewedWithEmployees: "Yes" | "No" | "N/A";
    ahasReviewedComment?: string;
    discussedInMeetings: "Yes" | "No" | "N/A";
    discussedInMeetingsComment?: string;
  };
  inspectionItems: {
    generalComments: "Yes" | "No" | "N/A";
    generalCommentsText?: string;
    generalSitePhotos: "Yes" | "No" | "N/A";
    sitePhotos?: CompressedImage[];
    eliminateRebarReviewed: "Yes" | "No" | "N/A";
    eliminateRebarComment?: string;
    ahaCompleted: "Yes" | "No" | "N/A";
    ahaCompletedComment?: string;
    engineeringControls: "Yes" | "No" | "N/A";
    engineeringControlsComment?: string;
    workAreaIsolated: "Yes" | "No" | "N/A";
    workAreaIsolatedComment?: string;
    warningSignage: "Yes" | "No" | "N/A";
    warningSignageComment?: string;
    workAreaInspected: "Yes" | "No" | "N/A";
    workAreaInspectedComment?: string;
    devicesReplaced: "Yes" | "No" | "N/A";
    devicesReplacedComment?: string;
    proceduresReviewed: "Yes" | "No" | "N/A";
    proceduresReviewedComment?: string;
    adequateProtection: "Yes" | "No" | "N/A";
    adequateProtectionComment?: string;
    rebarStorageInspected: "Yes" | "No" | "N/A";
    rebarStorageComment?: string;
  };
  safetyObservations: {
    observation1?: string;
    observation2?: string;
    observation3?: string;
  };
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
 * Convert answer to symbol
 */
function getAnswerSymbol(answer: string): string {
  if (answer === "Yes") return "✓";
  if (answer === "No") return "✗";
  if (answer === "N/A") return "—";
  return "";
}

/**
 * Helper function to add thumbnail images to PDF
 * Returns the new Y position after adding images
 */
function addThumbnailImages(
  doc: jsPDF,
  images: ImageData[],
  yPosition: number,
  margin: number,
  maxWidth: number
): number {
  if (!images || images.length === 0) return yPosition;

  // Thumbnail style: smaller images in a row
  const thumbnailWidth = 30;
  const thumbnailHeight = 22.5;
  const thumbnailSpacing = 5;
  const thumbnailsPerRow = 4;
  const pageHeight = doc.internal.pageSize.getHeight();

  const GRAY_LIGHT = [142, 142, 147] as const;
  const BLACK = [0, 0, 0] as const;

  let currentY = yPosition;

  for (let i = 0; i < images.length; i++) {
    const col = i % thumbnailsPerRow;
    const row = Math.floor(i / thumbnailsPerRow);
    const xPosition = margin + col * (thumbnailWidth + thumbnailSpacing);
    const yPos = currentY + row * (thumbnailHeight + thumbnailSpacing);

    // Check if we need a new page
    if (yPos + thumbnailHeight > pageHeight - 25) {
      doc.addPage();
      currentY = 25;
    }

    try {
      const image = images[i];
      doc.addImage(image.dataUrl, "JPEG", xPosition, yPos, thumbnailWidth, thumbnailHeight);

      // Subtle image caption
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_LIGHT);
      doc.text(`Photo ${i + 1}`, xPosition, yPos + thumbnailHeight + 3);
      doc.setTextColor(...BLACK);
    } catch (error) {
      console.error(`Error adding thumbnail ${i + 1} to PDF:`, error);
    }
  }

  const totalRows = Math.ceil(images.length / thumbnailsPerRow);
  return currentY + (totalRows * (thumbnailHeight + thumbnailSpacing)) + 8;
}

export function generateImpalementProtectionPDF(
  submissionInfo: SubmissionInfo,
  formData: ImpalementProtectionData
): Buffer {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Margins: 0.75" = 19.05mm (we'll use 19)
  const margin = 19;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Font sizes
  const TITLE_SIZE = 16;
  const SUBTITLE_SIZE = 14;
  const BODY_SIZE = 10;
  const LABEL_SIZE = 8;

  // Apple Color Palette
  const BLACK = [0, 0, 0] as const;
  const GRAY_DARK = [60, 60, 67] as const;
  const GRAY_LIGHT = [142, 142, 147] as const;
  const GRAY_BG = [242, 242, 247] as const;
  const ORANGE = [255, 149, 0] as const;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number): void => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add section header with orange accent
  const addSectionHeader = (text: string): void => {
    checkNewPage(20);

    // Orange accent bar
    doc.setFillColor(...ORANGE);
    doc.rect(margin, yPosition, 3, 8, "F");

    // Section header text
    doc.setTextColor(...GRAY_DARK);
    doc.setFontSize(SUBTITLE_SIZE);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin + 6, yPosition + 6);

    yPosition += 14;
    doc.setTextColor(...BLACK);
  };

  // Helper function to add a labeled field
  const addField = (label: string, value: string): void => {
    doc.setFontSize(LABEL_SIZE);
    doc.setTextColor(...GRAY_LIGHT);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), margin, yPosition);

    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    const lines = doc.splitTextToSize(value, contentWidth);
    doc.text(lines, margin, yPosition + 5);

    yPosition += (lines.length * 5) + 8;
  };

  // Helper function to draw table
  const drawTable = (headers: string[], rows: Array<Array<string>>, columnWidths: number[]): void => {
    const rowHeight = 10;
    const headerHeight = 12;

    // Check if table fits on page
    const tableHeight = headerHeight + (rows.length * rowHeight);
    checkNewPage(tableHeight);

    const tableStartY = yPosition;

    // Draw header row
    doc.setFillColor(...GRAY_BG);
    doc.rect(margin, tableStartY, contentWidth, headerHeight, "F");

    doc.setDrawColor(...GRAY_LIGHT);
    doc.setLineWidth(0.25);
    doc.rect(margin, tableStartY, contentWidth, headerHeight, "S");

    // Header text
    doc.setFontSize(BODY_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY_DARK);

    let xPos = margin + 2;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableStartY + 8);
      xPos += columnWidths[i];
    });

    yPosition = tableStartY + headerHeight;

    // Draw data rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);

    rows.forEach((row, rowIndex) => {
      // Alternating row colors
      if (rowIndex % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
      }

      // Row border
      doc.setDrawColor(...GRAY_LIGHT);
      doc.setLineWidth(0.1);
      doc.rect(margin, yPosition, contentWidth, rowHeight, "S");

      // Cell content
      let xPos = margin + 2;
      row.forEach((cell, cellIndex) => {
        const cellWidth = columnWidths[cellIndex] - 4;
        const lines = doc.splitTextToSize(cell, cellWidth);
        doc.text(lines[0], xPos, yPosition + 7); // Only show first line for table cells
        xPos += columnWidths[cellIndex];
      });

      yPosition += rowHeight;
    });

    yPosition += 8; // Spacing after table
  };

  // ==================== HEADER SECTION ====================

  // Main title
  doc.setTextColor(...BLACK);
  doc.setFontSize(TITLE_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("Buck Sanders Inspection Survey Report", margin, yPosition);
  yPosition += 8;

  // Subtitle
  doc.setTextColor(...GRAY_LIGHT);
  doc.setFontSize(BODY_SIZE);
  doc.setFont("helvetica", "normal");
  doc.text("Deacon Construction LLC - Impalement Protection", margin, yPosition);
  yPosition += 18;

  doc.setTextColor(...BLACK);

  // Header information in two columns
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;

  // Column 1
  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("DATE OF SURVEY", col1X, yPosition);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(formData.date, col1X, yPosition + 5);

  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("WHO IS COMPLETING", col1X, yPosition + 14);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(formData.whoCompleting, col1X, yPosition + 19);

  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("LOCATION", col1X, yPosition + 28);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  const locationLines = doc.splitTextToSize(formData.location, (pageWidth / 2) - margin - 10);
  doc.text(locationLines, col1X, yPosition + 33);

  // Column 2
  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("INSPECTED WITH", col2X, yPosition);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(formData.inspectedWith, col2X, yPosition + 5);

  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("SUBMITTED BY", col2X, yPosition + 14);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(submissionInfo.submittedBy, col2X, yPosition + 19);

  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("COMPANY", col2X, yPosition + 28);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(submissionInfo.submittedByCompany, col2X, yPosition + 33);

  yPosition += Math.max(38 + (locationLines.length - 1) * 5, 47);

  // Job Number (full width)
  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text("JOB NUMBER", margin, yPosition);
  doc.setTextColor(...BLACK);
  doc.setFontSize(BODY_SIZE);
  doc.text(submissionInfo.jobNumber, margin, yPosition + 5);

  yPosition += 18;

  // ==================== SECTION 1: GENERAL HAZARD MANAGEMENT ====================

  addSectionHeader("Section 1: General Hazard Management");

  const hazardHeaders = ["Question", "Answer", "Comments"];
  const hazardColumnWidths = [90, 20, contentWidth - 110];
  const hazardRows: Array<Array<string>> = [
    [
      "AHAs/JHAs/JSAs available",
      getAnswerSymbol(formData.generalHazardManagement.ahasAvailable),
      formData.generalHazardManagement.ahasAvailableComment || ""
    ],
    [
      "Reviewed with employees",
      getAnswerSymbol(formData.generalHazardManagement.ahasReviewedWithEmployees),
      formData.generalHazardManagement.ahasReviewedComment || ""
    ],
    [
      "Discussed in meetings",
      getAnswerSymbol(formData.generalHazardManagement.discussedInMeetings),
      formData.generalHazardManagement.discussedInMeetingsComment || ""
    ]
  ];

  drawTable(hazardHeaders, hazardRows, hazardColumnWidths);

  // ==================== SECTION 2: INSPECTION ITEMS ====================

  addSectionHeader("Section 2: Inspection Items");

  const inspectionHeaders = ["#", "Question", "Answer", "Comments/Details"];
  const inspectionColumnWidths = [10, 70, 20, contentWidth - 100];

  // Question mapping
  const questionTexts: { [key: string]: string } = {
    "generalComments": "General Comments",
    "generalSitePhotos": "General Site Photos",
    "eliminateRebarReviewed": "Rebar/stakes/sharp objects removed or capped",
    "ahaCompleted": "AHA completed for impalement hazards",
    "engineeringControls": "Engineering controls in place",
    "workAreaIsolated": "Work area isolated/barricaded as needed",
    "warningSignage": "Warning signage posted appropriately",
    "workAreaInspected": "Work area inspected before work begins",
    "devicesReplaced": "Protection devices replaced after removal",
    "proceduresReviewed": "Procedures reviewed with crew",
    "adequateProtection": "Adequate protection for identified hazards",
    "rebarStorageInspected": "Rebar storage areas inspected"
  };

  const inspectionRows: Array<Array<string>> = [];
  let questionNumber = 1;

  // Add all inspection items
  const items = formData.inspectionItems;

  // General Comments
  inspectionRows.push([
    String(questionNumber++),
    questionTexts.generalComments,
    getAnswerSymbol(items.generalComments),
    items.generalCommentsText || ""
  ]);

  // General Site Photos
  inspectionRows.push([
    String(questionNumber++),
    questionTexts.generalSitePhotos,
    getAnswerSymbol(items.generalSitePhotos),
    items.sitePhotos && items.sitePhotos.length > 0 ? `${items.sitePhotos.length} photo(s) attached` : ""
  ]);

  // Other inspection items
  const inspectionFields: Array<[string, string]> = [
    ["eliminateRebarReviewed", "eliminateRebarComment"],
    ["ahaCompleted", "ahaCompletedComment"],
    ["engineeringControls", "engineeringControlsComment"],
    ["workAreaIsolated", "workAreaIsolatedComment"],
    ["warningSignage", "warningSignageComment"],
    ["workAreaInspected", "workAreaInspectedComment"],
    ["devicesReplaced", "devicesReplacedComment"],
    ["proceduresReviewed", "proceduresReviewedComment"],
    ["adequateProtection", "adequateProtectionComment"],
    ["rebarStorageInspected", "rebarStorageComment"]
  ];

  for (const [questionKey, commentKey] of inspectionFields) {
    const answer = items[questionKey as keyof typeof items] as "Yes" | "No" | "N/A";
    const comment = items[commentKey as keyof typeof items] as string | undefined;

    inspectionRows.push([
      String(questionNumber++),
      questionTexts[questionKey],
      getAnswerSymbol(answer),
      comment || ""
    ]);
  }

  drawTable(inspectionHeaders, inspectionRows, inspectionColumnWidths);

  // Add site photos if present
  if (items.sitePhotos && items.sitePhotos.length > 0) {
    checkNewPage(30);
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...GRAY_DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Site Photos:", margin, yPosition);
    yPosition += 8;

    yPosition = addThumbnailImages(doc, items.sitePhotos, yPosition, margin, contentWidth);
  }

  // ==================== SECTION 3: SAFETY OBSERVATIONS ====================

  addSectionHeader("Section 3: Safety Observations");

  // Observation 1
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(...GRAY_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Safety Observation 1:", margin, yPosition);
  yPosition += 6;

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  const obs1Text = formData.safetyObservations.observation1 || "N/A";
  const obs1Lines = doc.splitTextToSize(obs1Text, contentWidth);
  doc.text(obs1Lines, margin, yPosition);
  yPosition += (obs1Lines.length * 5) + 8;

  checkNewPage(30);

  // Observation 2
  doc.setTextColor(...GRAY_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Safety Observation 2:", margin, yPosition);
  yPosition += 6;

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  const obs2Text = formData.safetyObservations.observation2 || "N/A";
  const obs2Lines = doc.splitTextToSize(obs2Text, contentWidth);
  doc.text(obs2Lines, margin, yPosition);
  yPosition += (obs2Lines.length * 5) + 8;

  checkNewPage(30);

  // Observation 3
  doc.setTextColor(...GRAY_DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Safety Observation 3:", margin, yPosition);
  yPosition += 6;

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  const obs3Text = formData.safetyObservations.observation3 || "N/A";
  const obs3Lines = doc.splitTextToSize(obs3Text, contentWidth);
  doc.text(obs3Lines, margin, yPosition);
  yPosition += (obs3Lines.length * 5) + 12;

  // ==================== FOOTER SECTION ====================

  // Add signature if available
  if (formData.signature) {
    checkNewPage(40);

    doc.setFontSize(LABEL_SIZE);
    doc.setTextColor(...GRAY_LIGHT);
    doc.setFont("helvetica", "normal");
    doc.text("INSPECTOR SIGNATURE", margin, yPosition);
    yPosition += 8;

    try {
      doc.addImage(formData.signature, "PNG", margin, yPosition, 80, 24);
      yPosition += 30;
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
    }
  }

  // Timestamp and generator info at bottom of page
  const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFontSize(LABEL_SIZE);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_LIGHT);

    if (submissionInfo.submittedAt) {
      const timestamp = `Submitted on ${submissionInfo.submittedAt}`;
      doc.text(timestamp, margin, pageHeight - 12);
    }

    const generatorText = "Generated by SubSpace - Deacon Construction";
    doc.text(generatorText, pageWidth - margin, pageHeight - 12, { align: "right" });
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
