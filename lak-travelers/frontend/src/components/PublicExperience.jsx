import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigationType } from 'react-router-dom';
import '../styles/public-experience.css';

const positions = new Map();
const isPublic = path => ['/', '/about', '/reviews', '/vehicles', '/privacy', '/gallery'].includes(path) || path.startsWith('/vehicles/');

// Visible by default: motion progressively enhances content without hiding it in CSS.
export default function PublicExperience({ children }) {
  const location = useLocation();
  const navigation = useNavigationType();
  const reduced = useReducedMotion();
  const root = useRef(null);
  const enabled = isPublic(location.pathname);

  useEffect(() => {
    if (!enabled) return;
    const node = root.current;
    const saved = positions.get(location.key);
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: navigation === 'POP' ? saved || 0 : 0, behavior: 'instant' });
    const remember = () => positions.set(location.key, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    const cleanupScroll = () => window.removeEventListener('scroll', remember);
    if (reduced || !('IntersectionObserver' in window)) return cleanupScroll;

    const animations = new Set();
    const play = (element, delay = 0) => {
      const animation = animate(element, { opacity: [0.35, 1], y: [window.innerWidth < 640 ? 8 : 14, 0] }, { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] });
      animations.add(animation);
      animation.then(() => animations.delete(animation));
    };
    play(node);
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        observer.unobserve(entry.target);
        play(entry.target, Math.min(index, 3) * 0.045);
      });
    }, { threshold: 0.08 });
    const discover = () => node.querySelectorAll('section > h2, article, [data-reveal], .grid > .group').forEach(element => {
      if (seen.has(element)) return;
      seen.add(element);
      // Above-the-fold content participates only in the page entrance.
      if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
    });
    discover();
    const mutations = new MutationObserver(discover);
    mutations.observe(node, { childList: true, subtree: true });
    return () => {
      cleanupScroll();
      observer.disconnect();
      mutations.disconnect();
      animations.forEach(animation => animation.complete());
    };
  }, [location.key, location.pathname, location.hash, navigation, reduced, enabled]);

  return <div ref={root} className={enabled ? 'public-experience' : undefined}>{children}</div>;
}
