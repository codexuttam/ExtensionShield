#!/usr/bin/env node

/**
 * Sitemap Generator
 *
 * Generates sitemap.xml from the route configuration in src/routes/routes.jsx.
 * Single source of truth: any route with `seo` and no `:` or `*` in path is included.
 *
 * Every <url> includes <lastmod> in W3C/ISO 8601 format (build time in UTC).
 * Using one consistent rule for all URLs avoids misleading Google with stale dates.
 *
 * Run: npm run generate:sitemap
 * Build runs this before vite build (see package.json).
 *
 * Uses VITE_SITE_URL environment variable or defaults to https://extensionshield.com
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.VITE_SITE_URL || 'https://extensionshield.com';
const ROUTES_PATH = join(__dirname, '../src/routes/routes.jsx');

/**
 * Extract sitemap entries from routes.jsx source.
 * Includes only routes that have `seo` and a static path (no : or *).
 * Excludes redirects (routes without seo) and dynamic segments.
 */
function extractSitemapRoutesFromSource(source) {
  const routes = [];
  const pathRe = /path:\s*["']([^"']+)["']/g;
  let match;
  while ((match = pathRe.exec(source)) !== null) {
    const path = match[1];
    if (path.includes(':') || path.includes('*')) continue;
    const start = match.index;
    const nextPath = source.indexOf('path:', start + 5);
    const block = nextPath === -1 ? source.slice(start) : source.slice(start, nextPath);
    if (!block.includes('seo:')) continue;
    // Exclude redirect-only routes (Navigate with no real page)
    if (block.includes('<Navigate')) continue;

    const priorityMatch = block.match(/priority:\s*([\d.]+)/);
    const changefreqMatch = block.match(/changefreq:\s*["']([^"']+)["']/);
    routes.push({
      path,
      priority: priorityMatch ? parseFloat(priorityMatch[1]) : 0.5,
      changefreq: changefreqMatch ? changefreqMatch[1] : 'monthly',
    });
  }
  // Sort by path for consistent, human-readable sitemap (best practice)
  routes.sort((a, b) => a.path.localeCompare(b.path));
  return routes;
}

function generateSitemap() {
  const source = readFileSync(ROUTES_PATH, 'utf-8');
  const sitemapRoutes = extractSitemapRoutesFromSource(source);

  // Full ISO 8601 (e.g. 2026-02-21T12:00:00.000Z) — recommended by Google/Bing for crawl signals
  const lastmod = new Date().toISOString();
  const urls = sitemapRoutes
    .map((route) => {
      const loc = `${SITE_URL}${route.path}`;
      const changefreq = route.changefreq || 'monthly';
      const priority = route.priority ?? 0.5;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function main() {
  try {
    const sitemap = generateSitemap();
    const outputPath = join(__dirname, '../public/sitemap.xml');
    writeFileSync(outputPath, sitemap, 'utf-8');

    const source = readFileSync(ROUTES_PATH, 'utf-8');
    const count = extractSitemapRoutesFromSource(source).length;

    console.log('✅ Sitemap generated from src/routes/routes.jsx');
    console.log(`📍 Location: ${outputPath}`);
    console.log(`🌐 Site URL: ${SITE_URL}`);
    console.log(`📊 Routes: ${count}`);
  } catch (err) {
    console.error('❌ Error generating sitemap:', err.message);
    process.exit(1);
  }
}

main();
