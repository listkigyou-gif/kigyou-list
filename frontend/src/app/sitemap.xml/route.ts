import { NextResponse } from 'next/server';
import { getSitemapCompaniesCount } from '@/lib/db';

export const revalidate = 86400; // Cache index for 24 hours

const SITEMAP_LIMIT = 50000;
const baseUrl = 'https://kigyoulist.com';

export async function GET() {
  try {
    const totalCompanies = await getSitemapCompaniesCount();
    const numSitemaps = Math.ceil(totalCompanies / SITEMAP_LIMIT);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/core.xml</loc>
  </sitemap>`;

    for (let i = 0; i < numSitemaps; i++) {
      xml += `
  <sitemap>
    <loc>${baseUrl}/sitemap/${i}.xml</loc>
  </sitemap>`;
    }

    xml += `
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new NextResponse('Error generating sitemap index', { status: 500 });
  }
}
