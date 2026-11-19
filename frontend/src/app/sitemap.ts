import { MetadataRoute } from 'next';
import { getSitemapCompanies, getSitemapCompaniesCount, getActiveIndustryPrefecturePairs, getOfficeBuildings } from '@/lib/db';
import { PREFECTURES } from '@/lib/hubUtils';
import { LICENSE_HUBS, JAPAN_PREFECTURES } from '@/lib/licenseHubs';
import { GUIDE_ARTICLES } from '@/lib/guides';

export const revalidate = 86400; // Cache sitemap for 24 hours, rebuild in background

const SITEMAP_LIMIT = 10000; // Optimized for Googlebot speed (10k URLs ~1.5MB uncompressed, ~150KB gzip)

const FALLBACK_BUILDING_SLUGS = [
  'ebisu-garden-place-tower',
  'roppongi-hills-mori-tower',
  'toranomon-hills-mori-tower',
  'shinagawa-intercity',
  'sunshine-60',
  'yokohama-landmark-tower',
  'marunouchi-building',
  'akasaka-intercity-air',
  'grand-front-osaka',
  'shibuya-scramble-square',
  'tokyo-midtown-tower',
  'shibuya-hikarie',
  'abeno-harukas',
  'shin-marunouchi-building',
  'shiodome-city-center',
];

const EVENT_ARCHIVE_MONTHS = [
  '2026-11',
  '2026-10',
  '2026-09',
  '2026-08',
  '2026-07',
  '2026-06',
];

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
  
  // 100% CRAWL BUDGET ACCELERATION FOR JAPANESE MARKET (JA)
  // Multilingual pages (/en and /vi) remain live on web and discovered via HTML hreflang,
  // but sitemaps submitted to Googlebot & Bingbot focus exclusively on 'ja' to eliminate crawl dilution.
  const sitemapLocales = ['ja'];

  if (resolvedId === 'core') {
    // 1. Core Platform Pages (100% Canonical 200-OK Japanese B2B Hubs; omit root '/' and '/ja/ranking' redirects)
    const corePages: MetadataRoute.Sitemap = [];
    let officeBuildings: Awaited<ReturnType<typeof getOfficeBuildings>> = [];
    try {
      officeBuildings = await getOfficeBuildings(250);
    } catch (error) {
      console.error('Error fetching office buildings for sitemap:', error);
    }

    sitemapLocales.forEach(loc => {
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
        url: `${baseUrl}/${loc}/press`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/guide`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      for (const article of GUIDE_ARTICLES) {
        corePages.push({
          url: `${baseUrl}/${loc}/guide/${article.slug}`,
          lastModified: new Date(article.updatedAt || article.publishedAt),
          changeFrequency: 'weekly',
          priority: article.featured ? 0.95 : 0.90,
        });
      }
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
      corePages.push({
        url: `${baseUrl}/${loc}/changes`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.92,
      });

      // Programmatic SEO Dynamic Hubs ("Mạng Nhện Biến Động")
      const eventHubPaths = ['new-companies', 'changes/relocation', 'status/bankruptcies', 'changes/merger'];
      for (const hubPath of eventHubPaths) {
        corePages.push({
          url: `${baseUrl}/${loc}/${hubPath}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.95,
        });
        for (const ym of EVENT_ARCHIVE_MONTHS) {
          corePages.push({
            url: `${baseUrl}/${loc}/${hubPath}/${ym}`,
            lastModified: new Date(),
            changeFrequency: ym === '2026-11' ? 'daily' : 'weekly',
            priority: 0.88,
          });
        }
      }
      corePages.push({
        url: `${baseUrl}/${loc}/jobs/latest`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });

      // Major Office Buildings & Landmark Tower Hubs (超高層オフィスビル名鑑)
      corePages.push({
        url: `${baseUrl}/${loc}/building`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });

      if (officeBuildings.length > 0) {
        for (const b of officeBuildings) {
          const updatedAt = (b as { updated_at?: string | Date | null }).updated_at;
          corePages.push({
            url: `${baseUrl}/${loc}/building/${b.building_slug}`,
            lastModified: updatedAt ? new Date(updatedAt) : new Date('2026-11-15'),
            changeFrequency: 'weekly',
            priority: 0.90,
          });
        }
      } else {
        for (const bSlug of FALLBACK_BUILDING_SLUGS) {
          corePages.push({
            url: `${baseUrl}/${loc}/building/${bSlug}`,
            lastModified: new Date('2026-11-15'),
            changeFrequency: 'weekly',
            priority: 0.90,
          });
        }
      }

      // Corporate Rankings Hubs (企業ランキング・年収・勤続年数・従業員数 - exclude /ranking redirect)
      corePages.push({
        url: `${baseUrl}/${loc}/ranking/salary`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/ranking/tenure`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/ranking/employees`,
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

    // 2. Category Matrix Pages (Prefecture × Industry JSIC) (pSEO) (100% Japanese Priority)
    const categoryPages: MetadataRoute.Sitemap = [];
    try {
      const pairs = await getActiveIndustryPrefecturePairs();
      sitemapLocales.forEach(loc => {
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
