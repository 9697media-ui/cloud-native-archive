import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAPER = '#F0EEE4';

/** Aguarda fontes e imagens do preview antes de capturar. */
async function waitForAssets(element: HTMLElement) {
  await (document as any).fonts?.ready;
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    }),
  );
}

/** Descobre a última linha com conteúdo real, evitando páginas em branco. */
function getContentHeight(canvas: HTMLCanvasElement, minimumHeight: number) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas.height;

  const { width, height } = canvas;
  const imageData = context.getImageData(0, 0, width, height).data;

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 8) {
      const index = (y * width + x) * 4;
      const alpha = imageData[index + 3];
      const red = imageData[index];
      const green = imageData[index + 1];
      const blue = imageData[index + 2];
      if (alpha > 0 && (red < 248 || green < 248 || blue < 248)) {
        return Math.min(height, Math.max(minimumHeight, y + 24));
      }
    }
  }

  return Math.min(height, minimumHeight);
}

function exportCss(previewPageHeight: number) {
  return `
    [data-pdf-helper="true"] { display: none !important; }
    #pdf-content.pdf-export-mode {
      box-shadow: none !important;
      background: ${PAPER} !important;
      position: relative !important;
      min-height: ${previewPageHeight}px !important;
      overflow: hidden !important;
    }
    #pdf-content.pdf-export-mode .grid-background { background-image: none !important; }
    #pdf-content.pdf-export-mode .page-ruler-bg { background-image: none !important; }
    #pdf-content.pdf-export-mode .grid-container-modern,
    #pdf-content.pdf-export-mode .grid-container-modern * {
      border-color: transparent !important;
      box-shadow: none !important;
    }
    #pdf-content.pdf-export-mode .grid-container-modern { background: transparent !important; }
    #pdf-content.pdf-export-mode .grid-container-modern { gap: 10px !important; }
  `;
}

/**
 * Gera o PDF a partir do mesmo DOM do preview.
 * Regra do plano aprovado: nunca reduzir a tipografia à força.
 * Se o conteúdo couber, sai em uma página; se ultrapassar, sai em duas
 * (ou mais) páginas legíveis, com a barra institucional ao pé de cada uma.
 */
export async function createNewsPdf(elementId = 'pdf-content') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Preview não encontrado para gerar o PDF.');

  const previewWidth = Math.ceil(element.getBoundingClientRect().width);
  const previewPageHeight = Math.ceil((previewWidth * PAGE_HEIGHT_MM) / PAGE_WIDTH_MM);

  await waitForAssets(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: PAPER,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    onclone: (clonedDocument) => {
      const clonedElement = clonedDocument.getElementById(elementId);
      const style = clonedDocument.createElement('style');
      style.textContent = exportCss(previewPageHeight);
      clonedDocument.head.appendChild(style);
      if (clonedElement) {
        clonedElement.classList.add('pdf-export-mode');
        clonedElement.style.width = `${previewWidth}px`;
        clonedElement.style.maxWidth = `${previewWidth}px`;
        clonedElement.style.minWidth = `${previewWidth}px`;
      }
    },
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageHeightPx = Math.floor((canvas.width * PAGE_HEIGHT_MM) / PAGE_WIDTH_MM);
  const contentHeight = getContentHeight(canvas, Math.min(canvas.height, pageHeightPx));
  // Tolerância de 2% evita uma segunda página por causa de alguns pixels.
  const totalPages = Math.max(1, Math.ceil(contentHeight / (pageHeightPx * 1.02)));

  for (let page = 0; page < totalPages; page += 1) {
    if (page > 0) pdf.addPage();
    pdf.setFillColor(240, 238, 228);
    pdf.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, 'F');

    const sourceY = page * pageHeightPx;
    const sliceHeight = Math.min(pageHeightPx, contentHeight - sourceY);
    if (sliceHeight <= 0) break;

    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const context = slice.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a página do PDF.');

    context.fillStyle = PAPER;
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    const renderWidthMm = PAGE_WIDTH_MM;
    const renderHeightMm = (sliceHeight * PAGE_WIDTH_MM) / canvas.width;

    pdf.addImage(slice.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, renderWidthMm, renderHeightMm);
  }

  return pdf;
}

export function getNewsPdfFileName(title: string) {
  return `${(title || 'noticia').replace(/[^\w\-]+/g, '_')}.pdf`;
}
