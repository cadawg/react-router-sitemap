const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

/**
 * Convert a route pattern like '/blog/:slug' into a RegExp that matches
 * resolved paths like '/blog/hello'. Non-param segments are escaped.
 */
const patternToRegex = (key) => {
	const escaped = key
		.split(/(:[^/]+)/g)
		.map(part => part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('');
	return new RegExp(`^${escaped}$`);
};

/**
 * Resolve metadata for a given path. Exact key match takes precedence,
 * then falls back to the first param pattern key that matches.
 */
const resolveMeta = (urlPath, meta) => {
	if (meta[urlPath] != null) return meta[urlPath];
	for (const key of Object.keys(meta)) {
		if (key.includes(':') && patternToRegex(key).test(urlPath)) {
			return meta[key];
		}
	}
	return {};
};

const xmlEncode = str => str
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&apos;');

const buildUrlTag = (base, urlPath, defaults, meta) => {
	const resolved = { ...defaults, ...resolveMeta(urlPath, meta) };
	let inner = `<loc>${xmlEncode(base + urlPath)}</loc>`;
	if (resolved.lastmod != null) inner += `<lastmod>${resolved.lastmod}</lastmod>`;
	if (resolved.changefreq != null) inner += `<changefreq>${resolved.changefreq}</changefreq>`;
	if (resolved.priority != null) inner += `<priority>${resolved.priority}</priority>`;
	return `<url>${inner}</url>`;
};

/**
 * Module for building a sitemap XML string from a hostname and array of paths.
 * @module sitemapBuilder
 * @param {String} [hostname] The root URL of your site
 * @param {Array<String>} [paths] Array of paths
 * @param {Object} [defaults] Default metadata applied to all URLs
 * @param {Object} [meta] Per-path metadata overrides, keyed by exact path or route pattern
 * @return {String} Sitemap XML string
 *
 * @example
 * import { sitemapBuilder as buildSitemap } from 'react-router-sitemap';
 *
 * const xml = buildSitemap('https://example.com', ['/home'], { changefreq: 'weekly' });
 */
export default (hostname = 'http://localhost', paths = [], defaults = {}, meta = {}) => {
	const base = hostname.replace(/\/$/, '');
	const urls = paths.map(urlPath => buildUrlTag(base, urlPath, defaults, meta)).join('');
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="${SITEMAP_NS}">${urls}</urlset>`;
};