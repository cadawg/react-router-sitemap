# React Router Sitemap

[![npm version](https://badge.fury.io/js/%40snaddyvitch-dispenser%2Freact-router-sitemap.svg)](https://badge.fury.io/js/%40snaddyvitch-dispenser%2Freact-router-sitemap)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue.svg)](index.d.ts)

Generate sitemaps from your [React Router](https://www.npmjs.com/package/react-router) configuration. Supports filtering paths, replacing dynamic params, and splitting large sitemaps automatically.

**Supports:** React 17–19, React Router 5–7 · **Zero runtime dependencies**

## Install

```sh
npm install @snaddyvitch-dispenser/react-router-sitemap
```

## Quick start

```js
import Sitemap from '@snaddyvitch-dispenser/react-router-sitemap';

const routes = [
  { path: '/' },
  { path: '/about' },
  { path: '/contact' },
];

new Sitemap(routes)
  .build('https://example.com')
  .save('./public/sitemap.xml');
```

## Route configuration formats

### React Router v6 / v7 (plain objects)

Pass the route array directly from `createBrowserRouter`:

```js
import Sitemap from '@snaddyvitch-dispenser/react-router-sitemap';

const routes = [
  { path: '/' },
  { path: '/about' },
  {
    path: '/blog',
    children: [
      { path: ':slug' },
    ],
  },
];

new Sitemap(routes).build('https://example.com').save('./sitemap.xml');
```

### React Router v5 (JSX or plain objects)

```js
import React from 'react';
import { Route } from 'react-router';
import Sitemap from '@snaddyvitch-dispenser/react-router-sitemap';

const router = (
  <Route>
    <Route path='/' />
    <Route path='/about' />
    <Route path='/contact' />
  </Route>
);

new Sitemap(router).build('https://example.com').save('./sitemap.xml');
```

Or using plain objects with `childRoutes`:

```js
const routes = [
  { path: '/' },
  { path: '/about' },
  { path: '/blog', childRoutes: [{ path: ':slug' }] },
];
```

## Filtering paths

Use `filterPaths` to exclude or include paths by regex rules.

```js
new Sitemap(routes)
  .filterPaths({
    isValid: false,           // false = exclude matches, true = include only matches
    rules: [/\/auth/, /\/admin/],
  })
  .build('https://example.com')
  .save('./sitemap.xml');
```

## Dynamic params

Use `applyParams` to expand dynamic segments like `:slug` into real URLs.

```js
const routes = [
  { path: '/blog/:slug' },
  { path: '/products/:category/:id' },
];

new Sitemap(routes)
  .applyParams({
    '/blog/:slug': [
      { slug: 'hello-world' },
      { slug: ['second-post', 'third-post'] },
    ],
    '/products/:category/:id': [
      { category: 'shoes', id: ['1', '2', '3'] },
    ],
  })
  .build('https://example.com')
  .save('./sitemap.xml');
```

## Large sitemaps

Google limits sitemaps to 50,000 URLs per file. When your site exceeds this, use `limitCountPaths` to split automatically. A sitemap index file is written to the `dist` path, with individual sitemaps written alongside it.

```js
new Sitemap(routes)
  .build('https://example.com', { limitCountPaths: 49999 })
  .save('./public/sitemap.xml', '/static/');
  // writes sitemap-0.xml, sitemap-1.xml, ... and sitemap.xml (index)
```

## URL metadata (lastmod, changefreq, priority)

Use `build()` to set defaults for all URLs, and `applyMeta()` to override per-path.

```js
new Sitemap(routes)
  .applyParams({ '/blog/:slug': [{ slug: 'hello' }, { slug: 'world' }] })
  .applyMeta({
    '/': { priority: 1.0, changefreq: 'daily' },
    '/blog/:slug': { changefreq: 'monthly', priority: 0.7 }, // matches all resolved /blog/* paths
    '/blog/hello': { lastmod: '2024-03-01' },                // exact match takes precedence
  })
  .build('https://example.com', {
    changefreq: 'weekly',  // default for all URLs not matched above
    priority: 0.5,
  })
  .save('./sitemap.xml');
```

`applyMeta` keys can be exact resolved paths **or** route param patterns (e.g. `/blog/:slug`). Exact matches take precedence over patterns. Fields not set are omitted from the XML entirely.

## API

### `new Sitemap(router)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `router` | `RouteConfig \| RouteConfig[] \| ReactElement` | React Router configuration |

### `.filterPaths(config)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.rules` | `RegExp[]` | Patterns to match against paths |
| `config.isValid` | `boolean` | `true` = keep matches, `false` = remove matches (default: `false`) |

### `.applyParams(config)`

Maps path patterns to arrays of param replacement objects. Each object's keys are param names (without `:`), values are a string or array of strings.

### `.applyMeta(config)`

Maps resolved paths to metadata objects. Call after `applyParams` so paths are fully resolved. Per-path values take precedence over defaults set in `build()`.

```ts
{
  '/': { priority: 1.0, changefreq: 'daily', lastmod: '2024-01-15' },
  '/blog': { changefreq: 'weekly' },
}
```

### `.build(hostname, options?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hostname` | `string` | | Root URL of your site, e.g. `'https://example.com'` |
| `options.limitCountPaths` | `number` | `49999` | Max URLs per sitemap file |
| `options.lastmod` | `string` | | Default last modified date (ISO 8601) for all URLs |
| `options.changefreq` | `string` | | Default change frequency for all URLs |
| `options.priority` | `number` | | Default priority (`0.0`–`1.0`) for all URLs |

### `.save(dist, publicPath?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dist` | `string` | | Output path, e.g. `'./public/sitemap.xml'` |
| `publicPath` | `string` | `'/'` | Public path prefix used in the sitemap index when splitting |

## TypeScript

Types are included. Import them directly:

```ts
import Sitemap, { RouteConfig, FilterConfig, ParamsConfig } from '@snaddyvitch-dispenser/react-router-sitemap';
```

## License

MIT © [kuflash](https://github.com/kuflash), [CADawg](https://github.com/cadawg)