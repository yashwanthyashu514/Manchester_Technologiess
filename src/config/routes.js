/**
 * Shared Route Configuration (Single Source of Truth)
 * Used by: Sitemap Generator, Vite Prerender Plugin, and Frontend Routing
 */

export const DOMAIN = '';

// Static, SEO-critical routes
export const STATIC_ROUTES = [
    { path: '/', changefreq: 'weekly', priority: 1.0 },
    { path: '/services', changefreq: 'monthly', priority: 0.8 },
    { path: '/about', changefreq: 'monthly', priority: 0.8 },
    { path: '/contact', changefreq: 'monthly', priority: 0.8 },
];

/**
 * Fetch dynamic routes for build-time generation
 * @returns {Promise<Array>} Array of route objects
 */
export async function getDynamicRoutes() {
    try {
        // Example: const posts = await fetch('https://api.yourdomain.com/posts').then(res => res.json());
        // return posts.map(post => ({ path: `/blog/${post.slug}`, changefreq: 'monthly', priority: 0.6 }));
        return [];
    } catch (error) {
        console.error('Failed to fetch dynamic routes. Returning empty array to prevent build failure.', error);
        return []; // Fail safely
    }
}