"use client";

import { useEffect } from "react";

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor long tasks
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
        }
      });

      observer.observe({ entryTypes: ["longtask"] });

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    // Monitor navigation timing
    if (typeof window !== "undefined" && window.performance) {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;

        console.log("Page Performance:", {
          loadTime,
          domContentLoaded,
          firstContentfulPaint: performance.getEntriesByName(
            "first-contentful-paint"
          )[0]?.startTime,
        });

        // Warn if page is slow
        if (loadTime > 2000) {
          console.warn(`Slow page load detected: ${loadTime}ms`);
        }
      }
    }
  }, []);

  return null; // This component doesn't render anything
}

// Custom hook for measuring component render time
export function useRenderTime(componentName) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        // Components taking longer than 100ms
        console.warn(
          `Slow component render: ${componentName} took ${renderTime}ms`
        );
      }
    };
  });
}
