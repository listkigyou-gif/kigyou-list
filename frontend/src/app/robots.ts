import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kigyoulist.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/_next/',
          '/static/',
          '/api/',
          '/*/dashboard',
          '/*/dashboard/',
          '/*/admin',
          '/*/admin/',
          '/*/login',
          '/*/login/',
          '/*/unsubscribe',
          '/*/unsubscribe/',
        ],
      },
      // AI Search & Knowledge Grounding Bots (Allow to cite and index public directory/profiles)
      {
        userAgent: [
          'OAI-SearchBot',
          'GPTBot',
          'Claude-SearchBot',
          'ClaudeBot',
          'PerplexityBot',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'cohere-ai',
        ],
        allow: '/',
        disallow: [
          '/_next/',
          '/static/',
          '/api/',
          '/*/dashboard',
          '/*/dashboard/',
          '/*/admin',
          '/*/admin/',
          '/*/login',
          '/*/login/',
          '/*/unsubscribe',
          '/*/unsubscribe/',
        ],
      },
      // Block abusive scrapers that do not provide traffic attribution or search citations
      {
        userAgent: [
          'Bytespider',
          'Diffbot',
          'OMgili',
        ],
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-index.xml`,
    ],
  };
}

