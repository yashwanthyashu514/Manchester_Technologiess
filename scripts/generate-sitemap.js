import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMAIN, STATIC_ROUTES, getDynamicRoutes } from '../src/config/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates and normalizes URLs to prevent duplicates and trailing slashes
 */
function normalizePath(routePath) {
  let cleanPath = routePath.endsWith('/') && routePath.length > 1 
    ? routePath.slice(0, -1) 
    : routePath;
    
  // Prevent query params and pagination from entering sitemap
  if (cleanPath.includes('?') || cleanPath.includes('&') || cleanPath.match(/\/page\/\d+/)) {
    return null;
  }
  
  return cleanPath;
}

async function generateSitemap() {
  try {
    const dynamicRoutes = await getDynamicRoutes();
    const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes];
    
    // Deduplicate and normalize routes
    const uniquePaths = new Map();
    
    allRoutes.forEach(route => {
      const cleanPath = normalizePath(route.path);
      if (cleanPath !== null && !uniquePaths.has(cleanPath)) {
        uniquePaths.set(cleanPath, {
          loc: `${DOMAIN}${cleanPath}`,
          changefreq: route.changefreq,
          priority: route.priority
        });
      }
    });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(uniquePaths.values()).map(route => `  <url>
    <loc>${route.loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    
    console.log(`✅ Scalable Sitemap generated successfully with ${uniquePaths.size} routes.`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap. Defaulting to existing/empty to prevent XML syntax errors.', error);
    process.exit(1); 
  }
}

generateSitemap();