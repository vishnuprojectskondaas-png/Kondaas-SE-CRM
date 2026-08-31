import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * Downloads a DOM element by its ID or HTML element reference as a high-resolution PNG image.
 */
export async function downloadElementAsPng(
  elementOrId: string | HTMLElement,
  filename: string
): Promise<boolean> {
  const node = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!node) {
    console.error(`downloadElementAsPng: Element not found (${elementOrId})`);
    return false;
  }

  const cleanFilename = filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const downloadName = `${cleanFilename}_${new Date().toISOString().slice(0, 10)}.png`;

  // 1. Primary Strategy: html-to-image with skipFonts to prevent cross-origin stylesheet cssRules access errors
  try {
    const dataUrl = await toPng(node, {
      quality: 0.98,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      skipFonts: true,
      fontEmbedCSS: '',
      cacheBust: false,
      filter: (domNode) => {
        // Skip elements marked to ignore during export (e.g. export buttons)
        if (domNode instanceof HTMLElement && domNode.dataset.exportIgnore === 'true') {
          return false;
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = downloadName;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (primaryError) {
    console.warn('html-to-image attempt failed, attempting fallback via html2canvas:', primaryError);

    // 2. Secondary Fallback: html2canvas
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          return element instanceof HTMLElement && element.dataset.exportIgnore === 'true';
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = downloadName;
      link.href = dataUrl;
      link.click();
      return true;
    } catch (fallbackError) {
      console.error('All PNG export methods failed:', fallbackError);
      return false;
    }
  }
}
