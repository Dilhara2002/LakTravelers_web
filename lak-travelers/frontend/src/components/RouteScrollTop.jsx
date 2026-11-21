import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteScrollTop() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        let id = hash.slice(1);
        try {
          id = decodeURIComponent(id);
        } catch {
          // Keep original hash if decoding fails.
        }

        const target = document.getElementById(id);

        if (target) {
          target.scrollIntoView();
          return;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, search, hash]);

  return null;
}
