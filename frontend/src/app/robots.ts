import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kigyoulist.com';
  const commonDisallow = [
    '/_next/',
    '/static/',
    '/api/',
    '/en/',
    '/vi/',
    '/index.html/',
    '/*/form-marketing?*',
    '/*/dashboard',
    '/*/dashboard/',
    '/*/admin',
    '/*/admin/',
    '/*/login',
    '/*/login/',
    '/*/unsubscribe',
    '/*/unsubscribe/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: commonDisallow,
      },
      // AI Search & Knowledge Grounding Bots (Allow to cite and index public directory/profiles)
      {
        userAgent: [
          'Googlebot',
          'GoogleOther',
          'Google-Extended',
          'GoogleAgent-URLContext',
          'Bingbot',
          'msnbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'GPTBot',
          'Claude-SearchBot',
          'Claude-User',
          'ClaudeBot',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot',
          'Applebot-Extended',
          'cohere-ai',
          'meta-externalagent',
        ],
        allow: ['/', '/ja/', '/llms.txt', '/llms-full.txt'],
        disallow: commonDisallow,
      },
      // Block non-search / abusive scrapers that do not provide traffic attribution or search citations
      {
        userAgent: [
          'ElevenlabsCrawler',
          'KeenableBot',
          'Reflectionbot',
          'RiverBot',
          'Bytespider',
          'Diffbot',
          'OMgili',
          'DataForSeoBot',
          'MegaIndex',
          'PetalBot',
          'SemrushBot',
          'AhrefsBot',
          'DotBot',
          'MJ12bot',
          'ZoominfoBot',
          'AspiegelBot',
          'CriteoBot',
          'Scrapy',
          'ImagesiftBot',
          'BLEXBot',
          'SeekportBot',
          // 2026-11-19: Non-Japanese search engines & anonymous cloud scrapers (0 JP B2B traffic, verified in Nginx logs)
          'ShapBot',
          'Yandex',
          'YandexBot',
          'Baiduspider',
        ],
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap/core.xml`,
    ],
  };
}
