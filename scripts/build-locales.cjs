/**
 * Generates localized copies of index.html (currently uk/index.html) from the
 * English page and scripts/locales/<lang>.cjs.
 *
 *   node scripts/build-locales.cjs          write uk/index.html
 *   node scripts/build-locales.cjs --check  fail if uk/index.html is stale
 *
 * The generated page is committed so Vite builds it as a real second entry
 * (hashed assets, service-worker precache) and the dev server serves /uk/.
 * Every English source string must exist exactly as written; when the English
 * page changes, the generator fails and names the string to update.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const LOCALES = ['uk', 'pl', 'ru'];

const escapeAttr = text => String(text)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function replaceRequired(html, pattern, replacement, label) {
  if (pattern instanceof RegExp) {
    if (!pattern.test(html)) throw new Error(`[${label}] pattern not found in index.html: ${pattern}`);
    return html.replace(pattern, replacement);
  }
  if (!html.includes(pattern)) throw new Error(`[${label}] string not found in index.html:\n  ${pattern}`);
  return html.split(pattern).join(replacement);
}

function setMeta(html, regex, tag, label) {
  return replaceRequired(html, regex, () => tag, label);
}

// Latin words allowed on a localized page: brands, formats, units and engine names.
const LATIN_ALLOWLIST = new Set(('OGCruncher OGCRUNCHER OG Cruncher Figarist FIGARIST GitHub sivochka com '
  + 'WAV MP3 OGG Ogg Vorbis FLAC AIFF ZIP PCM HPF LPF TPDF NES BIT AMIGA Amiga LO-Q MODE '
  + 'Scratch SCRATCH Unity Godot WebGL WebGL- Wear OS iOS Safari APK EN UK dBFS kbps q0 '
  + 'Space Enter tanh tanh- Lanczos Lanczos- MPEG OfflineAudioContext Web Workers Worker Float32Array DSP '
  + 'AudioClip DC DC- SFX meta import RMS PEAK x k ogg wav mp3 crunched_8bit_22050hz TPDF- WAV- PCM- OGG- MP3- FS Lanczos-3 EQ FAQ DSP- PL RU').split(/\s+/));

function assertLocalizedPage(lang, html, englishHtml, allowEnglishIn) {
  const leftoverToken = html.match(/\$\d/);
  if (leftoverToken) throw new Error(`[${lang}] replacement token "${leftoverToken[0]}" leaked into the page`);
  for (const tag of ['section', 'aside', 'details', 'article', 'table', 'div', 'button', 'ul']) {
    const count = source => (source.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const closes = source => (source.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (count(html) !== closes(html)) throw new Error(`[${lang}] unbalanced <${tag}>: ${count(html)} open, ${closes(html)} close`);
    if (tag !== 'details' && count(html) !== count(englishHtml)) throw new Error(`[${lang}] <${tag}> count differs from English (${count(html)} vs ${count(englishHtml)})`);
  }
  // Visible text and user-facing attributes must not contain stray English words.
  let body = html.slice(html.indexOf('<body>'));
  allowEnglishIn.forEach(marker => { body = body.replace(marker, ''); });
  body = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<code>[\s\S]*?<\/code>/g, '').replace(/<kbd[\s\S]*?<\/kbd>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const texts = [...body.matchAll(/>([^<>]+)</g)].map(m => m[1]);
  const attrs = [...body.matchAll(/(?:title|aria-label|data-tooltip|alt|placeholder)="([^"]*)"/g)].map(m => m[1]);
  if (lang === 'pl') {
    for (const text of [...texts, ...attrs]) {
      const cyrillic = text.match(/[А-Яа-яЁёІіЇїЄєҐґ]+/g);
      if (cyrillic) throw new Error(`[${lang}] Cyrillic characters leaked into Polish page: ${cyrillic.join(', ')}`);
    }
    return;
  }
  const stray = new Set();
  for (const text of [...texts, ...attrs]) {
    if (lang === 'ru') {
      const ukLetters = text.match(/[ІіЇїЄєҐґ]+/g);
      if (ukLetters) throw new Error(`[${lang}] Ukrainian characters leaked into Russian page: ${ukLetters.join(', ')}`);
    }
    for (const word of text.replace(/&[a-z]+;/g, ' ').match(/[A-Za-z][A-Za-z_0-9-]*/g) || []) {
      if (!LATIN_ALLOWLIST.has(word) && !/^[A-Z]?\d|^\d/.test(word)) stray.add(word);
    }
  }
  if (stray.size) throw new Error(`[${lang}] untranslated words on the page: ${[...stray].join(', ')}`);
}

function buildLocale(lang) {
  const { meta, jsonLd, pairs } = require(`./locales/${lang}.cjs`);
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  html = replaceRequired(html, '<html lang="en">', `<html lang="${meta.lang}">`, 'html lang');
  html = setMeta(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(meta.title)}</title>`, 'title');
  html = setMeta(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeAttr(meta.description)}" />`, 'description');
  html = setMeta(html, /<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${escapeAttr(meta.keywords)}" />`, 'keywords');
  html = setMeta(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${meta.canonical}" />`, 'canonical');
  html = setMeta(html, /<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${meta.ogLocale}" />\n  <meta property="og:locale:alternate" content="en_US" />`, 'og:locale');
  html = setMeta(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${meta.canonical}" />`, 'og:url');
  html = setMeta(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeAttr(meta.title)}" />`, 'og:title');
  html = setMeta(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeAttr(meta.description)}" />`, 'og:description');
  html = setMeta(html, /<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${escapeAttr(meta.imageAlt)}" />`, 'og:image:alt');
  html = setMeta(html, /<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${meta.canonical}" />`, 'twitter:url');
  html = setMeta(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`, 'twitter:title');
  html = setMeta(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`, 'twitter:description');
  html = setMeta(html, /<meta name="twitter:image:alt" content="[^"]*" \/>/, `<meta name="twitter:image:alt" content="${escapeAttr(meta.imageAlt)}" />`, 'twitter:image:alt');

  const ld = JSON.stringify(jsonLd, null, 2).replace(/\n/g, '\n  ');
  html = replaceRequired(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    () => `<script type="application/ld+json">\n  ${ld}\n  </script>`,
    'json-ld',
  );

  pairs.forEach(([from, to], index) => {
    html = replaceRequired(html, from, typeof to === 'string' && from instanceof RegExp ? () => to : to, `${lang} pair #${index + 1}`);
  });

  const englishHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const localeCard = (html.match(/<aside class="seo-locale-card"[\s\S]*?<\/aside>/) || [''])[0];
  const langSwitch = (html.match(/<div class="lang-switch[\s\S]*?<\/div>/) || [''])[0];
  assertLocalizedPage(lang, html, englishHtml, [localeCard, langSwitch]);
  const banner = `<!-- Generated by scripts/build-locales.cjs from index.html + scripts/locales/${lang}.cjs. Do not edit by hand. -->`;
  return replaceRequired(html, '<!DOCTYPE html>\n', `<!DOCTYPE html>\n${banner}\n`, 'banner');
}

const check = process.argv.includes('--check');
let stale = 0;
for (const lang of LOCALES) {
  const out = path.join(root, lang, 'index.html');
  const html = buildLocale(lang);
  if (check) {
    const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
    if (current !== html) {
      stale++;
      console.error(`${lang}/index.html is stale: run node scripts/build-locales.cjs`);
    }
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html, 'utf8');
    console.log(`Generated ${lang}/index.html`);
  }
}
if (stale) process.exit(1);
if (check) console.log('Localized pages are up to date.');
