import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface TaxSummaryData {
  totalIncome: number;
  totalExpenses: number;
  deductibleExpenses: number;
  rentRelief: number;
  taxableIncome: number;
  estimatedTax: number;
  taxBrackets: Array<{
    description: string;
    rate: number;
    amountInBracket: number;
    taxInBracket: number;
  }>;
  userName: string;
  generatedDate: string;
}

export const generateTaxSummaryPDF = async (data: TaxSummaryData): Promise<void> => {
  try {
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Set default font
    pdf.setFont('helvetica', 'normal');

    // Helper function to add text with proper wrapping
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const maxWidth = pageWidth - x - 20;
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y, options);
      return y + (lines.length * 6) + 3;
    };

    // Helper function to add a section header
    const addSectionHeader = (text: string, y: number) => {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(text, 20, y);
      return y + 12;
    };

    // Helper function to add a line
    const addLine = (y: number) => {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, y, pageWidth - 20, y);
      return y + 5;
    };

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 139); // Dark blue
    pdf.text('TaxMate AI - Tax Summary Report', 20, yPosition);
    yPosition += 15;

    // User info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    yPosition = addText(`Generated for: ${data.userName}`, 20, yPosition);
    yPosition = addText(`Generated on: ${data.generatedDate}`, 20, yPosition);
    yPosition = addLine(yPosition);

    // Summary Cards Section
    yPosition = addSectionHeader('Tax Summary', yPosition);
    
    // Total Income
    yPosition = addText(`Total Income: N${data.totalIncome.toLocaleString()}`, 20, yPosition);
    
    // Total Expenses
    yPosition = addText(`Total Expenses: N${data.totalExpenses.toLocaleString()}`, 20, yPosition);
    
    // Deductible Expenses
    yPosition = addText(`Deductible Expenses: N${data.deductibleExpenses.toLocaleString()}`, 20, yPosition);
    
    // Rent Relief
    yPosition = addText(`Rent Relief (2026): N${data.rentRelief.toLocaleString()}`, 20, yPosition);
    
    // Taxable Income
    yPosition = addText(`Taxable Income: N${data.taxableIncome.toLocaleString()}`, 20, yPosition);
    
    // Estimated Tax
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 100, 0); // Green
    yPosition = addText(`Estimated Tax: N${data.estimatedTax.toLocaleString()}`, 20, yPosition);
    
    // Reset font and color
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    yPosition = addLine(yPosition);

    // Tax Breakdown Section
    yPosition = addSectionHeader('Tax Breakdown (2026 Nigerian Tax Structure)', yPosition);
    
    data.taxBrackets.forEach((bracket) => {
      if (bracket.amountInBracket > 0) {
        yPosition = addText(`${bracket.description}`, 20, yPosition);
        yPosition = addText(`  Amount: N${bracket.amountInBracket.toLocaleString()}`, 30, yPosition);
        yPosition = addText(`  Tax Rate: ${(bracket.rate * 100).toFixed(1)}%`, 30, yPosition);
        yPosition = addText(`  Tax: N${bracket.taxInBracket.toLocaleString()}`, 30, yPosition);
        yPosition += 5;
      }
    });

    yPosition = addLine(yPosition);

    // Footer
    yPosition = addSectionHeader('Important Notes', yPosition);
    yPosition = addText('• This is an estimated tax calculation based on 2026 Nigerian tax rules', 20, yPosition);
    yPosition = addText('• Rent Relief is calculated as the lower of N500,000 or 20% of annual rent', 20, yPosition);
    yPosition = addText('• Full exemption applies to incomes <= N800,000', 20, yPosition);
    yPosition = addText('• Please consult a tax professional for official tax advice', 20, yPosition);

    // Add page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `TaxSummary_${data.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const generateTaxSummaryPDFFromElement = async (elementId: string, fileName?: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF generation');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const finalFileName = fileName || `TaxSummary_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(finalFileName);

  } catch (error) {
    console.error('Error generating PDF from element:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
