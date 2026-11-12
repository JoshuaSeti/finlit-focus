import { useEffect, useRef, type ComponentProps } from "react";
import { motion } from "framer-motion";

/** One-line text that shrinks to fit its container, so long names never clip on small screens. */
export function FitName({ children, ...props }: ComponentProps<typeof motion.span>) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      el.style.fontSize = "";
      const { scrollWidth, clientWidth } = el;
      if (scrollWidth > clientWidth) {
        el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * clientWidth * 0.97) / scrollWidth}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children]);

  return (
    <motion.span ref={ref} {...props}>
      {children}
    </motion.span>
  );
}
