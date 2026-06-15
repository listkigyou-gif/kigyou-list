import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kigyoulist.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/_next/', '/static/', '/api/'],
      },
      // Block AI scrapers from training models
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'Applebot-Extended',
        disallow: '/',
      },
      {
        userAgent: 'cohere-ai',
        disallow: '/',
      },
      {
        userAgent: 'OMgili',
        disallow: '/',
      },
      {
        userAgent: 'Diffbot',
        disallow: '/',
      },
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
      // Allow real-time search/referral AI assistants to cite and show results
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/_next/', '/static/', '/api/'],
      },
      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
        disallow: ['/_next/', '/static/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/_next/', '/static/', '/api/'],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

