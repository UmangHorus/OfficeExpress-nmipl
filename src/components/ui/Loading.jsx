"use client";
import { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";

export default function Loading() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
      <HashLoader color="#287f71" size={60} speedMultiplier={1.5} />
    </div>
  );
}
