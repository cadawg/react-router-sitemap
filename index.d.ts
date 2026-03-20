/** A plain route config object (React Router v5/v6/v7 style) */
export interface RouteConfig {
  path?: string;
  /** React Router v5 nested routes */
  childRoutes?: RouteConfig[];
  /** React Router v6/v7 nested routes */
  children?: RouteConfig[];
  component?: unknown;
  element?: unknown;
  [key: string]: unknown;
}

/** Filter configuration passed to `filterPaths` */
export interface FilterConfig {
  /** List of regular expressions to match against paths */
  rules: RegExp[];
  /**
   * If `true`, only paths matching a rule are kept.
   * If `false` (default), paths matching a rule are removed.
   */
  isValid?: boolean;
}

/**
 * A single param replacement entry.
 * Keys are param names (without `:`), values are one or more replacement strings.
 *
 * @example
 * // For path `/post/:id`
 * { id: '1' }
 * { id: ['1', '2', '3'] }
 */
export type ParamEntry = Record<string, string | string[]>;

/**
 * Maps a path pattern to an array of param replacement entries.
 *
 * @example
 * {
 *   '/post/:id': [{ id: '1' }, { id: ['2', '3'] }]
 * }
 */
export type ParamsConfig = Record<string, ParamEntry[]>;

/** Metadata that can be attached to a URL in the sitemap. All fields are optional. */
export interface UrlMeta {
  /** Last modified date in ISO 8601 format, e.g. `'2024-01-15'`. */
  lastmod?: string;
  /** How frequently the page is likely to change. */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority relative to other URLs on your site, from `0.0` (lowest) to `1.0` (highest). Defaults to `0.5`. */
  priority?: number;
}

/**
 * Per-path metadata overrides. Keys are resolved path strings (after `applyParams`).
 *
 * @example
 * {
 *   '/': { priority: 1.0, changefreq: 'daily' },
 *   '/blog': { changefreq: 'weekly', priority: 0.8 },
 * }
 */
export type MetaConfig = Record<string, UrlMeta>;

/** Options for `Sitemap.build()` */
export interface BuildOptions extends UrlMeta {
  /** Maximum number of URLs per sitemap file. Defaults to 49999. */
  limitCountPaths?: number;
}

export default class Sitemap {
  /** The list of resolved paths after parsing, filtering, and param application. */
  paths: string[];

  /**
   * Create a Sitemap from a React Router configuration.
   * @param router - A JSX element, plain route config object, or array of route config objects.
   */
  constructor(router: RouteConfig | RouteConfig[] | unknown);

  /**
   * Replace dynamic parameters (e.g. `:id`) in paths using the provided config.
   * Paths without a matching rule are kept as-is.
   */
  applyParams(paramsConfig: ParamsConfig): this;

  /**
   * Set per-path metadata (lastmod, changefreq, priority).
   * Call after `applyParams` so paths are fully resolved.
   * Per-path values take precedence over defaults set in `build()`.
   */
  applyMeta(metaConfig: MetaConfig): this;

  /**
   * Filter paths using the provided rules.
   * By default (`isValid: false`) paths matching a rule are excluded.
   */
  filterPaths(filterConfig: FilterConfig): this;

  /**
   * Convert the list of paths into one or more sitemap XML documents.
   * @param hostname - Root URL of the site (e.g. `'https://example.com'`).
   * @param options - Optional build options.
   */
  build(hostname: string, options?: BuildOptions): this;

  /**
   * Write the sitemap(s) to disk.
   * If there is more than one sitemap file, a sitemap index is also written.
   * @param dist - Output file path (e.g. `'./public/sitemap.xml'`).
   * @param publicPath - Public path prefix used in the sitemap index. Defaults to `'/'`.
   */
  save(dist: string, publicPath?: string): this;
}

/**
 * Build a sitemap XML document from a hostname and array of paths.
 * @param hostname - Root URL of the site.
 * @param paths - Array of URL paths.
 */
export function sitemapBuilder(hostname?: string, paths?: string[], defaults?: UrlMeta, meta?: MetaConfig): string;

/**
 * Parse a React Router route config into a flat array of path strings.
 * @param routes - A route config object or array of route config objects.
 * @param basePath - Prefix to prepend to all paths.
 */
export function routesParser(routes?: RouteConfig | RouteConfig[], basePath?: string): string[];

/**
 * Filter an array of paths using an array of regular expressions.
 * @param paths - Array of paths to filter.
 * @param rules - Regular expressions to test against each path.
 * @param isValidRules - If `true`, keep matching paths; if `false` (default), remove them.
 */
export function pathsFilter(paths?: string[], rules?: RegExp[], isValidRules?: boolean): string[];

/**
 * Replace dynamic parameters in paths using the provided config.
 * @param paths - Array of paths (may contain `:param` segments).
 * @param paramsConfig - Mapping of path patterns to param replacement entries.
 */
export function paramsApplier(paths?: string[], paramsConfig?: ParamsConfig): string[];

/**
 * Create a normalised route config array from a JSX element, plain object, or array.
 * Accepts React Router v5 JSX `<Route>` trees or plain config objects.
 * @param routes - A JSX element, plain route config object, or array of either.
 */
export function routesCreater(routes: RouteConfig | RouteConfig[] | unknown): RouteConfig[];

/**
 * Split a flat array of paths into chunks for sitemap index support.
 * Google's sitemap limit is 50,000 URLs per file.
 * @param paths - Flat array of paths to split.
 * @param size - Maximum number of paths per chunk. Defaults to 49999.
 */
export function pathsSplitter(paths: string[], size?: number): string[][];