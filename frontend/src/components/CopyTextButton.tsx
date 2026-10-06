"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyTextButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyTextButton: React.FC<CopyTextButtonProps> = ({
  text,
  label,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
      aria-label="Copy"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          {label && <span className="text-emerald-600 font-medium">コピー済</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
