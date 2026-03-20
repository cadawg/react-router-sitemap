import fs from 'fs';
import path from 'path';

import createRoutes from './routes-creater';
import parseRoutes from './routes-parser';
import filterPaths from './paths-filter';
import applyParams from './params-applier';
import splitPaths from './paths-splitter';
import buildSitemap from './sitemap-builder';

/**
 * @class Sitemap
 * @description Generate a sitemap using the [React Router](https://www.npmjs.com/package/react-router) configuration.
 *
 * @example
 * import Sitemap from 'react-router-sitemap';
 *
 * const sitemap = (
 *   new Sitemap(<Route path='/home'>)
 *     .build('http://my-site.ru')
 *     .save("./sitemap.xml");
 * );
 */
class Sitemap {

	/**
	 * @constructor
	 * @description Convert a React Router config to an array of paths.
	 * @param {Route} router - React Router configuration.
	 *
	 * @example
	 * import Sitemap from 'react-router-sitemap';
	 *
	 * const sitemap = new Sitemap(<Route path='/home'>);
	 */
	constructor(router) {

		if (!router) {
			throw new Error('Need pass router in module');
		}

		const routes = createRoutes(router);

		this.paths = parseRoutes(routes);


		return this;

	}

	/**
	 * @description Filter paths using the specified rules.
	 * @param {Object} filterConfig - Filter configuration
	 * @property {Array<RegExp>} rules - List filter rules.
	 * @property {Boolean} isValid - Flag that defines a way to filter paths.
	 * If `true`, the path satisfying the rules will be included.
	 * If `false`, the path satisfying the rules will be excluded.
	 *
	 * @example
	 * <caption>Config for exclude `/auth` and `/thanks`</caption>
	 * { isValid: false, rules: [/\/auth/, /\/thanks/] }
	 *
	 * @example
	 * <caption>Config for include `/auth` and `/thanks`</caption>
	 * { isValid: true, rules: [/\/auth/, /\/thanks/] }
	 */
	filterPaths(filterConfig) {

		this.paths = filterPaths(
			this.paths,
			filterConfig.rules,
			filterConfig.isValid || false
		);

		return this;

	}

	/**
	 * @description Replace the dynamic parameters in paths using the given values.
	 * @param {Object.<String, Array>} paramsConfig - Configuration for replacing params.
	 *
	 * @example
	 * <caption>Config for replacing params `:param` in the path `/path/:param`</caption>
	 * {
	 *   '/path/:param': [
	 *     { param: 'value' }
	 *   ]
	 * }
	 *
	 * @example
	 * <caption>Config for replacing params `:param` and `:subparam`
	 * in the path `/path/:param/:subparam`</caption>
	 * {
	 *   '/path/:param/:subparam': [
	 *     { param: 'value', subparam: ['subvalue1', 'subvalue2'] }
	 *   ]
	 * }
	 *
	 */
	applyParams(paramsConfig) {
		this.paths = applyParams(this.paths, paramsConfig);
		return this;
	}

	/**
	 * @description Set per-path metadata (lastmod, changefreq, priority).
	 * Defaults set in build() are merged with these, with per-path values taking precedence.
	 * @param {Object.<String, Object>} metaConfig - Map of path to metadata object.
	 *
	 * @example
	 * sitemap.applyMeta({
	 *   '/': { priority: 1.0, changefreq: 'daily' },
	 *   '/blog': { changefreq: 'weekly' },
	 * });
	 */
	applyMeta(metaConfig) {
		this.meta = metaConfig;
		return this;
	}

	/**
	 * @description Convert array of paths to sitemap.
	 * @param {String} hostname - The root name of your site.
	 * @param {Object} options - Build options.
	 * @param {Number} options.limitCountPaths - Max URLs per sitemap file (default 49999).
	 * @param {String} options.lastmod - Default last modified date for all URLs (ISO 8601).
	 * @param {String} options.changefreq - Default change frequency for all URLs.
	 * @param {Number} options.priority - Default priority for all URLs (0.0–1.0).
	 */
	build(hostname, { limitCountPaths = 49999, lastmod, changefreq, priority } = {}) {
		this.hostname = hostname;
		const defaults = { lastmod, changefreq, priority };
		const meta = this.meta || {};
		this.splitted = splitPaths(this.paths, limitCountPaths);
		this.sitemaps = this.splitted.map(chunk => buildSitemap(hostname, chunk, defaults, meta));
		return this;
	}

	/**
	 * @description Save sitemaps and sitemap index in files.
	 * @param {String} dist - The path and file name where the sitemap index is saved.
	 * @param {String} publicPath - optional public path relative to hostname, default: '/'
	 */
	save(dist, publicPath = '/') {
		const sitemapPaths = [];

		// sitemap index is not needed in case of one sitemap file
		if (this.sitemaps.length === 1) {
			fs.writeFileSync(dist, this.sitemaps[0]);
			return this;
		}

		this.sitemaps.forEach((sitemap, index) => {
			const savePath = dist.replace('.xml', `-${index}.xml`);
			fs.writeFileSync(savePath, sitemap);
			sitemapPaths.push(this.hostname + publicPath + path.basename(savePath));
		});

		// write sitemap index
		const SITEMAP_INDEX_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
		const sitemapTags = sitemapPaths.map(url => `<sitemap><loc>${url}</loc></sitemap>`).join('');
		const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="${SITEMAP_INDEX_NS}">${sitemapTags}</sitemapindex>`;
		fs.writeFileSync(dist, sitemapIndex);

		return this;
	}

}

export default Sitemap;

export { default as routesCreater } from './routes-creater';
export { default as routesParser } from './routes-parser';
export { default as pathsFilter } from './paths-filter';
export { default as paramsApplier } from './params-applier';
export { default as sitemapBuilder } from './sitemap-builder';
export { default as pathsSplitter } from './paths-splitter';
