/**
 * Ukrainian page source: exact English → Ukrainian replacements applied to
 * index.html by scripts/build-locales.cjs. Every English string must exist in
 * index.html; the generator fails loudly when the English page drifts.
 *
 * Audience: Ukrainian game developers and kids (9–12) who make Scratch games,
 * so labels use plain words; technical terms stay where developers expect them.
 */

const BASE = 'https://sivochka.com/OGCruncher/uk/';

const meta = {
  lang: 'uk',
  ogLocale: 'uk_UA',
  canonical: BASE,
  title: 'OGCruncher — біткрашер і конвертер звуку онлайн',
  description: 'Безкоштовний біткрашер онлайн: зменш бітність і частоту звуку, збережи його у WAV, MP3 чи OGG для Unity, Godot або Scratch. Файли лишаються в браузері.',
  imageAlt: 'OGCruncher — безкоштовний біткрашер, зменшення частоти дискретизації та пакетне збереження у OGG/WAV/MP3',
  keywords: 'OGCruncher, біткрашер онлайн, 8-біт звук онлайн, конвертер звуку для ігор, звук для Scratch, WAV для Scratch, стиснути звук для Unity, ретро звук, lo-fi звук, зменшити частоту дискретизації, конвертер OGG WAV MP3',
};

const faq = [
  {
    q: 'Що таке OGCruncher і чим він відрізняється від звичайного конвертера?',
    a: 'OGCruncher — безкоштовний браузерний біткрашер і пакетний конвертер звуку для розробників ігор, Wear OS і ретро-проєктів. Він не просто перекодовує файл, а навмисно змінює звук: фільтри й швидкість через OfflineAudioContext, м’який експандер, квантування 1–16 біт, TPDF-дизер і tanh-сатурацію. Потім зберігає результат у OGG, WAV і MP3.',
  },
  {
    q: 'Мої файли кудись завантажуються?',
    a: 'Ні. Звук лишається на твоєму пристрої: декодування, фільтри, обробка й кодування в OGG/WAV/MP3 відбуваються в браузері та окремому Web Worker. З мережі завантажуються лише файли самого сайту й, за бажанням, приклад звуку.',
  },
  {
    q: 'Який формат обрати для Scratch 3.0?',
    a: 'Натисни кнопку «ДЛЯ SCRATCH»: інструмент збереже один WAV-файл на кожен звук. Scratch 3.0 відкриває WAV і MP3, а OGG не відкриває. Один звук має важити до 10 МБ; для довгої музики обери MP3 або нижчу якість.',
  },
  {
    q: 'Як OGCruncher обирає між 8-бітним і 16-бітним WAV?',
    a: 'Розрядність WAV підлаштовується під повзунок «БІТНІСТЬ»: від 1 до 8 біт файл зберігається як 8-бітний PCM WAV, від 9 до 16 біт — як 16-бітний. Так короткі 8-бітні ефекти лишаються маленькими, а 12- чи 16-бітні не втрачають точності.',
  },
  {
    q: 'Який формат і частоту обрати для Unity, Godot, WebGL чи Wear OS?',
    a: 'Для коротких кліків інтерфейсу, кроків і ударів бери моно PCM WAV 8 або 16 біт на 16 000–22 050 Гц: він грає миттєво без декодування. Для фонових лупів і музики бери Ogg Vorbis на 22 050–32 000 Гц, коли важить розмір APK чи WebGL-збірки. Unity все одно перекодовує імпортовані WAV за налаштуваннями AudioClip, а Safari/iOS підтримує OGG обмежено, тож для WebGL додай MP3 як запасний варіант.',
  },
  {
    q: 'Чому MP3 на дуже низькій частоті (наприклад 4 000 Гц) зберігається як 8 000 Гц?',
    a: 'Стандарт MPEG для MP3 має лише дев’ять частот, найнижча — 8 000 Гц (8k, 11.025k, 12k, 16k, 22.05k, 24k, 32k, 44.1k і 48k). Якщо обрати нестандартну частоту, як-от 4 000 чи 28 000 Гц, WAV і OGG зберігають її точно, а MP3 перераховується вікновим Lanczos-3 до найближчої дозволеної частоти. На 8–12 кГц MP3 має 64 кбіт/с, вище — 128 кбіт/с.',
  },
  {
    q: 'Як працює пакетна обробка, ZIP і посилання з налаштуваннями?',
    a: 'Додай кілька файлів у чергу, налаштуй звук і натисни «ОБРОБИТИ»: усі файли пройдуть з однаковими налаштуваннями. Потім завантаж кожен файл окремо, усе разом кнопкою «ЗАВАНТАЖИТИ ВСЕ (.ZIP)» або натисни «КОПІЮВАТИ ПОСИЛАННЯ», щоб поділитися налаштуваннями.',
  },
  {
    q: 'Як за 10 секунд зробити 8-бітний звук для Unity чи Godot?',
    a: 'Додай чистий звук стрибка чи удару у WAV або MP3, постав бітність 4–8 і частоту 11 025–16 000 Гц (моно), увімкни краш-режим і збережи у OGG або 8-бітний WAV.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE}#app`,
      name: 'OGCruncher',
      alternateName: ['OG Cruncher', 'OGCruncher біткрашер', 'Figarist OGCruncher'],
      url: BASE,
      inLanguage: 'uk',
      description: 'Безкоштовний браузерний біткрашер, зменшення частоти дискретизації та пакетне збереження звуку у OGG/WAV/MP3 на OfflineAudioContext і Web Workers.',
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'Обробка звуку для ігор',
      operatingSystem: 'Будь-який браузер (Windows, macOS, Linux, Android, iOS)',
      browserRequirements: 'Потрібні Web Audio API (OfflineAudioContext) і Web Workers',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Квантування звуку 1–16 біт і краш-режим (прибирання DC-зсуву, м’який експандер, антиаліасинг)',
        'Частота дискретизації від 4 000 до 48 000 Гц зі швидкими стандартними значеннями',
        'Tanh-сатурація, шум стрічки та TPDF-дизер',
        'Фільтри HPF і LPF, підсилення басу на 80 Гц, швидкість/тон і нормалізація піку до -1 або 0 дБFS',
        'Обробка повністю в браузері, без завантаження файлів',
        'Пакетне збереження у вибрані формати OGG, 8/16-бітний WAV і MP3, початкові назви файлів і ZIP-архів',
        'Обрізання тиші на початку й у кінці з короткими згасаннями без клацань',
        'Кнопка «ДЛЯ SCRATCH»: один WAV-файл на звук для Scratch 3.0',
      ],
      image: 'https://sivochka.com/OGCruncher/images/social-card.png',
      author: {
        '@type': 'Person',
        '@id': 'https://sivochka.com#person',
        name: 'Ігор Сівочка',
        alternateName: ['Ihor Sivochka', 'Sivochka Ihor', 'Ігор Глібович Сівочка', 'Игорь Сивочка', 'Figarist'],
        url: 'https://sivochka.com/',
        sameAs: ['https://sivochka.com/', 'https://github.com/Figarist/OGCruncher'],
      },
      creator: { '@id': 'https://sivochka.com#person' },
      isPartOf: { '@type': 'WebSite', '@id': 'https://sivochka.com#website', name: 'Figarist — Ihor Sivochka', url: 'https://sivochka.com/' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${BASE}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Figarist', item: 'https://sivochka.com/' },
        { '@type': 'ListItem', position: 2, name: 'OGCruncher', item: 'https://sivochka.com/OGCruncher/' },
        { '@type': 'ListItem', position: 3, name: 'Українською', item: BASE },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}#faq`,
      inLanguage: 'uk',
      mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ],
};

const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const faqHtml = faq.map((item, index) => `      <details class="faq-item"${index === 0 ? ' open' : ''}>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`).join('\n');

/** [english, ukrainian] pairs; each English string must appear in index.html. */
const pairs = [
  // Paths: uk/index.html lives one folder deeper.
  ['<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="../style.css" />'],
  ['<script type="module" src="js/main.js"></script>', '<script type="module" src="../js/main.js"></script>'],

  // Header
  ['aria-label="Back to Figarist"', 'aria-label="На сайт Figarist"'],
  ['<span class="logo-title__kw"> Free Online Audio Bit-Crusher &amp; Compressor</span>', '<span class="logo-title__kw"> безкоштовний біткрашер і конвертер звуку онлайн</span>'],
  ['aria-label="OGCruncher navigation"', 'aria-label="Навігація OGCruncher"'],
  ['title="Install OGCruncher as a standalone app" hidden>⬇ INSTALL APP</button>', 'title="Встановити OGCruncher як окрему програму" hidden>⬇ ВСТАНОВИТИ</button>'],
  ['<div class="lang-switch notranslate" translate="no" role="group" aria-label="Language">', '<div class="lang-switch notranslate" translate="no" role="group" aria-label="Мова">'],
  ['<a class="lang-switch__item is-active" href="./" hreflang="en" lang="en" aria-current="page">EN</a>', '<a class="lang-switch__item" href="../" hreflang="en" lang="en" title="English version">EN</a>'],
  ['<a class="lang-switch__item" href="uk/" hreflang="uk" lang="uk" title="Українська версія">УКР</a>', '<a class="lang-switch__item is-active" href="./" hreflang="uk" lang="uk" aria-current="page">УКР</a>'],
  ['title="About OGCruncher">ABOUT</button>', 'title="Про OGCruncher">ПРО САЙТ</button>'],

  // Intro
  ['aria-label="OGCruncher status"', 'aria-label="Стан OGCruncher"'],
  ['<span class="tool-intro__kicker">A SMALL TOOL FOR BIG SOUNDS</span>', '<span class="tool-intro__kicker">МАЛЕНЬКИЙ ІНСТРУМЕНТ ДЛЯ ВЕЛИКИХ ЗВУКІВ</span>'],
  ['<p>Shape, preview and export game audio without leaving your browser.</p>', '<p>Зміни звук, послухай, що вийшло, і збережи його для гри — усе в браузері.</p>'],
  ['</span> Files stay in this browser</span>', '</span> Файли нікуди не відправляються</span>'],

  // Input panel
  ['aria-label="Audio processing workspace"', 'aria-label="Робоча зона обробки звуку"'],
  ['aria-label="File input panel"', 'aria-label="Панель файлів"'],
  ['<div class="panel-label" aria-hidden="true">[ INPUT ]</div>', '<div class="panel-label" aria-hidden="true">[ ФАЙЛИ ]</div>'],
  ['title="Show both spectra simultaneously">DUAL VIEW: OFF</button>', 'title="Показати обидва графіки одночасно">ДВА ГРАФІКИ: ВИМК</button>'],
  ['aria-label="Drag and drop audio files here"', 'aria-label="Перетягни сюди звукові файли"'],
  ['<p class="drop-title">DROP AUDIO FILES HERE</p>', '<p class="drop-title">ПЕРЕТЯГНИ СЮДИ ЗВУКИ</p>'],
  ['<p class="drop-sub">or <label for="file-input" class="file-label-btn">BROWSE FILES</label></p>', '<p class="drop-sub">або <label for="file-input" class="file-label-btn">ОБЕРИ ФАЙЛИ</label></p>'],
  ['title="Test OGCruncher with a pre-loaded track"', 'title="Спробувати OGCruncher на готовому звуку"'],
  ['<span id="btn-load-demo-label">TRY DEMO TRACK 🎵</span>', '<span id="btn-load-demo-label">СПРОБУВАТИ НА ПРИКЛАДІ 🎵</span>'],
  ['<span class="metrics-label">RMS</span>', '<span class="metrics-label" title="Середня гучність (RMS)">СЕРЕДН.</span>'],
  ['<span class="metrics-label">PEAK</span>', '<span class="metrics-label" title="Найгучніша точка (PEAK)">ПІК</span>'],
  ['<span class="metrics-label">DUR</span>', '<span class="metrics-label" title="Тривалість">ЧАС</span>'],
  ['DRY —</span>', 'БУЛО —</span>'],
  ['WET —</span>', 'СТАЛО —</span>'],
  ['aria-label="Choose audio files"', 'aria-label="Обрати звукові файли"'],
  ['<span class="panel-label" style="margin:0">[ QUEUE ]</span>', '<span class="panel-label" style="margin:0">[ ЧЕРГА ]</span>'],
  ['aria-label="Clear queue">CLEAR</button>', 'aria-label="Очистити чергу">ОЧИСТИТИ</button>'],
  ['aria-label="Processing queue"', 'aria-label="Черга обробки"'],
  ['<span class="savings-title-text">⚡ SIZE OUTLOOK · METADATA-BACKED ESTIMATES</span>', '<span class="savings-title-text">⚡ СКІЛЬКИ ВАЖИТИМЕ · ОРІЄНТОВНО</span>'],
  ['class="badge badge--amber">ANALYZING…</span>', 'class="badge badge--amber">РАХУЮ…</span>'],
  ['<span class="savings-label">ORIGINAL</span>', '<span class="savings-label">БУЛО</span>'],
  ['<span class="savings-label">EST. WAV</span>', '<span class="savings-label">≈ WAV</span>'],
  ['<span class="savings-label">EST. OGG RANGE</span>', '<span class="savings-label">≈ OGG</span>'],
  ['<span class="savings-label">EST. MP3</span>', '<span class="savings-label">≈ MP3</span>'],
  ['aria-label="Resize input panel"', 'aria-label="Змінити ширину панелі файлів"'],

  // Controls
  ['aria-label="Processing controls"', 'aria-label="Налаштування обробки"'],
  ['<div class="panel-label" aria-hidden="true">[ PARAMETERS ]</div>', '<div class="panel-label" aria-hidden="true">[ НАЛАШТУВАННЯ ]</div>'],
  ['aria-label="Processing mode"', 'aria-label="Режим"'],
  ['aria-label="Switch to Simple mode">SIMPLE</button>', 'aria-label="Простий режим">ПРОСТО</button>'],
  ['aria-label="Switch to Advanced mode">ADVANCED</button>', 'aria-label="Детальний режим">ДЕТАЛЬНО</button>'],
  ['<span class="control-label">PRESETS</span>', '<span class="control-label">ГОТОВІ НАБОРИ</span>'],
  ['title="Copy current settings as a shareable link">COPY LINK</button>', 'title="Скопіювати налаштування як посилання">КОПІЮВАТИ ПОСИЛАННЯ</button>'],
  ['title="Save current settings as your custom preset">SAVE CURRENT</button>', 'title="Зберегти поточні налаштування як свій набір">ЗБЕРЕГТИ МІЙ</button>'],
  ['aria-label="Apply Author\'s LO-Q preset (8-bit, 22050Hz)"', 'aria-label="Набір автора LO-Q (8 біт, 22050 Гц)"'],
  ['<span class="preset-card__meta">8-bit / 22k Hz</span>', '<span class="preset-card__meta">8 біт / 22 кГц</span>'],
  ['aria-label="Apply retro gaming NES preset (4-bit, 12000Hz)"', 'aria-label="Ретро-набір NES (4 біти, 12000 Гц)"'],
  ['<span class="preset-card__meta">4-bit / 12k Hz</span>', '<span class="preset-card__meta">4 біти / 12 кГц</span>'],
  ['aria-label="Apply vintage sampler Amiga 500 preset (8-bit, 28000Hz)"', 'aria-label="Набір старого семплера Amiga 500 (8 біт, 28000 Гц)"'],
  ['<span class="preset-card__meta">8-bit / 28k Hz</span>', '<span class="preset-card__meta">8 біт / 28 кГц</span>'],
  ['aria-label="Apply your custom preset" disabled>', 'aria-label="Твій набір" disabled>'],
  ['<span class="preset-card__title">MY PRESET</span>', '<span class="preset-card__title">МІЙ НАБІР</span>'],
  ['<span id="preset-user-meta" class="preset-card__meta">NOT SAVED</span>', '<span id="preset-user-meta" class="preset-card__meta">НЕ ЗБЕРЕЖЕНО</span>'],
  ['<span class="control-label">SIZE & QUALITY</span>', '<span class="control-label">РОЗМІР І ЯКІСТЬ</span>'],
  ['<span id="out-simple-quality" class="control-value">HIGH</span>', '<span id="out-simple-quality" class="control-value">ВИСОКИЙ</span>'],
  ['aria-label="Adjust size and quality"', 'aria-label="Розмір і якість"'],
  ['data-val="0">TINY</span>', 'data-val="0">МІНІ</span>'],
  ['data-val="1">LOW</span>', 'data-val="1">МАЛИЙ</span>'],
  ['data-val="2">MEDIUM</span>', 'data-val="2">СЕРЕДНІЙ</span>'],
  ['data-val="3">HIGH</span>', 'data-val="3">ВИСОКИЙ</span>'],
  ['<p class="simple-desc" id="simple-quality-desc">High Quality (32kHz / 16-bit) — clear and optimized.</p>', '<p class="simple-desc" id="simple-quality-desc">Висока якість (32 кГц / 16 біт) — звук змінюється найменше.</p>'],
  ['data-tooltip="Audio resolution (bits). Lower bits = more \'pixelated\' noise and lo-fi artifacts.">BIT DEPTH</label>', 'data-tooltip="Точність звуку в бітах. Менше бітів — більше «піксельного» хрусту, як у старих іграх.">БІТНІСТЬ</label>'],
  ['aria-label="Bit depth"', 'aria-label="Бітність"'],
  ['data-tooltip="Sampling frequency. Lower values make audio muffled and add metallic aliasing.">RATE</label>', 'data-tooltip="Частота дискретизації. Чим менша, тим глухіший звук і тим більше металевого дзвону.">ЧАСТОТА</label>'],
  ['22050 <span class="unit">Hz</span></output>', '22050 <span class="unit">Гц</span></output>'],
  ['aria-label="Sample rate in Hz"', 'aria-label="Частота дискретизації в герцах"'],
  ['data-tooltip="Saturation drive (tanh). 1.0 is clean bypass (OFF); higher values add harmonic density.">GRIT</label>', 'data-tooltip="Сатурація (tanh). 1.0 — без змін (ВИМК), більше — щільніший і гучніший звук.">ХРУСТ</label>'],
  ['<output id="out-grit" for="slider-grit" class="control-value">OFF</output>', '<output id="out-grit" for="slider-grit" class="control-value">ВИМК</output>'],
  ['aria-label="Saturation drive amount"', 'aria-label="Сила сатурації"'],
  ['data-tooltip="Adds subtle floor hiss of vintage gear or tape (shown in dBFS).">NOISE</label>', 'data-tooltip="Додає тихе шипіння, як у старої техніки чи касети (у дБFS).">ШУМ</label>'],
  ['<output id="out-noise" for="slider-noise" class="control-value">OFF</output>', '<output id="out-noise" for="slider-noise" class="control-value">ВИМК</output>'],
  ['aria-label="Noise floor level"', 'aria-label="Рівень шуму"'],
  ['data-tooltip="Creative bit-crush pipeline: DC removal, |x|^1.15 soft expander, quantization, and 2-tap anti-alias smoothing.">CRUSH MODE</label>', 'data-tooltip="Творчий біткраш: прибирання DC-зсуву, м’який експандер |x|^1.15, квантування та згладжування від аліасингу.">КРАШ-РЕЖИМ</label>'],
  ['<span id="out-mariomode" class="control-value" aria-live="polite">ON</span>', '<span id="out-mariomode" class="control-value" aria-live="polite">УВІМК</span>'],
  ['title="DC removal, soft expander (|x|^1.15), quantization, and 2-tap anti-alias smoothing"', 'title="Прибирання DC-зсуву, м’який експандер (|x|^1.15), квантування та згладжування"'],
  ['aria-label="Enable expander, dither and anti-alias pipeline"', 'aria-label="Увімкнути краш-режим"'],
  ['<span class="toggle-label-text">EXPANDER</span>', '<span class="toggle-label-text">ЕКСПАНДЕР</span>'],
  ['data-tooltip="Adds triangular TPDF dither to soften quantization distortion. Turn OFF for raw retro grit.">DITHER</label>', 'data-tooltip="Трикутний TPDF-дизер пом’якшує спотворення від малої бітності. Вимкни для грубого ретро-хрусту.">ДИЗЕР</label>'],
  ['<span id="out-dither" class="control-value" aria-live="polite">ON</span>', '<span id="out-dither" class="control-value" aria-live="polite">УВІМК</span>'],
  ['aria-label="Toggle triangular TPDF dither noise"', 'aria-label="Увімкнути TPDF-дизер"'],
  ['data-tooltip="Normalizes output peak to -1 dBFS (safe headroom for OGG/MP3) or 0 dBFS full scale.">NORMALIZE</label>', 'data-tooltip="Вирівнює найгучнішу точку до -1 дБFS (безпечний запас для OGG/MP3) або до 0 дБFS.">ГУЧНІСТЬ</label>'],
  ['title="Toggle normalization ceiling between -1 dBFS (safe headroom for lossy codecs) and 0 dBFS">-1 dB</button>', 'title="Перемкнути стелю між -1 дБFS (запас для OGG/MP3) і 0 дБFS">-1 дБ</button>'],
  ['<span id="out-normalize" class="control-value">ON</span>', '<span id="out-normalize" class="control-value">УВІМК</span>'],
  ['aria-label="Enable peak normalization"', 'aria-label="Вирівнювати гучність"'],
  ['data-tooltip="Converts stereo to mono. Perfect for game SFX to save memory and CPU.">OUTPUT</label>', 'data-tooltip="Робить зі стерео моно. Для ігрових ефектів це економить пам’ять і процесор.">КАНАЛИ</label>'],
  ['<span id="out-stereo" class="control-value">MONO</span>', '<span id="out-stereo" class="control-value">МОНО</span>'],
  ['aria-label="Toggle between Mono and Stereo output"', 'aria-label="Моно або стерео"'],
  ['<span class="toggle-label-text">FORCE MONO</span>', '<span class="toggle-label-text">ЗАВЖДИ МОНО</span>'],
  ['data-tooltip="Trims leading and trailing silence below -48 dBFS and applies a 4 ms click-free micro-fade.">TRIM SILENCE</label>', 'data-tooltip="Обрізає тишу (тихіше за -48 дБFS) на початку й у кінці та робить коротке згасання без клацань.">ОБРІЗАТИ ТИШУ</label>'],
  ['<span id="out-trim" class="control-value" aria-live="polite">OFF</span>', '<span id="out-trim" class="control-value" aria-live="polite">ВИМК</span>'],
  ['aria-label="Enable auto-trim silence with micro-fade"', 'aria-label="Обрізати тишу"'],
  ['<span class="toggle-label-text">-48 dB + FADE</span>', '<span class="toggle-label-text">-48 дБ + ЗГАСАННЯ</span>'],
  ['data-tooltip="Adjust playback speed. Lowering it creates a \'slow & chopped\' effect with lower pitch.">SPEED / PITCH</label>', 'data-tooltip="Швидкість відтворення. Повільніше — нижчий голос, швидше — вищий.">ШВИДКІСТЬ / ТОН</label>'],
  ['aria-label="Playback speed and pitch"', 'aria-label="Швидкість і тон"'],
  ['data-tooltip="Fine-tune frequencies to shape your lo-fi sound.">FILTERS & EQ</span>', 'data-tooltip="Тонко прибери або додай частоти.">ФІЛЬТРИ</span>'],
  ['data-tooltip="Cuts low frequencies (rumble). Helps remove muddy bass and clear up the mix.">HPF (CUT LOWS)</label>', 'data-tooltip="Прибирає низькі частоти (гул). Звук стає чистішим.">HPF (ПРИБРАТИ НИЗИ)</label>'],
  ['<output id="out-hpf" class="filter-value">20 Hz</output>', '<output id="out-hpf" class="filter-value">20 Гц</output>'],
  ['data-tooltip="Cuts high frequencies. Makes sound soft, \'underwater\' or phone-like.">LPF (CUT HIGHS)</label>', 'data-tooltip="Прибирає високі частоти. Звук стає м’яким, як під водою чи в телефоні.">LPF (ПРИБРАТИ ВЕРХИ)</label>'],
  ['<output id="out-lpf" class="filter-value">OFF</output>', '<output id="out-lpf" class="filter-value">ВИМК</output>'],
  ['data-tooltip="Enhances low-end frequencies for a deeper and more powerful punch.">BASS BOOST (80Hz)</label>', 'data-tooltip="Додає низьких частот, щоб удар був глибшим і сильнішим.">БІЛЬШЕ БАСУ (80 Гц)</label>'],
  ['<summary>HOW SETTINGS WORK</summary>', '<summary>ЯК ПРАЦЮЮТЬ НАЛАШТУВАННЯ</summary>'],
  [`<p>Simple mode selects a complete quality tier. Advanced mode exposes every
        parameter. Preview uses the same offline render order as export; ORIGINAL
        means a dry signal at the selected output rate, channel mode and speed.</p>`,
    `<p>У простому режимі ти обираєш лише розмір і якість. У детальному доступні всі
        повзунки. Прослуховування звучить так само, як збережений файл; ОРИГІНАЛ —
        це звук без ефектів, але з вибраною частотою, каналами й швидкістю.</p>`],
  [`<p>Monitor volume changes listening level only. Normalize is linked peak
        normalization for export and is not perceptual loudness matching.</p>`,
    `<p>Повзунок гучності 🔊 змінює лише те, як голосно ти слухаєш. «ГУЧНІСТЬ»
        вирівнює найгучнішу точку файлу, а не те, наскільки гучним звук здається на слух.</p>`],

  ['<span class="toggle-label-text">TPDF DITHER</span>', '<span class="toggle-label-text">TPDF-ДИЗЕР</span>'],
  ['<span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>', '<span>0,5×</span><span>1,0×</span><span>1,5×</span><span>2,0×</span>'],
  ['<output id="out-bass" class="filter-value">+0 dB</output>', '<output id="out-bass" class="filter-value">0 дБ</output>'],
  ['class="savings-val">0 KB</span>', 'class="savings-val">0 КБ</span>'],
  // Export + actions
  ['aria-label="Export format and naming options"', 'aria-label="Формати й назви файлів"'],
  ['<span class="export-options__label">EXPORT</span>', '<span class="export-options__label">ЗБЕРЕГТИ ЯК</span>'],
  ['title="Export Ogg Vorbis (.ogg)">OGG</button>', 'title="Зберегти Ogg Vorbis (.ogg)">OGG</button>'],
  ['title="Export 8-bit or 16-bit PCM WAV (.wav)">WAV</button>', 'title="Зберегти 8- або 16-бітний PCM WAV (.wav)">WAV</button>'],
  ['title="Export MP3 (.mp3)">MP3</button>', 'title="Зберегти MP3 (.mp3)">MP3</button>'],
  ['title="Scratch 3.0 imports only WAV and MP3 (max 10 MB per sound): export WAV only">FOR SCRATCH</button>', 'title="Scratch 3.0 відкриває лише WAV і MP3 (до 10 МБ на звук): збережемо тільки WAV">ДЛЯ SCRATCH</button>'],
  ['title="Keep original filenames without _crunched_8bit_22050hz suffix (preserves Unity .meta and Godot .import references)">KEEP NAMES</button>', 'title="Зберегти початкові назви файлів без закінчення _crunched_8bit_22050hz (не ламає .meta в Unity та .import у Godot)">СВОЇ НАЗВИ</button>'],
  ['aria-label="Preview selected audio">', 'aria-label="Послухати вибраний звук">'],
  ['<span id="btn-preview-label">PREVIEW</span>', '<span id="btn-preview-label">ПОСЛУХАТИ</span>'],
  ['aria-label="Crunch all">', 'aria-label="Обробити все">'],
  ['<span id="btn-process-label">CRUNCH</span>', '<span id="btn-process-label">ОБРОБИТИ</span>'],
  ['<p class="codec-info export-hint">Making a Scratch game? Press <strong>FOR SCRATCH</strong> to get one WAV file per sound.</p>', '<p class="codec-info export-hint">Робиш гру в Scratch? Натисни <strong>ДЛЯ SCRATCH</strong> — отримаєш один WAV-файл на кожен звук.</p>'],
  ['<p id="codec-info" class="codec-info">Codecs: WAV 16-bit PCM · OGG q0 (~64 kbps) · MP3 128 kbps</p>', '<p id="codec-info" class="codec-info">Формати: OGG q0 (~64 кбіт/с) · WAV 16-біт PCM · MP3 128 кбіт/с</p>'],
  ['<p id="effective-settings" class="effective-settings">Effective settings appear after a file is loaded.</p>', '<p id="effective-settings" class="effective-settings">Тут з’являться налаштування, коли додаси файл.</p>'],
  ['class="btn btn--ghost btn--xs cancel-button" hidden>STOP PROCESSING</button>', 'class="btn btn--ghost btn--xs cancel-button" hidden>ЗУПИНИТИ ОБРОБКУ</button>'],
  ['aria-label="Toggle comparison">', 'aria-label="Порівняти з оригіналом">'],
  ['<span class="ab-label">COMPARING:</span>', '<span class="ab-label">ЗАРАЗ ГРАЄ:</span>'],
  ['<span id="ab-status" class="ab-value">CRUNCHED (WET)</span>', '<span id="ab-status" class="ab-value">ОБРОБЛЕНИЙ</span>'],
  ['title="Automatically re-render preview when you change controls" aria-label="Toggle live parameter updates">', 'title="Одразу оновлювати звук, коли рухаєш повзунки" aria-label="Одразу оновлювати звук">'],
  ['<span class="live-label">LIVE UPDATE: <span id="live-status">ON</span></span>', '<span class="live-label">ОДРАЗУ: <span id="live-status">УВІМК</span></span>'],
  ['title="Loop preview continuously or play once as a one-shot SFX" aria-pressed="true" aria-label="Toggle preview loop">', 'title="Грати по колу або один раз, як короткий ефект" aria-pressed="true" aria-label="Грати по колу">'],
  ['<span class="live-label">LOOP: <span id="loop-status">ON</span></span>', '<span class="live-label">ПО КОЛУ: <span id="loop-status">УВІМК</span></span>'],
  ['title="Preview Volume">🔊</span>', 'title="Гучність прослуховування">🔊</span>'],
  ['aria-label="Preview volume"', 'aria-label="Гучність прослуховування"'],
  ['<span id="progress-text">Processing…</span>', '<span id="progress-text">Обробка…</span>'],

  // Log + results
  ['aria-label="Resize output panel"', 'aria-label="Змінити ширину панелі результатів"'],
  ['aria-label="Processing log">', 'aria-label="Журнал обробки">'],
  ['<div class="panel-label" aria-hidden="true">[ LOG ]</div>', '<div class="panel-label" aria-hidden="true">[ ЖУРНАЛ ]</div>'],
  ['aria-label="Processing log output"', 'aria-label="Повідомлення журналу"'],
  ['<p class="log-line log-line--sys">OGCruncher initialized</p>', '<p class="log-line log-line--sys">OGCruncher запущено</p>'],
  ['<p class="log-line log-line--sys">engine: OfflineAudioContext · Float32Array DSP</p>', '<p class="log-line log-line--sys">рушій: OfflineAudioContext · Float32Array DSP</p>'],
  ['<span id="norm-ceiling-label" class="toggle-label-text">-1 dBFS PEAK</span>', '<span id="norm-ceiling-label" class="toggle-label-text">-1 дБFS ПІК</span>'],
  ['<p class="log-line log-line--sys">status: awaiting input ▌</p>', '<p class="log-line log-line--sys">статус: чекаю на файл ▌</p>'],
  ['<span id="results-batch-summary" class="results-batch-summary">0 files ready</span>', '<span id="results-batch-summary" class="results-batch-summary">0 файлів готово</span>'],
  ['class="btn btn--ghost btn--xs">CLEAR RESULTS</button>', 'class="btn btn--ghost btn--xs">ПРИБРАТИ РЕЗУЛЬТАТИ</button>'],
  ['class="btn btn--primary btn--xs btn-download-zip" hidden>DOWNLOAD ALL (.ZIP)</button>', 'class="btn btn--primary btn--xs btn-download-zip" hidden>ЗАВАНТАЖИТИ ВСЕ (.ZIP)</button>'],
  ['aria-label="Download results"', 'aria-label="Готові файли"'],

  // Guide
  ['<span class="tool-intro__kicker">DOCUMENTATION &amp; GAME AUDIO GUIDE</span>', '<span class="tool-intro__kicker">ДОВІДКА: ЗВУК ДЛЯ ІГОР</span>'],
  ['<h2 id="seo-guide-title" class="seo-guide__title">Free Online Audio Bit-Crusher, Sample Rate Reducer &amp; Game SFX Optimizer</h2>', '<h2 id="seo-guide-title" class="seo-guide__title">Безкоштовний біткрашер онлайн і конвертер звуку для ігор та Scratch</h2>'],
  [/<p class="seo-guide__lead">[\s\S]*?<\/p>/, `<p class="seo-guide__lead">
        <strong>OGCruncher</strong> — браузерний інструмент для звуку від <a data-goatcounter-click="ogcruncher-hub" href="https://sivochka.com/?ref=OGCruncher" target="_blank" rel="noopener noreferrer">Ігоря Сівочки (Figarist)</a>. Перетягни файли <code>WAV</code>, <code>MP3</code>, <code>FLAC</code>, <code>OGG</code> або <code>AIFF</code> у чергу, зменш бітність і частоту, додай фільтри чи хрусту, порівняй «було» і «стало» та збережи готові звуки для гри. Усе працює у твоєму браузері через <code>OfflineAudioContext</code> і Web Workers — файли нікуди не відправляються.
      </p>`],
  [/<article class="seo-card">\s*<h3>1–16 Bit Quantization[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Звук для Scratch за 3 кроки</h3>
        <p>
          1) Перетягни звук або натисни «СПРОБУВАТИ НА ПРИКЛАДІ». 2) Обери готовий набір, наприклад <strong>NES 8-BIT</strong>, і натисни «ПОСЛУХАТИ». 3) Натисни <strong>«ДЛЯ SCRATCH»</strong>, потім «ОБРОБИТИ» і завантаж WAV. У Scratch відкрий вкладку «Звуки» → «Завантажити звук». Scratch не відкриває <code>.ogg</code>, а один звук має важити до 10 МБ.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Simultaneous Batch Export[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Бітність, частота, дизер і хруст: 1–16 біт</h3>
        <p>
          Зроби справжній 4-, 8- чи 12-бітний звук і зменш частоту від 4 000 до 48 000 Гц кнопками стандартних значень. <strong>Краш-режим</strong> прибирає DC-зсув, додає м’який експандер <code>|x|^1.15</code> і згладжує аліасинг. <strong>TPDF-дизер</strong> пом’якшує зернистість, <strong>хруст</strong> (<code>tanh</code>) додає щільності, а <strong>шум</strong> — шипіння старої касети.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Retro Console Presets[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Пакетне збереження у WAV, OGG і MP3 для Unity та Godot</h3>
        <p>
          Додай у чергу десятки ефектів і оброби їх з однаковими налаштуваннями. Обери потрібні формати: 8- чи 16-бітний <strong>PCM WAV</strong> для миттєвого відтворення, <strong>Ogg Vorbis</strong> для компактних лупів і <strong>MP3</strong> (128 кбіт/с, на 8–12 кГц — 64 кбіт/с). Кнопка «СВОЇ НАЗВИ» лишає початкові назви файлів, щоб не ламати <code>.meta</code> в Unity та <code>.import</code> у Godot, а «ОБРІЗАТИ ТИШУ» прибирає паузу перед ударом.
        </p>
      </article>`],
  ['<h3 id="seo-matrix-title" class="seo-table__title">Recommended Settings for Game Engines &amp; Retro Targets</h3>', '<h3 id="seo-matrix-title" class="seo-table__title">Які налаштування обрати для ігор і Scratch</h3>'],
  ['<th scope="col">Target / Use Case</th>', '<th scope="col">Для чого</th>'],
  ['<th scope="col">Bit Depth &amp; Rate</th>', '<th scope="col">Бітність і частота</th>'],
  ['<th scope="col">Channels &amp; DSP</th>', '<th scope="col">Канали й ефекти</th>'],
  ['<th scope="col">Recommended Format</th>', '<th scope="col">Формат</th>'],
  ['<td><strong>Unity / Godot Low-Latency Combat &amp; UI SFX</strong></td>', '<td><strong>Unity / Godot: удари, постріли, кліки інтерфейсу</strong></td>'],
  ['<td>8–12 bit · 22,050 Hz</td>', '<td>8–12 біт · 22 050 Гц</td>'],
  ['<td>Mono · Normalize ON · HPF 80 Hz</td>', '<td>Моно · Гучність УВІМК · HPF 80 Гц</td>'],
  ['<td>PCM WAV (zero decode latency; note: Unity re-encodes imported WAVs per AudioClip Import Settings)</td>', '<td>PCM WAV (грає без затримки; Unity все одно перекодовує WAV за налаштуваннями імпорту AudioClip)</td>'],
  ['<td><strong>Wear OS, Mobile &amp; WebGL Loops</strong></td>', '<td><strong>Wear OS, телефони й WebGL: лупи та музика</strong></td>'],
  ['<td>12–16 bit · 22,050–32,000 Hz</td>', '<td>12–16 біт · 22 050–32 000 Гц</td>'],
  ['<td>Mono or Stereo · Dither ON · Grit 1.2</td>', '<td>Моно або стерео · Дизер УВІМК · Хруст 1,2</td>'],
  ['<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS support for OGG is limited and version-dependent, so ship an MP3 fallback for WebGL</td>', '<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS підтримує OGG обмежено, тому для WebGL додай MP3</td>'],
  ['<td><strong>Scratch 3.0 (Kids &amp; Classroom Games)</strong></td>', '<td><strong>Scratch 3.0 (ігри дітей і на уроках)</strong></td>'],
  ['<td>8–16 bit · 22,050 Hz</td>', '<td>8–16 біт · 22 050 Гц</td>'],
  ['<td>Mono · Normalize ON</td>', '<td>Моно · Гучність УВІМК</td>'],
  ['<td>PCM WAV (short SFX) or MP3 (music), max 10 MB per file — Scratch 3.0 does not import <code>.ogg</code></td>', '<td>Кнопка «ДЛЯ SCRATCH» → WAV (для довгої музики — MP3), до 10 МБ на файл; <code>.ogg</code> Scratch не відкриває</td>'],
  ['<td><strong>NES / 8-Bit Chiptune Crunch</strong></td>', '<td><strong>NES / 8-бітний чіптюн</strong></td>'],
  ['<td>4 bit · 12,000 Hz</td>', '<td>4 біти · 12 000 Гц</td>'],
  ['<td>Mono · Crush ON · Dither OFF · LPF 6 kHz</td>', '<td>Моно · Краш УВІМК · Дизер ВИМК · LPF 6 кГц</td>'],
  ['<td>8-Bit PCM WAV or OGG</td>', '<td>8-бітний PCM WAV або OGG</td>'],
  ['<td><strong>Amiga 500 / 90s Tracker Sampler</strong></td>', '<td><strong>Amiga 500 / трекерна музика 90-х</strong></td>'],
  ['<td>8 bit · 28,000 Hz</td>', '<td>8 біт · 28 000 Гц</td>'],
  ['<td>Stereo · Grit 1.5 · Noise -46 dB · LPF 10 kHz</td>', '<td>Стерео · Хруст 1,5 · Шум -46 дБ · LPF 10 кГц</td>'],
  ['<td>8-Bit PCM WAV / MP3 preview</td>', '<td>8-бітний PCM WAV / MP3</td>'],
  [/<h2 id="faq-heading" class="seo-guide__subtitle">Frequently Asked Questions \(FAQ\)<\/h2>[\s\S]*?(?=\n    <\/section>)/,
    `<h2 id="faq-heading" class="seo-guide__subtitle">Часті запитання</h2>\n${faqHtml}`],
  ['<h3 id="seo-locale-title">OGCruncher українською</h3>', '<h3 id="seo-locale-title">OGCruncher in English</h3>'],
  ['<aside class="seo-locale-card" lang="uk" aria-labelledby="seo-locale-title">', '<aside class="seo-locale-card" lang="en" aria-labelledby="seo-locale-title">'],
  ['<p>Повна українська версія інструмента з поясненнями простими словами та порадами для Scratch, Unity і Godot.</p>', '<p>The original English version of the tool with the full game-audio guide.</p>'],
  ['<li><a href="uk/" hreflang="uk">Відкрити українську версію →</a></li>', '<li><a href="../" hreflang="en">Open the English version →</a></li>'],

  // Footer, notices, modal
  ['<span class="footer-note">Made by Ihor Sivochka for game developers and curious people.</span>', '<span class="footer-note">Зробив Ігор Сівочка для розробників ігор і всіх допитливих.</span>'],
  ['<a href="#guide" class="footer-link">Guide</a>', '<a href="#guide" class="footer-link">Довідка</a>'],
  ['<a href="#faq" class="footer-link">FAQ</a>', '<a href="#faq" class="footer-link">Запитання</a>'],
  ['<strong>UPDATE READY</strong>', '<strong>Є ОНОВЛЕННЯ</strong>'],
  ['<span id="sw-update-message">A new version is waiting.</span>', '<span id="sw-update-message">Нова версія вже чекає.</span>'],
  ['class="btn btn--primary btn--xs">ACTIVATE &amp; RELOAD</button>', 'class="btn btn--primary btn--xs">ОНОВИТИ Й ПЕРЕЗАВАНТАЖИТИ</button>'],
  ['<h2 id="modal-info-title" class="modal-title">ABOUT OGCRUNCHER</h2>', '<h2 id="modal-info-title" class="modal-title">ПРО OGCRUNCHER</h2>'],
  ['<p>OGCruncher is a small browser audio tool by Ihor Sivochka. Shape high-quality audio into gritty, lo-fi samples for games, Wear OS assets and retro projects. Files are processed locally in your browser.</p>', '<p>OGCruncher — невеликий браузерний інструмент для звуку від Ігоря Сівочки. Він перетворює чистий звук на хрусткі ретро-ефекти для ігор, Scratch, Wear OS і ретро-проєктів. Файли обробляються прямо у твоєму браузері.</p>'],
  ['<button id="btn-info-ok" class="btn btn--primary" style="width:100%">UNDERSTOOD</button>', '<button id="btn-info-ok" class="btn btn--primary" style="width:100%">ЗРОЗУМІЛО</button>'],
];

module.exports = { meta, jsonLd, pairs };
