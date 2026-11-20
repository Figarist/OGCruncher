const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const manifestLinks = [...html.matchAll(/<link\b[^>]*rel=["']manifest["'][^>]*>/gi)];
assert.equal(manifestLinks.length, 1, 'generated HTML must contain exactly one manifest link');
assert.match(manifestLinks[0][0], /href=["']\/OGCruncher\/manifest\.webmanifest["']/i,
  'manifest link must use the GitHub Pages base path');

const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8'));
assert.equal(manifest.name, 'OGCruncher', 'generated manifest has the expected name');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'generated manifest includes required icons');
manifest.icons.forEach(icon => assert.ok(fs.existsSync(path.join(dist, icon.src)), `manifest icon exists: ${icon.src}`));
assert.ok(fs.existsSync(path.join(dist, 'sw.js')), 'generated service worker exists');

assert.doesNotMatch(html, /property=["']twitter:/i, 'generated HTML must use name="twitter:*" attributes');
assert.match(html, /<meta[^>]+name=["']twitter:card["']/i, 'generated HTML includes name="twitter:card"');
assert.match(html, /id=["']btn-clear-results["']/i, 'generated HTML includes Clear Results button');
assert.match(html, /name=["']google-site-verification["']/i, 'generated HTML includes Google Site Verification tag');
assert.match(html, /id=["']guide["']/i, 'generated HTML includes below-the-fold guide section');
assert.match(html, /id=["']faq["']/i, 'generated HTML includes FAQ section');
assert.doesNotMatch(html, /figarist\.github\.io/i, 'generated HTML must not reference legacy figarist.github.io domain');

const ldMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(ldMatch, 'generated HTML must contain JSON-LD structured data');
const ldGraph = JSON.parse(ldMatch[1])['@graph'];
assert.ok(Array.isArray(ldGraph), 'JSON-LD must define an @graph array');
assert.ok(ldGraph.some(item => item['@type'] === 'WebApplication'), 'JSON-LD @graph must include WebApplication');
assert.ok(ldGraph.some(item => item['@type'] === 'BreadcrumbList'), 'JSON-LD @graph must include BreadcrumbList');
const faqNode = ldGraph.find(item => item['@type'] === 'FAQPage');
assert.ok(faqNode && Array.isArray(faqNode.mainEntity) && faqNode.mainEntity.length >= 6, 'JSON-LD @graph must include FAQPage items');

const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
const precacheMatch = sw.match(/precacheAndRoute\(\s*\[([\s\S]*?)\]\s*,/);
assert.ok(precacheMatch, 'generated service worker must contain precacheAndRoute manifest');
const precacheUrls = [...precacheMatch[1].matchAll(/\burl\s*:\s*["']([^"']+)["']/g)].map(m => m[1]);
assert.ok(precacheUrls.length > 0, 'generated service worker precache list must be non-empty');
assert.equal(
  new Set(precacheUrls).size,
  precacheUrls.length,
  `generated service worker precache list must not contain duplicates: ${precacheUrls.filter((u, i) => precacheUrls.indexOf(u) !== i).join(', ')}`,
);

// Ukrainian page: its own HTML, reciprocal hreflang, Ukrainian metadata and precache entry.
const ukPath = path.join(dist, 'uk', 'index.html');
assert.ok(fs.existsSync(ukPath), 'generated build includes uk/index.html');
const ukHtml = fs.readFileSync(ukPath, 'utf8');
assert.match(ukHtml, /<html lang="uk">/, 'uk page declares lang="uk"');
assert.match(ukHtml, /<link rel="canonical" href="https:\/\/sivochka\.com\/OGCruncher\/uk\/" \/>/, 'uk canonical points to /uk/');
assert.match(ukHtml, /<meta property="og:url" content="https:\/\/sivochka\.com\/OGCruncher\/uk\/" \/>/, 'uk og:url equals canonical');
for (const page of [html, ukHtml]) {
  assert.match(page, /hreflang="en" href="https:\/\/sivochka\.com\/OGCruncher\/"/, 'both pages link the English alternate');
  assert.match(page, /hreflang="uk" href="https:\/\/sivochka\.com\/OGCruncher\/uk\/"/, 'both pages link the Ukrainian alternate');
  assert.match(page, /hreflang="x-default" href="https:\/\/sivochka\.com\/OGCruncher\/"/, 'both pages declare x-default');
  assert.doesNotMatch(page, /hreflang="[^"]+" href="[^"]*#/, 'hreflang targets never use a #fragment');
  const og = page.match(/<meta property="og:description" content="([^"]*)"/)[1];
  const tw = page.match(/<meta name="twitter:description" content="([^"]*)"/)[1];
  assert.equal(og, tw, 'og:description equals twitter:description');
}
const ukTitle = ukHtml.match(/<title>([^<]*)<\/title>/)[1];
assert.ok([...ukTitle].length <= 60, `uk <title> fits 60 characters (got ${[...ukTitle].length})`);
const ukDesc = ukHtml.match(/<meta name="description" content="([^"]*)"/)[1];
assert.ok([...ukDesc].length >= 120 && [...ukDesc].length <= 160, `uk description is 120–160 characters (got ${[...ukDesc].length})`);
const ukLd = JSON.parse(ukHtml.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)[1])['@graph'];
assert.ok(ukLd.some(item => item['@type'] === 'BreadcrumbList' && item['@id'] === 'https://sivochka.com/OGCruncher/uk/#breadcrumb'), 'uk breadcrumb @id matches its canonical');
assert.ok(ukLd.some(item => item.author?.['@id'] === 'https://sivochka.com#person'), 'uk JSON-LD keeps the shared #person entity');
assert.ok(ukLd.find(item => item['@type'] === 'FAQPage')?.mainEntity.length >= 6, 'uk JSON-LD includes FAQ items');
assert.match(ukHtml, /ОБРОБИТИ/, 'uk page body is translated');
assert.ok(precacheUrls.includes('uk/index.html'), 'service worker precaches uk/index.html');
assert.match(sw, /denylist:\[\/\\\/uk/, 'service worker navigation fallback skips /uk/');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<loc>https:\/\/sivochka\.com\/OGCruncher\/uk\/<\/loc>/, 'sitemap lists the Ukrainian page');

console.log('Generated build checks passed: manifest link, icons, meta tags, clear button, deduplicated service worker, and the Ukrainian page.');
