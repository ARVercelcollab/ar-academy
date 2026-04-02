"use client";

import { useRef, useEffect, useCallback } from "react";

export function useCarouselScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pauseTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const pauseAnimation = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = "paused";
    }
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => {
      if (trackRef.current) {
        trackRef.current.style.animationPlayState = "running";
      }
    }, 2000);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      // Horizontal scroll (deltaX from lateral scroll wheel or shift+scroll)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        wrapper.scrollLeft += e.deltaX;
        pauseAnimation();
      }
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [pauseAnimation]);

  return { wrapperRef, trackRef };
}
