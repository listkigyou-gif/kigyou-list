"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const TopProgressBar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Complete progress whenever the pathname or search parameters change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links to start progress immediately (0ms visual feedback)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore new tabs, external links, anchor hashes, downloads
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const isExternal =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:");
      if (isExternal) return;

      if (href.startsWith("#")) return;

      // Compare target href with current url to prevent progress bar on identical link clicks
      const currentFullUrl = window.location.pathname + window.location.search;
      if (href === currentFullUrl || href === window.location.pathname) {
        return;
      }

      // Start the progress bar
      setVisible(true);
      setProgress(25);

      // Simulate incremental progression while server component is loading
      setTimeout(() => {
        setProgress((prev) => (prev >= 25 && prev < 75 ? 70 : prev));
      }, 150);

      setTimeout(() => {
        setProgress((prev) => (prev >= 70 && prev < 90 ? 88 : prev));
      }, 600);
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "250ms",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
};
