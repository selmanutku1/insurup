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

export type PdfProgressCallback = (
  percent: number,
  currentPage: number,
  totalPages: number
) => void;

export async function generateProposalPdfFile(
  containerElement: HTMLElement,
  proposal: Proposal,
  versionNumber?: number,
  onProgress?: PdfProgressCallback
): Promise<string> {
  onProgress?.(8, 0, 0);

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(containerElement.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );

  const pageElements = Array.from(
    containerElement.querySelectorAll<HTMLElement>('[data-pdf-page]')
  );

  if (pageElements.length === 0) {
    throw new Error('Oluşturulacak teklif sayfası bulunamadı.');
  }

  onProgress?.(16, 0, pageElements.length);

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

    // Add clickable PDF hyperlink annotations for all <a href="..."> elements on this page
    const pageRect = pageEl.getBoundingClientRect();
    const pageWidthPx = pageRect.width || 794;
    const pageHeightPx = pageRect.height || 1123;
    const anchorElements = Array.from(
      pageEl.querySelectorAll<HTMLAnchorElement>('a[href]')
    );

    for (const anchorEl of anchorElements) {
      const rawHref = anchorEl.getAttribute('href')?.trim();
      if (!rawHref) continue;

      const rect = anchorEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const xMm = ((rect.left - pageRect.left) / pageWidthPx) * pageWidthMm;
      const yMm = ((rect.top - pageRect.top) / pageHeightPx) * pageHeightMm;
      const wMm = (rect.width / pageWidthPx) * pageWidthMm;
      const hMm = (rect.height / pageHeightPx) * pageHeightMm;

      pdf.link(xMm, yMm, wMm, hMm, { url: rawHref });
    }

    const pagePercent = Math.round(16 + ((i + 1) / pageElements.length) * 80);
    onProgress?.(pagePercent, i + 1, pageElements.length);
  }

  onProgress?.(100, pageElements.length, pageElements.length);

  const clientSlug = sanitizeFileName(proposal.clientName || 'Musteri');
  const codeSlug = sanitizeFileName(proposal.code || 'Teklif');
  const resolvedVersion = versionNumber ?? proposal.revisionNumber;
  const versionSuffix =
    resolvedVersion && (versionNumber !== undefined || resolvedVersion > 1)
      ? `_v${resolvedVersion}`
      : '';
  const fileName = `InsurUp_Teklif_${clientSlug}_${codeSlug}${versionSuffix}.pdf`;

  pdf.save(fileName);
  return fileName;
}
