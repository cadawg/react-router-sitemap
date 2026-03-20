import buildSitemap from '../../../lib/sitemap-builder';

describe('sitemap builder', () => {

	it('generates valid sitemap XML with correct URLs', () => {
		const xml = buildSitemap('https://example.com', ['/page-one', '/page-two']);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
		expect(xml).toContain('<loc>https://example.com/page-one</loc>');
		expect(xml).toContain('<loc>https://example.com/page-two</loc>');
	});

	it('strips trailing slash from hostname', () => {
		const xml = buildSitemap('https://example.com/', ['/page']);
		expect(xml).toContain('<loc>https://example.com/page</loc>');
		expect(xml).not.toContain('example.com//page');
	});

	it('returns empty urlset for empty paths', () => {
		const xml = buildSitemap('https://example.com', []);
		expect(xml).toContain('<urlset');
		expect(xml).not.toContain('<url>');
	});

	it('uses localhost as default hostname', () => {
		const xml = buildSitemap(undefined, ['/page']);
		expect(xml).toContain('<loc>http://localhost/page</loc>');
	});

	it('includes default metadata on all URLs', () => {
		const xml = buildSitemap('https://example.com', ['/a', '/b'], {
			changefreq: 'weekly',
			priority: 0.8,
			lastmod: '2024-01-15',
		});
		expect(xml).toContain('<changefreq>weekly</changefreq>');
		expect(xml).toContain('<priority>0.8</priority>');
		expect(xml).toContain('<lastmod>2024-01-15</lastmod>');
		expect((xml.match(/<changefreq>/g) || []).length).toBe(2);
	});

	it('applies per-path metadata overrides', () => {
		const xml = buildSitemap(
			'https://example.com',
			['/a', '/b'],
			{ changefreq: 'weekly', priority: 0.5 },
			{ '/a': { priority: 1.0, changefreq: 'daily' } }
		);
		// /a gets overridden values; /b keeps defaults — both should appear
		expect(xml).toContain('<priority>1</priority>');
		expect(xml).toContain('<priority>0.5</priority>');
		expect(xml).toContain('<changefreq>daily</changefreq>');
		expect(xml).toContain('<changefreq>weekly</changefreq>');
	});

	it('matches param patterns against resolved paths', () => {
		const xml = buildSitemap(
			'https://example.com',
			['/blog/hello', '/blog/world', '/about'],
			{},
			{ '/blog/:slug': { changefreq: 'monthly', priority: 0.8 } }
		);
		expect(xml).toContain('<loc>https://example.com/blog/hello</loc><changefreq>monthly</changefreq><priority>0.8</priority>');
		expect(xml).toContain('<loc>https://example.com/blog/world</loc><changefreq>monthly</changefreq><priority>0.8</priority>');
		// /about has no match — no metadata
		expect(xml).toContain('<url><loc>https://example.com/about</loc></url>');
	});

	it('exact path key takes precedence over a pattern match', () => {
		const xml = buildSitemap(
			'https://example.com',
			['/blog/featured', '/blog/other'],
			{},
			{
				'/blog/:slug': { priority: 0.5 },
				'/blog/featured': { priority: 1.0 },
			}
		);
		expect(xml).toContain('<loc>https://example.com/blog/featured</loc><priority>1</priority>');
		expect(xml).toContain('<loc>https://example.com/blog/other</loc><priority>0.5</priority>');
	});

	it('xml-encodes special characters in URLs', () => {
		const xml = buildSitemap('https://example.com', ['/search?a=1&b=2&q=it\'s<a>"test"']);
		const loc = xml.match(/<loc>(.*?)<\/loc>/)[1];
		expect(loc).toContain('&amp;');
		expect(loc).toContain('&lt;');
		expect(loc).toContain('&gt;');
		expect(loc).toContain('&apos;');
		expect(loc).toContain('&quot;');
		// no raw unescaped characters remain
		expect(loc.replace(/&(?:amp|lt|gt|apos|quot);/g, '')).not.toMatch(/[&<>"']/);
	});

	it('omits metadata fields that are not set', () => {
		const xml = buildSitemap('https://example.com', ['/page']);
		expect(xml).not.toContain('<lastmod>');
		expect(xml).not.toContain('<changefreq>');
		expect(xml).not.toContain('<priority>');
	});

});