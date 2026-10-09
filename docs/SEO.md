# MFILM public search indexing

Canonical host: `https://www.mfilm.online`. Production already redirects the apex domain to this host. Keep canonical links, Open Graph URLs, the sitemap and submitted URLs consistent with it.

## Rendering and routes

Public navigation returns page-specific HTML from `api/page.js`, including readable catalog content, ordinary links, title, description, canonical, social image and JSON-LD. This HTML is identical for browsers and crawlers; there is no user-agent switch. The existing React application replaces the initial catalog view after startup. This is a public HTML fallback, not React hydration or a second player. Authentication, subscription checks, rentals and playback remain in the existing application.

Legacy entity IDs and aliases redirect permanently to the current name URL. Unknown content and out-of-range listing pages return HTTP 404. Database failures for newly imported movies return a retryable 503, not a false 404. Assets and API paths bypass the page rewrite so missing JavaScript cannot be returned as HTML.

Paginated listings retain `?page=N` in canonical URLs and expose real next/previous links. Tracking, search and episode parameters never create additional canonical movie URLs. Watch pages, account pages, payment pages, personalized recommendations and admin pages are `noindex`; robots allows those HTML pages to be crawled so their noindex directive can be observed. API endpoints are disallowed.

## Catalog and availability

`server/seo/catalog.json` is an allowlisted public deployment snapshot. It contains no users, transactions, passwords, provider keys or AI conversation memory. Never expand the collection list to include those collections.

The CDN-cached `/api/public-catalog` refreshes the public data after 24 hours when requested. Page functions share this endpoint instead of scanning Firestore per visit. Deployment snapshots remain available during quota or network failures. Newly imported movie slugs also support a bounded individual lookup before the next full refresh. Database quotas can delay automatic updates; the initial snapshot is retained until a successful refresh.

The sitemap includes existing movie, actor, author, character, topic, genre and country URLs, plus movie poster images and genuine modification timestamps. Empty orphan profiles without a meaningful introduction are excluded and noindexed. The current format has a 50,000-URL guard; split into a sitemap index before crossing that limit.

## Structured data and previews

Schemas describe actual catalog values: WebSite, Movie or TVSeries, Person, ItemList and BreadcrumbList. Authors are creators, not assumed directors. Ratings, release dates, episode totals and video URLs are never fabricated. Movie metadata uses `releaseYear` and `duration`; it does not concatenate episode identifiers into counts. JSON-LD escapes script delimiters and catalog HTML is escaped before insertion.

The default social PNG is a byte-for-byte copy of the existing MFILM logo. Original logos, payment icons and styles remain unchanged. Movie previews use the actual banner or poster.

## Verification and discovery

- `npm run build`: build the original client application.
- `npm run seo:audit`: verify every snapshot canonical route has one title, description and canonical, valid JSON-LD and a valid application entry.
- `node --test server/seo/seo.test.js api/sitemap.test.js src/utils/assetCache.test.js`: exercise escaping, redirects, real 404s, pagination, caching, failure recovery and asset routing.
- `npm run seo:refresh`: explicitly refresh the deployment snapshot and sitemap from the public catalog. Run deliberately because this reads the catalog from Firestore.
- `npm run seo:submit`: preview an IndexNow submission. Add `-- --submit` after deployment to submit canonical URLs to participating search engines. `--recent` selects genuinely modified URLs from the live sitemap; the existing daily maintenance workflow uses that mode.

Submit `https://www.mfilm.online/sitemap.xml` in the verified Google Search Console domain property. Check URL inspection, indexing exclusions and search performance there. IndexNow acceptance confirms receipt, not ranking or indexing. Google decides indexing separately; do not use Google's restricted Indexing API for ordinary film pages.

`public/BingSiteAuth.xml` is the Bing-provided public ownership verification file for the site's Webmaster Tools account. Keep it available at `https://www.mfilm.online/BingSiteAuth.xml` across deployments; it must bypass the HTML page handler. Submit the same canonical sitemap in Bing Webmaster Tools. IndexNow already notifies participating search engines of genuine daily catalog changes.

Public SEO works with standard HTML in all browsers. Actual appearance in results depends on Google, Bing and other engines, not which browser the visitor uses. Browser compatibility, HTML validation and search indexing are distinct checks; do not claim all browsers were tested without evidence.
