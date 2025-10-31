import jsPDF from "jspdf";

interface InspectionData {
  startTime: string;
  endTime: string;
  location: string;
  hazardDescription: string;
  correctiveMeasures: string;
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
