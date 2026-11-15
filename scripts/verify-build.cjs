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
assert.doesNotMatch(html, /figarist\.github\.io/i, 'generated HTML must not reference legacy figarist.github.io domain');

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

console.log('Generated build checks passed: manifest link, icons, meta tags, clear button, and deduplicated service worker.');
