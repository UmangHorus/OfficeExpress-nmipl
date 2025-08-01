// src/components/FaviconUpdater.jsx
"use client";
import { useFavicon } from "@/hooks/useFavicon";
import { useFaviconStore } from "@/stores/favicon.store";
import { useEffect } from "react";

export default function FaviconUpdater() {
  const { data: faviconUrl } = useFavicon();
  const { faviconUrl: storedUrl } = useFaviconStore();

  useEffect(() => {
    const urlToUse = faviconUrl || storedUrl;
    if (!urlToUse) {
      console.log("No favicon URL available");
      return;
    }
    // Remove existing favicon links
    document.querySelectorAll("link[rel*='icon']").forEach((link) => {
      link.parentNode.removeChild(link);
    });

    // Create new favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = urlToUse;
    document.head.appendChild(link);
    const appleTouchIcon = document.createElement("link");
    appleTouchIcon.rel = "apple-touch-icon";
    appleTouchIcon.href = urlToUse;
    document.head.appendChild(appleTouchIcon);
  }, [faviconUrl, storedUrl]);

  return null;
}
