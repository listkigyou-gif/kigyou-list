/**
 * Cloudflare Edge Cache Purge Helper for Next.js
 * Automatically purges edge cache when company profile is claimed/edited
 */

export async function purgeCloudflareCompany(corporateNumber: string): Promise<boolean> {
  const email = process.env.CLOUDFLARE_EMAIL || "trungkim8694@gmail.com";
  const apiKey = process.env.CLOUDFLARE_API_KEY || "";
  const zoneId = process.env.CLOUDFLARE_ZONE_ID || "881d2cbd9004c4216cb9f8d28c99b0b9";
  const baseUrl = (process.env.NEXTAUTH_URL || "https://kigyoulist.com").replace(/\/$/, "");

  if (!email || !apiKey || !zoneId) {
    return false;
  }

  const files = [
    `${baseUrl}/ja/company/${corporateNumber}`,
    `${baseUrl}/en/company/${corporateNumber}`,
    `${baseUrl}/vi/company/${corporateNumber}`
  ];

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ files }),
      cache: "no-store"
    });

    const data = await res.json();
    return !!data?.success;
  } catch (err) {
    console.warn("[CloudflarePurge] Failed to purge company from edge cache:", err);
    return false;
  }
}
