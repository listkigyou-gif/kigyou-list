// Safe Google Analytics 4 (gtag) helper for client-side events

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || "G-HNRJXHR5P6";

// https://developers.google.com/analytics/devguides/collection/ga4/events
export function trackEvent(action: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", action, params);
    } catch (e) {
      console.warn("GA4 trackEvent error:", e);
    }
  }
}

// B2B specific funnel events
export const trackSearch = (query: string, location?: string, industry?: string) => {
  trackEvent("search_performed", {
    search_term: query,
    search_location: location || "",
    search_industry: industry || "",
  });
};

export const trackLeadGenerated = (category: string, companyName?: string, value?: number) => {
  trackEvent("generate_lead", {
    lead_category: category,
    company_name: companyName || "",
    value: value || 0,
    currency: "JPY",
  });
};

export const trackBeginCheckout = (planId: string, planName: string, price: number) => {
  trackEvent("begin_checkout", {
    items: [
      {
        item_id: planId,
        item_name: planName,
        price: price,
      },
    ],
    currency: "JPY",
    value: price,
  });
};

export const trackCsvDownloadClick = (source: string, companyCount?: number) => {
  trackEvent("csv_download_intent", {
    source: source,
    company_count: companyCount || 0,
  });
};

export const trackFormMarketingClick = (source: string, corporateNumber?: string) => {
  trackEvent("form_marketing_intent", {
    source: source,
    corporate_number: corporateNumber || "",
  });
};

export const trackSignUpIntent = (source: string) => {
  trackEvent("signup_intent", {
    source: source,
  });
};

export const trackOptOutValueClick = (action: string) => {
  trackEvent("optout_retention_click", {
    action: action,
  });
};
