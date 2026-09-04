"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

// The one clever touch on the page: the script accent draws itself in
// once, the first time it scrolls into view, using its own measured
// text length as the stroke-dasharray. There are exactly two of these
// on the whole site (section 2 and section 3) — see the brief section 5.
//
// This is done with plain DOM/CSS (imperative style + a CSS transition)
// rather than framer-motion's animate prop: motion adopts strokeDasharray
// as one of its own MotionValues on first render, so a later React-state
// update to that same style property gets silently ignored. Driving it
// by hand sidesteps that entirely. useInView is still framer-motion's —
// it's a plain IntersectionObserver hook with no motion-value involved.
export default function ScriptAccent({
  text,
  rotate = 6,
  className,
  color = "text-clay",
}: {
  text: string;
  rotate?: number;
  className?: string;
  color?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const inView = useInView(svgRef, { once: true, amount: 0.6 });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = textRef.current;
    if (!el || reducedMotion) return;
    const length = el.getComputedTextLength();
    el.style.transition = "none";
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;
    el.style.opacity = "1";
  }, [text, reducedMotion]);

  useEffect(() => {
    const el = textRef.current;
    if (!el || reducedMotion || !inView) return;
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.strokeDashoffset = "0";
    });
  }, [inView, reducedMotion]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 420 110"
      className={`${color} overflow-visible ${className ?? ""}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <text
        ref={textRef}
        x="8"
        y="80"
        className="font-script"
        style={{
          fontSize: "3rem",
          fill: reducedMotion ? "currentColor" : "none",
          stroke: "currentColor",
          strokeWidth: 1.5,
          opacity: reducedMotion ? 1 : 0,
        }}
      >
        {text}
      </text>
    </svg>
  );
}
