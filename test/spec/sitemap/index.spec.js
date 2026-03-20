import fs from 'fs';
import Sitemap from '../../../lib';

const routes = [
	{ path: '/page-one' },
	{ path: '/page-two' },
	{ path: '/page-three' },
];

describe('Sitemap', () => {

	describe('constructor', () => {

		it('parses route config into paths', () => {
			const sitemap = new Sitemap(routes);
			expect(sitemap.paths).toEqual(['/page-one', '/page-two', '/page-three']);
		});

		it('throws when no router is provided', () => {
			expect(() => new Sitemap()).toThrow();
		});

		it('parses nested routes', () => {
			const sitemap = new Sitemap([
				{ path: '/parent', children: [{ path: '/child' }] },
			]);
			expect(sitemap.paths).toContain('/parent');
			expect(sitemap.paths).toContain('/parent/child');
		});

	});

	describe('filterPaths()', () => {

		it('excludes matching paths', () => {
			const sitemap = new Sitemap(routes).filterPaths({
				rules: [/\/page-one/],
				isValid: false,
			});
			expect(sitemap.paths).not.toContain('/page-one');
			expect(sitemap.paths).toContain('/page-two');
		});

		it('includes only matching paths', () => {
			const sitemap = new Sitemap(routes).filterPaths({
				rules: [/\/page-one/],
				isValid: true,
			});
			expect(sitemap.paths).toEqual(['/page-one']);
		});

	});

	describe('applyParams()', () => {

		it('replaces dynamic segments with provided values', () => {
			const sitemap = new Sitemap([{ path: '/post/:id' }]).applyParams({
				'/post/:id': [{ id: '1' }, { id: '2' }],
			});
			expect(sitemap.paths).toEqual(['/post/1', '/post/2']);
		});

	});

	describe('build()', () => {

		it('produces sitemap XML containing all URLs', () => {
			const sitemap = new Sitemap(routes).build('https://example.com');
			expect(sitemap.sitemaps).toHaveLength(1);
			expect(sitemap.sitemaps[0]).toContain('<loc>https://example.com/page-one</loc>');
			expect(sitemap.sitemaps[0]).toContain('<loc>https://example.com/page-two</loc>');
			expect(sitemap.sitemaps[0]).toContain('<loc>https://example.com/page-three</loc>');
		});

		it('splits into multiple sitemaps when limitCountPaths is exceeded', () => {
			const sitemap = new Sitemap(routes).build('https://example.com', { limitCountPaths: 1 });
			expect(sitemap.sitemaps).toHaveLength(3);
		});

		it('returns this for chaining', () => {
			const sitemap = new Sitemap(routes);
			expect(sitemap.build('https://example.com')).toBe(sitemap);
		});

		it('includes default metadata on all URLs', () => {
			const sitemap = new Sitemap(routes).build('https://example.com', {
				changefreq: 'weekly',
				priority: 0.7,
				lastmod: '2024-01-15',
			});
			const xml = sitemap.sitemaps[0];
			expect(xml).toContain('<changefreq>weekly</changefreq>');
			expect(xml).toContain('<priority>0.7</priority>');
			expect(xml).toContain('<lastmod>2024-01-15</lastmod>');
		});

	});

	describe('applyMeta()', () => {

		it('returns this for chaining', () => {
			const sitemap = new Sitemap(routes);
			expect(sitemap.applyMeta({})).toBe(sitemap);
		});

		it('applies per-path metadata in the built XML', () => {
			const xml = new Sitemap(routes)
				.applyMeta({
					'/page-one': { priority: 1.0, changefreq: 'daily' },
				})
				.build('https://example.com', { changefreq: 'monthly', priority: 0.5 })
				.sitemaps[0];

			// /page-one gets per-path override
			expect(xml).toContain('<priority>1</priority>');
			expect(xml).toContain('<changefreq>daily</changefreq>');
			// other pages get the default
			expect(xml).toContain('<priority>0.5</priority>');
			expect(xml).toContain('<changefreq>monthly</changefreq>');
		});

		it('matches param patterns to resolved paths', () => {
			const xml = new Sitemap([{ path: '/blog/:slug' }])
				.applyParams({ '/blog/:slug': [{ slug: 'hello' }, { slug: 'world' }] })
				.applyMeta({ '/blog/:slug': { changefreq: 'monthly' } })
				.build('https://example.com')
				.sitemaps[0];

			expect(xml).toContain('<loc>https://example.com/blog/hello</loc><changefreq>monthly</changefreq>');
			expect(xml).toContain('<loc>https://example.com/blog/world</loc><changefreq>monthly</changefreq>');
		});

		it('per-path values take precedence over defaults', () => {
			const xml = new Sitemap([{ path: '/important' }])
				.applyMeta({ '/important': { priority: 1.0 } })
				.build('https://example.com', { priority: 0.3 })
				.sitemaps[0];

			expect(xml).toContain('<priority>1</priority>');
			expect(xml).not.toContain('<priority>0.3</priority>');
		});

	});

	describe('save()', () => {

		let writeSpy;

		beforeEach(() => {
			writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
		});

		afterEach(() => {
			writeSpy.mockRestore();
		});

		it('writes a single sitemap file when paths fit in one chunk', () => {
			new Sitemap(routes).build('https://example.com').save('./sitemap.xml');
			expect(writeSpy).toHaveBeenCalledTimes(1);
			expect(writeSpy).toHaveBeenCalledWith('./sitemap.xml', expect.stringContaining('<urlset'));
		});

		it('writes multiple sitemap files and a sitemap index when split', () => {
			new Sitemap(routes).build('https://example.com', { limitCountPaths: 1 }).save('./sitemap.xml');
			// 3 individual sitemaps + 1 index
			expect(writeSpy).toHaveBeenCalledTimes(4);
			const lastCall = writeSpy.mock.calls[writeSpy.mock.calls.length - 1];
			expect(lastCall[0]).toBe('./sitemap.xml');
			expect(lastCall[1]).toContain('<sitemapindex');
		});

		it('index URLs use the correct hostname and public path', () => {
			new Sitemap([{ path: '/a' }, { path: '/b' }])
				.build('https://example.com', { limitCountPaths: 1 })
				.save('./sitemap.xml', '/static/');
			const indexXml = writeSpy.mock.calls[writeSpy.mock.calls.length - 1][1];
			expect(indexXml).toContain('https://example.com/static/');
		});

	});

});