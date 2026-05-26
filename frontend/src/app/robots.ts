import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kigyoulist.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/_next/', '/static/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
