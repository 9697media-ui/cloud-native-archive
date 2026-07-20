import { useEffect } from 'react';

/**
 * Reports the document height to the parent window via postMessage.
 * Used when this app is embedded as an iframe (e.g., in WordPress).
 */
export function useIframeHeightReporter(messageType: string) {
  useEffect(() => {
    let rafId: number | null = null;
    let timeoutId: number | null = null;

    const computeHeight = () =>
      Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight,
      );

    const sendHeight = () => {
      try {
        const height = computeHeight();
        window.parent.postMessage({ type: messageType, height }, '*');
      } catch {
        /* noop */
      }
    };

    const scheduleSend = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(sendHeight);
      }, 100);
    };

    // Initial dispatches
    sendHeight();
    window.addEventListener('load', scheduleSend);
    window.addEventListener('resize', scheduleSend);

    // Observe layout & DOM changes
    const resizeObserver = new ResizeObserver(scheduleSend);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(scheduleSend);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Image loads
    const imgListeners: Array<() => void> = [];
    const attachImageListeners = () => {
      const images = document.images;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.complete) continue;
        const handler = () => scheduleSend();
        img.addEventListener('load', handler, { once: true });
        img.addEventListener('error', handler, { once: true });
        imgListeners.push(() => {
          img.removeEventListener('load', handler);
          img.removeEventListener('error', handler);
        });
      }
    };
    attachImageListeners();

    // Font loads
    const fontsReady = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fontsReady?.ready) {
      fontsReady.ready.then(scheduleSend).catch(() => {});
    }

    return () => {
      window.removeEventListener('load', scheduleSend);
      window.removeEventListener('resize', scheduleSend);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      imgListeners.forEach((off) => off());
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [messageType]);
}
