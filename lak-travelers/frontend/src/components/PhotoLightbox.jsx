import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

export default function PhotoLightbox({ images, initialIndex = 0, onClose, captions = [], label = "Customer travel photo" }) {
  const dialog = useRef(null);
  const touch = useRef(null);
  const closing = useRef(false);
  const [index, setIndex] = useState(initialIndex);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const move = delta => setIndex(current => (current + delta + images.length) % images.length);
  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    if (!reduced) await animate(dialog.current, { opacity: 0, y: 6 }, { duration: 0.18 });
    onClose();
  };
  return <dialog ref={dialog} aria-label={`${label} viewer`} onCancel={event => { event.preventDefault(); close(); }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
      }
    }} className="rounded-2xl p-4 w-[min(95vw,64rem)] max-w-[95vw]">
    <div className="flex items-center justify-between gap-4 mb-3">
      <p className="text-sm text-slate-600" aria-live="polite">{captions[index] || label} · {index + 1} / {images.length}</p>
      <button autoFocus onClick={close} className="rounded-xl bg-slate-100 px-4 min-h-11">Close</button>
    </div>
    <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center h-[65vh]"
      onTouchStart={event => { touch.current = event.touches[0].clientX; }}
      onTouchEnd={event => {
        if (touch.current !== null) {
          const delta = event.changedTouches[0].clientX - touch.current;
          if (Math.abs(delta) > 50) move(delta < 0 ? 1 : -1);
          touch.current = null;
        }
      }}>
      <img key={images[index]} src={images[index]} alt={captions[index] || `${label} ${index + 1}`} className="travel-lightbox-image w-full h-full object-contain" />
    </div>
    {images.length > 1 && <div className="flex justify-between gap-4 mt-3">
      <button onClick={() => move(-1)} className="rounded-xl bg-slate-100 px-5 min-h-11" aria-label="Previous photo">← Previous</button>
      <button onClick={() => move(1)} className="rounded-xl bg-slate-100 px-5 min-h-11" aria-label="Next photo">Next →</button>
    </div>}
  </dialog>;
}
