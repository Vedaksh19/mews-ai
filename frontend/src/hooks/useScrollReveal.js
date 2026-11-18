import { useEffect, useRef } from 'react';

/**
 * Hook to trigger smooth fade-up animations when elements scroll into view.
 * Targets any child element with the `.reveal-on-scroll` class.
 */
export function useScrollReveal(dependencies = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const elements = node.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, dependencies);

  return containerRef;
}

export default useScrollReveal;
