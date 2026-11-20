/**
 * Runtime strings for the localized pages.
 *
 * Static markup is translated at build time (scripts/build-locales.cjs writes
 * uk/index.html). This module only covers text that JavaScript writes after the
 * page loads. Keys are the English source strings, so the English page and the
 * Node regression harness (no `document`) get the original text unchanged.
 * Developer log lines stay in English on purpose: they are a technical console.
 */

export const LANG = (typeof document !== 'undefined' && document.documentElement
  && String(document.documentElement.lang || '').toLowerCase().startsWith('uk')) ? 'uk' : 'en';

const UK = {
  // Units
  'dB': 'дБ',
  'dBFS': 'дБFS',
  'kbps': 'кбіт/с',
  'bit': 'біт',
  'B': 'Б',
  'KB': 'КБ',
  'MB': 'МБ',
  's': 'с',
  'change unavailable': 'зміна невідома',

  // Worker progress labels
  'DSP…': 'обробка…',
  'Encoding OGG…': 'зберігаю OGG…',
  'Encoding WAV…': 'зберігаю WAV…',
  'Encoding MP3…': 'зберігаю MP3…',

  // Toggles and statuses
  'ON': 'УВІМК',
  'OFF': 'ВИМК',
  'MONO': 'МОНО',
  'STEREO': 'СТЕРЕО',
  'IDLE': 'ЧЕКАЮ',
  'PROCESSING': 'ОБРОБЛЯЮ',
  'CANCELLED': 'СКАСОВАНО',
  'PARTIAL': 'ЧАСТКОВО',
  'DONE': 'ГОТОВО',
  'FAILED': 'ПОМИЛКА',
  'WAITING': 'У ЧЕРЗІ',
  'WEB ONLY': 'ЛИШЕ ОНЛАЙН',
  '⬇ INSTALL APP': '⬇ ВСТАНОВИТИ',
  'Install OGCruncher as a standalone app': 'Встановити OGCruncher як окрему програму',
  'ANALYZING…': 'РАХУЮ…',
  'UNAVAILABLE': 'НЕВІДОМО',
  'PER-FORMAT': 'ДЛЯ КОЖНОГО ФОРМАТУ',
  'LOADING…': 'ЗАВАНТАЖУЮ…',
  'TRY DEMO TRACK 🎵': 'СПРОБУВАТИ НА ПРИКЛАДІ 🎵',
  'UPDATING…': 'ОНОВЛЮЮ…',
  'ACTIVATE & RELOAD': 'ОНОВИТИ Й ПЕРЕЗАВАНТАЖИТИ',

  // Buttons
  'CRUNCH': 'ОБРОБИТИ',
  'CRUNCHING…': 'ОБРОБЛЯЮ…',
  'PREVIEW': 'ПОСЛУХАТИ',
  'STOP': 'СТОП',
  'Preview selected audio': 'Послухати вибраний звук',
  'Stop preview': 'Зупинити прослуховування',
  'CRUNCHED (WET)': 'ОБРОБЛЕНИЙ',
  'ORIGINAL (DRY · OUTPUT SETTINGS)': 'ОРИГІНАЛ',
  'Compare crunched preview': 'Порівняти з обробленим',
  'Compare original dry preview': 'Порівняти з оригіналом',
  'Previewing: {name}': 'Зараз грає: {name}',
  'PACKING ZIP…': 'ПАКУЮ ZIP…',
  'DOWNLOAD ALL (.ZIP)': 'ЗАВАНТАЖИТИ ВСЕ (.ZIP)',
  'DOWNLOAD / DRAG': 'ЗАВАНТАЖ / ПЕРЕТЯГНИ',
  'Remove from queue': 'Прибрати з черги',
  'Remove {name} from queue': 'Прибрати {name} з черги',
  'DUAL VIEW: {state}': 'ДВА ГРАФІКИ: {state}',
  'Unavailable output formats': 'Формати, які не вдалося зберегти',
  '{format} unavailable: {message}': '{format}: не вдалося зберегти ({message})',

  // Simple mode tiers
  'TINY (MICRO)': 'МІНІ',
  'LOW (PORTABLE)': 'МАЛИЙ',
  'MEDIUM (RETRO)': 'СЕРЕДНІЙ',
  'HIGH': 'ВИСОКИЙ',
  'Micro size (8kHz / 8-bit) — telephone-like and intentionally lo-fi.':
    'Найменший файл (8 кГц / 8 біт) — звук як у старому телефоні.',
  'Low size (16kHz / 8-bit) — compact retro/mobile character.':
    'Малий файл (16 кГц / 8 біт) — компактний ретро-звук для телефона.',
  'Medium size (22.05kHz / 12-bit) — audible vintage texture.':
    'Середній файл (22 кГц / 12 біт) — чутно приємний «старий» відтінок.',
  'High quality (32kHz / 16-bit) — the least destructive Simple option.':
    'Висока якість (32 кГц / 16 біт) — звук змінюється найменше.',

  // Summaries
  'Simple': 'Простий режим',
  'Advanced': 'Детальний режим',
  'stereo': 'стерео',
  'mono': 'моно',
  'on': 'увімк',
  'off': 'вимк',
  '{mode} · {rate} Hz · {bits}-bit effect · {channels} output · filters {filters}':
    '{mode} · {rate} Гц · {bits} біт · {channels} · фільтри {filters}',
  'Codecs: {list}': 'Формати: {list}',
  'Original names': 'свої назви файлів',
  '{db} dBFS PEAK': '{db} дБFS ПІК',
  'File {index}/{total} — {label}': 'Файл {index}/{total} — {label}',
  'Completed: {full} full, {partial} partial; failed: {failed}; cancelled: {cancelled}; not attempted: {skipped}.':
    'Готово: {full} повністю, {partial} частково; помилок: {failed}; скасовано: {cancelled}; не оброблено: {skipped}.',
  '{count} files ready': '{count} файлів готово',
  '{count} file ready': '{count} файл готовий',

  // Toasts
  'Processing cancelled.': 'Обробку скасовано.',
  '{full} full · {partial} partial · {failed} failed': '{full} повністю · {partial} частково · {failed} з помилкою',
  '✅ {count} file(s) crunched.': '✅ Оброблено файлів: {count}.',
  '📦 ZIP archive downloaded.': '📦 ZIP-архів завантажено.',
  '⚠ Failed to build ZIP archive.': '⚠ Не вдалося зібрати ZIP-архів.',
  '🎵 Demo track loaded.': '🎵 Приклад завантажено.',
  'Demo track unavailable.': 'Приклад зараз недоступний.',
  'Keep at least one export format enabled.': 'Залиш увімкненим хоча б один формат.',
  '🔗 Link copied to clipboard': '🔗 Посилання скопійовано',
  '⚠ Copy manually from address bar': '⚠ Скопіюй посилання з адресного рядка',
  '◉ author preset loaded': '◉ Набір LO-Q увімкнено',
  '🎮 NES 8-bit preset loaded': '🎮 Набір NES 8-BIT увімкнено',
  '💾 Amiga 500 preset loaded': '💾 Набір AMIGA 500 увімкнено',
  '👤 custom preset loaded': '👤 Твій набір увімкнено',
  '❌ Failed to load custom preset': '❌ Не вдалося відкрити твій набір',
  '💾 custom preset saved': '💾 Твій набір збережено',
  '↩ undo': '↩ скасовано',
  '↪ redo': '↪ повернуто',
  '✅ App installed!': '✅ Програму встановлено!',
  '{count} exact duplicate file was already queued and not added again. Re-selected files remain separate unless they are the same File object.':
    'Цей файл уже є в черзі, тому другий раз його не додано.',
  '{count} exact duplicate files were already queued and not added again. Re-selected files remain separate unless they are the same File object.':
    'Ці файли вже є в черзі ({count}), тому другий раз їх не додано.',
  '🧩 Scratch: WAV only. Keep each sound under 10 MB.': '🧩 Для Scratch: лише WAV. Кожен звук — до 10 МБ.',
  '{name} is {size}: larger than Scratch’s 10 MB limit.': '{name} важить {size} — це більше за ліміт Scratch у 10 МБ.',

  // The few log lines a first-time visitor reads
  'ready. drop files or click browse.': 'готово. перетягни файли або натисни «обери файли».',
  'Demo track loaded successfully.': 'Приклад завантажено.',
  '{added} file(s) added. Queue: {total} total.': 'Додано файлів: {added}. У черзі всього: {total}.',
  'Offline cache is unavailable; the audio workflow still runs online.': 'Офлайн-кеш недоступний, але онлайн усе працює.',

  // Service worker update notice
  'A new version is ready. Reload is safe now; no queued files or generated results were detected.':
    'Є нова версія. Можна оновити сторінку: у черзі немає файлів і готових результатів.',
  'Activate the waiting update and reload the page.': 'Увімкнути нову версію й перезавантажити сторінку.',
  'Update waiting. Finish or download your work, then clear the queue before activating; reload clears in-memory audio state.':
    'Є оновлення. Спершу збережи свої файли й очисти чергу: після перезавантаження вони зникнуть.',
  'Reload is disabled while queued files, preview, processing, or results are present.':
    'Оновлення недоступне, поки в черзі є файли, грає звук або є готові результати.',
  'Update activation requested. The page will reload after the new worker takes control.':
    'Оновлюю… Сторінка перезавантажиться сама.',
};

const DICTIONARIES = { uk: UK };

/** Translate an English source string; `{name}` placeholders are filled from vars. */
export function t(text, vars) {
  const dict = DICTIONARIES[LANG];
  let out = (dict && Object.prototype.hasOwnProperty.call(dict, text)) ? dict[text] : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
  return out;
}

/** Ukrainian needs three plural forms; English needs two. */
export function plural(count, forms) {
  const n = Math.abs(Number(count) || 0);
  if (LANG !== 'uk') return n === 1 ? forms.one : forms.other;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
  return forms.many;
}

/** Number formatting that matches the page language (12 000 vs 12,000). */
export function formatNumber(value) {
  return Number(value).toLocaleString(LANG === 'uk' ? 'uk-UA' : 'en-US');
}

/** "Hz" unit in the page language. */
export function hz(value) {
  return `${formatNumber(value)} ${LANG === 'uk' ? 'Гц' : 'Hz'}`;
}
