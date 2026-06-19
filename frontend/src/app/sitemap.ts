import { MetadataRoute } from 'next';
import { getSitemapCompanies, getSitemapCompaniesCount, getActiveIndustryPrefecturePairs, getBlogPosts } from '@/lib/db';

export const revalidate = 86400; // Cache sitemap for 24 hours, rebuild in background

const SITEMAP_LIMIT = 50000;

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
  const locales = ['ja', 'en'];

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
        url: `${baseUrl}/${loc}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.80,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
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

    // 1.5. Dynamic Blog Pages (Localized)
    const blogPages: MetadataRoute.Sitemap = [];
    try {
      const posts = await getBlogPosts(1000, 0);
      locales.forEach(loc => {
        posts.forEach(post => {
          blogPages.push({
            url: `${baseUrl}/${loc}/blog/${post.slug}`,
            lastModified: post.published_at ? new Date(post.published_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        });
      });
    } catch (error) {
      console.error('Error generating dynamic blog pages sitemap:', error);
    }

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

    return [...corePages, ...blogPages, ...categoryPages];
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
