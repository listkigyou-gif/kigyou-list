"use client";

import React from "react";
import { CompanyOwnershipClaimForm } from "./CompanyOwnershipClaimForm";

export interface CompanyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateNumber: string;
  companyName: string;
  websiteUrl?: string | null;
  phone?: string | null;
  initialPrTitle?: string | null;
  initialPrMessage?: string | null;
  onSuccess?: () => void;
  claimToken?: string | null;
}

export const CompanyClaimModal: React.FC<CompanyClaimModalProps> = ({
  isOpen,
  onClose,
  corporateNumber,
  companyName,
  websiteUrl = "",
  phone = "",
  initialPrTitle = "",
  initialPrMessage = "",
  onSuccess,
  claimToken,
}) => {
  if (!isOpen) return null;

  return (
    <CompanyOwnershipClaimForm
      isEmbedded={false}
      onClose={onClose}
      corporateNumber={corporateNumber}
      companyName={companyName}
      websiteUrl={websiteUrl}
      phone={phone}
      initialPrTitle={initialPrTitle}
      initialPrMessage={initialPrMessage}
      onSuccess={onSuccess}
      claimToken={claimToken}
    />
  );
};
