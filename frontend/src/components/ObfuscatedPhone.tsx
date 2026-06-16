"use client";

import React, { useState, useEffect } from "react";

interface ObfuscatedPhoneProps {
  encodedPhone: string;
}

export const ObfuscatedPhone: React.FC<ObfuscatedPhoneProps> = ({ encodedPhone }) => {
  const [phone, setPhone] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Decode Base64 on client side only
      setPhone(window.atob(encodedPhone));
    } catch (e) {
      console.error("Failed to decode obfuscated phone:", e);
      setPhone("Decode Error");
    }
    setMounted(true);
  }, [encodedPhone]);

  if (!mounted) {
    // Return a dummy placeholder of matching length or style during SSR
    // to prevent hydration mismatch while hiding the real phone number.
    return (
      <span className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded px-4 py-0.5 inline-block w-28 h-5 select-none text-transparent">
        Loading...
      </span>
    );
  }

  return (
    <a 
      href={`tel:${phone.replace(/[\s()\-]/g, "")}`} 
      className="hover:underline text-slate-800 dark:text-slate-100 font-mono text-base font-bold transition-all"
    >
      {phone}
    </a>
  );
};
