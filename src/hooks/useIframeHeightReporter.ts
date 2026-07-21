import { useEffect, useRef } from 'react';

/**
 * Reports the document height to the parent window via postMessage.
 * Used when this app is embedded as an iframe (e.g., in WordPress).
 *
 * Dampening rules to avoid infinite resize loops:
 * - 150 ms debounce
 * - Only sends when the height changes by more than 5 px
 * - Ignores small height changes caused by the iframe being resized horizontally
 * - Never sends the same height twice
 */
export function useIframeHeightReporter(messageType: string) {
  const lastSentHeightRef = useRef<number>(0);
  const lastSentWidthRef = useRef<number>(0);

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

    const computeWidth = () =>
      window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    const sendHeight = () => {
      try {
        const height = computeHeight();
        const width = computeWidth();
        const heightDelta = Math.abs(height - lastSentHeightRef.current);
        const widthChanged = width !== lastSentWidthRef.current;

        // Avoid re-sending the same height and ignore tiny oscillations.
        if (heightDelta <= 5) {
          return;
        }

        // If only the iframe width changed (e.g. parent resized the iframe) and the
        // height barely moved, ignore the event to break the feedback loop.
        if (widthChanged && heightDelta <= 20) {
          lastSentWidthRef.current = width;
          return;
        }

        lastSentHeightRef.current = height;
        lastSentWidthRef.current = width;
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
      }, 150);
    };

    // Initial dispatch
    sendHeight();

    window.addEventListener('load', scheduleSend);
    window.addEventListener('resize', scheduleSend);

    // Observe layout changes
    const resizeObserver = new ResizeObserver(scheduleSend);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

    // Observe DOM changes
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
