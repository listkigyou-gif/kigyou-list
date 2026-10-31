import React from "react";

interface LogoIconProps {
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className = "w-5 h-5 text-white" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", maxWidth: "100%", maxHeight: "100%" }}
    >
      {/* Left corporate block */}
      <rect x="3" y="9" width="5" height="11" rx="1" />
      {/* Middle main corporate block */}
      <rect x="9" y="5" width="5" height="15" rx="1" />
      {/* Right side search magnifier */}
      <circle cx="17.5" cy="10.5" r="2.5" />
      <path d="M19.5 12.5l2 2" />
      {/* Bottom list marker line */}
      <path d="M16 18.5h5.5" />
    </svg>
  );
};
