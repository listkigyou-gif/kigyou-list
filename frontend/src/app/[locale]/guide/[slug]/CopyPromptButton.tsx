"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyPromptButtonProps {
  text: string;
}

export const CopyPromptButton: React.FC<CopyPromptButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold active:scale-95"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">コピー完了</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>プロンプトをコピー</span>
        </>
      )}
    </button>
  );
};

