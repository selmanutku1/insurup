import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { Proposal } from '../types/proposal';

function sanitizeFileName(raw: string): string {
  return raw
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

export async function generateProposalPdfFile(
  containerElement: HTMLElement,
  proposal: Proposal
): Promise<string> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const pageElements = Array.from(
    containerElement.querySelectorAll<HTMLElement>('[data-pdf-page]')
  );

  if (pageElements.length === 0) {
    throw new Error('Oluşturulacak teklif sayfası bulunamadı.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.94);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
  }

  const clientSlug = sanitizeFileName(proposal.clientName || 'Musteri');
  const codeSlug = sanitizeFileName(proposal.code || 'Teklif');
  const fileName = `InsurUp_Teklif_${clientSlug}_${codeSlug}.pdf`;

  pdf.save(fileName);
  return fileName;
}
