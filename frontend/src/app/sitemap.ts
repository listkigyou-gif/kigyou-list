import { MetadataRoute } from 'next';
import { getSitemapCompanies, getSitemapCompaniesCount, getActiveIndustryPrefecturePairs } from '@/lib/db';
import { PREFECTURES } from '@/lib/hubUtils';
import { LICENSE_HUBS, JAPAN_PREFECTURES } from '@/lib/licenseHubs';

export const revalidate = 86400; // Cache sitemap for 24 hours, rebuild in background

const SITEMAP_LIMIT = 10000; // Optimized for Googlebot speed (10k URLs ~1.5MB uncompressed, ~150KB gzip)

export async function generateSitemaps() {
  const totalCompanies = await getSitemapCompaniesCount();
  const numSitemaps = Math.ceil(totalCompanies / SITEMAP_LIMIT);

  const sitemaps = [{ id: 'core' }];
  for (let i = 0; i < numSitemaps; i++) {
    sitemaps.push({ id: String(i) });
  }
  return sitemaps;
}

export default async function sitemap({ id }: { id: any }): Promise<MetadataRoute.Sitemap> {
  const resolvedId = await id;
  const baseUrl = 'https://kigyoulist.com';
  const locales = ['ja', 'en', 'vi'];

  if (resolvedId === 'core') {
    // 1. Core Platform Pages (Localized for ja and en)
    const corePages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      }
    ];

    locales.forEach(loc => {
      corePages.push({
        url: `${baseUrl}/${loc}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/directory`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/compare`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/form-marketing`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/invoice`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/watchlist`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });

      // Programmatic SEO Dynamic Hubs ("Mạng Nhện Biến Động")
      corePages.push({
        url: `${baseUrl}/${loc}/new-companies`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/changes/relocation`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/status/bankruptcies`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/jobs/latest`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/changes/merger`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });

      // 47 Prefectures Dynamic Hub Pages
      for (const p of PREFECTURES) {
        corePages.push({
          url: `${baseUrl}/${loc}/new-companies/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.90,
        });
        corePages.push({
          url: `${baseUrl}/${loc}/changes/relocation/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.90,
        });
        corePages.push({
          url: `${baseUrl}/${loc}/status/bankruptcies/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.90,
        });
        corePages.push({
          url: `${baseUrl}/${loc}/jobs/latest/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.90,
        });
        corePages.push({
          url: `${baseUrl}/${loc}/changes/merger/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.90,
        });
      }

      // 47 Prefectures Local SEO Hubs (pSEO)
      for (let p = 1; p <= 47; p++) {
        const prefCode = p.toString().padStart(2, '0');
        corePages.push({
          url: `${baseUrl}/${loc}/area/${prefCode}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }

      // Public Licenses & Professional Registrations Hubs (公的許認可・士業登録ハブ)
      corePages.push({
        url: `${baseUrl}/${loc}/licenses`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.95,
      });

      for (const hub of Object.values(LICENSE_HUBS)) {
        // National Hub Overview
        corePages.push({
          url: `${baseUrl}/${loc}/license/${hub.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.92,
        });

        // 47 Prefecture Sub-Hubs
        for (const pref of JAPAN_PREFECTURES) {
          corePages.push({
            url: `${baseUrl}/${loc}/license/${hub.slug}/${pref.code}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.88,
          });
        }
      }
      corePages.push({
        url: `${baseUrl}/${loc}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/tokushoho`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.4,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/terms`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      });
    });

    // 2. Category Matrix Pages (Prefecture × Industry JSIC) (pSEO) (Localized)
    const categoryPages: MetadataRoute.Sitemap = [];
    try {
      const pairs = await getActiveIndustryPrefecturePairs();
      locales.forEach(loc => {
        pairs.forEach(p => {
          if (p.industry_code && p.prefecture_code) {
            categoryPages.push({
              url: `${baseUrl}/${loc}/industry/${p.industry_code}/location/${p.prefecture_code}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
          }
        });
      });
    } catch (error) {
      console.error('Error generating dynamic categories sitemap:', error);
    }

    return [...corePages, ...categoryPages];
  }

  // Otherwise, it is a numeric ID representing a company profile chunk
  const chunkIndex = parseInt(resolvedId, 10);
  if (isNaN(chunkIndex)) {
    return [];
  }

  const offset = chunkIndex * SITEMAP_LIMIT;
  const companyPages: MetadataRoute.Sitemap = [];
  try {
    const rows = await getSitemapCompanies(SITEMAP_LIMIT, offset);
    if (rows) {
      rows.forEach(r => {
        // Pointing to default 'ja' locale prefix to avoid 302 middleware redirects
        companyPages.push({
          url: `${baseUrl}/ja/company/${r.corporate_number}`,
          lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error(`Error generating dynamic companies sitemap chunk ${resolvedId}:`, error);
  }

  return companyPages;
}
