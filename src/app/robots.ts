import type { MetadataRoute } from 'next';

const defaultSiteUrl = 'https://prompt-forge-blond.vercel.app';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/complete-profile/', '/update-profile/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
