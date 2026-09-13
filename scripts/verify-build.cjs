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
console.log('Generated build checks passed: one base-path manifest link, manifest icons, and service worker.');
