import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeTextProps {
  text: string;
  className?: string;
  title?: string;
}

/** Single-line label; on hover/focus when text overflows, scrolls horizontally (respects reduced motion). */
export default function MarqueeText({ text, className, title }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [active, setActive] = useState(false);
  const id = useId().replace(/:/g, '');
  const kfName = `md-marquee-${id}`;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const c = containerRef.current;
    const t = textRef.current;
    if (!c || !t) return;
    const measure = () => {
      setOverflowPx(Math.max(0, t.scrollWidth - c.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    ro.observe(t);
    return () => ro.disconnect();
  }, [text]);

  const runMarquee = overflowPx > 0 && active && !reducedMotion;
  const durationSec = Math.min(28, Math.max(4, 4 + overflowPx / 35));

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- hover-only marquee for overflow */}
      <div
        ref={containerRef}
        className={cn('min-w-0 overflow-hidden', className)}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        role="text"
        aria-label={text}
        title={title ?? text}
      >
        {runMarquee && (
          <style>{`
            @keyframes ${kfName} {
              0%, 10% { transform: translateX(0); }
              90%, 100% { transform: translateX(-${overflowPx}px); }
            }
          `}</style>
        )}
        <span
          ref={textRef}
          className={cn(runMarquee ? 'inline-block whitespace-nowrap' : 'block truncate')}
          style={
            runMarquee
              ? {
                  animation: `${kfName} ${durationSec}s ease-in-out infinite`,
                }
              : undefined
          }
        >
          {text}
        </span>
      </div>
    </>
  );
}
