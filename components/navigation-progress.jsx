"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loading when pathname changes
    setLoading(true);

    // Hide loading after a short delay to simulate navigation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary/20">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out animate-pulse"
          style={{ width: "60%" }}
        />
      </div>
    </div>
  );
}
