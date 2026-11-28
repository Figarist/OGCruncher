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

// Localized pages: uk, pl, ru — reciprocal hreflang, localized metadata, precache, and i18n parity.
const LOCALE_CHECKS = [
  { lang: 'uk', marker: /ОБРОБИТИ/ },
  { lang: 'pl', marker: /PRZETWÓRZ/ },
  { lang: 'ru', marker: /ОБРАБОТАТЬ/ },
];
const allPages = [html];
for (const { lang, marker } of LOCALE_CHECKS) {
  const locPath = path.join(dist, lang, 'index.html');
  assert.ok(fs.existsSync(locPath), `generated build includes ${lang}/index.html`);
  const locHtml = fs.readFileSync(locPath, 'utf8');
  allPages.push(locHtml);
  assert.match(locHtml, new RegExp(`<html lang="${lang}">`), `${lang} page declares lang="${lang}"`);
  assert.match(locHtml, new RegExp(`<link rel="canonical" href="https:\\/\\/sivochka\\.com\\/OGCruncher\\/${lang}\\/" \\/>`), `${lang} canonical points to /${lang}/`);
  assert.match(locHtml, new RegExp(`<meta property="og:url" content="https:\\/\\/sivochka\\.com\\/OGCruncher\\/${lang}\\/" \\/>`), `${lang} og:url equals canonical`);
  const locTitle = locHtml.match(/<title>([^<]*)<\/title>/)[1];
  assert.ok([...locTitle].length <= 60, `${lang} <title> fits 60 characters (got ${[...locTitle].length})`);
  const locDesc = locHtml.match(/<meta name="description" content="([^"]*)"/)[1];
  assert.ok([...locDesc].length >= 120 && [...locDesc].length <= 160, `${lang} description is 120–160 characters (got ${[...locDesc].length})`);
  const locLd = JSON.parse(locHtml.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)[1])['@graph'];
  assert.ok(locLd.some(item => item['@type'] === 'BreadcrumbList' && item['@id'] === `https://sivochka.com/OGCruncher/${lang}/#breadcrumb`), `${lang} breadcrumb @id matches its canonical`);
  assert.ok(locLd.some(item => item.author?.['@id'] === 'https://sivochka.com#person'), `${lang} JSON-LD keeps the shared #person entity`);
  assert.ok(locLd.find(item => item['@type'] === 'FAQPage')?.mainEntity.length >= 6, `${lang} JSON-LD includes FAQ items`);
  assert.match(locHtml, marker, `${lang} page body is translated`);
  assert.ok(precacheUrls.includes(`${lang}/index.html`), `service worker precaches ${lang}/index.html`);
}

for (const page of allPages) {
  assert.match(page, /hreflang="en" href="https:\/\/sivochka\.com\/OGCruncher\/"/, 'every page links the English alternate');
  assert.match(page, /hreflang="uk" href="https:\/\/sivochka\.com\/OGCruncher\/uk\/"/, 'every page links the Ukrainian alternate');
  assert.match(page, /hreflang="pl" href="https:\/\/sivochka\.com\/OGCruncher\/pl\/"/, 'every page links the Polish alternate');
  assert.match(page, /hreflang="ru" href="https:\/\/sivochka\.com\/OGCruncher\/ru\/"/, 'every page links the Russian alternate');
  assert.match(page, /hreflang="x-default" href="https:\/\/sivochka\.com\/OGCruncher\/"/, 'every page declares x-default');
  assert.doesNotMatch(page, /hreflang="[^"]+" href="[^"]*#/, 'hreflang targets never use a #fragment');
  const og = page.match(/<meta property="og:description" content="([^"]*)"/)[1];
  const tw = page.match(/<meta name="twitter:description" content="([^"]*)"/)[1];
  assert.equal(og, tw, 'og:description equals twitter:description');
}

assert.match(sw, /denylist:\[\/\\\/\(\?:uk\|pl\|ru\)/, 'service worker navigation fallback skips /uk/, /pl/, /ru/');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
for (const lang of ['uk', 'pl', 'ru']) {
  assert.match(sitemap, new RegExp(`<loc>https:\\/\\/sivochka\\.com\\/OGCruncher\\/${lang}\\/<\\/loc>`), `sitemap lists the ${lang} page`);
}

// Verify 100% key parity across uk, pl, ru in js/i18n.js and no Ukrainian Cyrillic leaks in pl/ru.
const i18nSrc = fs.readFileSync(path.join(root, 'js', 'i18n.js'), 'utf8');
function extractDict(name) {
  const start = i18nSrc.indexOf(`const ${name} = {`);
  assert.ok(start !== -1, `js/i18n.js defines ${name}`);
  const end = i18nSrc.indexOf('\n};', start);
  assert.ok(end !== -1, `js/i18n.js closes ${name}`);
  const block = i18nSrc.slice(start, end);
  const keys = [...block.matchAll(/^\s*'((?:[^'\\]|\\.)*)':/gm)].map(m => m[1]);
  return { block, keys };
}
const dicts = { UK: extractDict('UK'), PL: extractDict('PL'), RU: extractDict('RU') };
const ukKeySet = new Set(dicts.UK.keys);
for (const lang of ['PL', 'RU']) {
  const keySet = new Set(dicts[lang].keys);
  const missing = dicts.UK.keys.filter(k => !keySet.has(k));
  const extra = dicts[lang].keys.filter(k => !ukKeySet.has(k));
  assert.deepEqual(missing, [], `${lang} dictionary is missing keys from UK: ${missing.join(', ')}`);
  assert.deepEqual(extra, [], `${lang} dictionary has extra keys not in UK: ${extra.join(', ')}`);
  const ukLetters = dicts[lang].block.match(/[іїєґІЇЄҐ]+/g);
  assert.equal(ukLetters, null, `${lang} dictionary must not contain Ukrainian letters (found: ${(ukLetters || []).join(', ')})`);
}
const plCyrillic = dicts.PL.block.match(/[А-Яа-яЁё]+/g);
assert.equal(plCyrillic, null, `PL dictionary must not contain Cyrillic letters (found: ${(plCyrillic || []).join(', ')})`);

console.log('Generated build checks passed: manifest link, icons, meta tags, clear button, deduplicated service worker, 4-locale parity, and uk/pl/ru pages.');
