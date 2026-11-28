/**
 * Russian page source: exact English → Russian replacements applied to
 * index.html by scripts/build-locales.cjs. Every English string must exist in
 * index.html; the generator fails loudly when the English page drifts.
 */

const BASE = 'https://sivochka.com/OGCruncher/ru/';

const meta = {
  lang: 'ru',
  ogLocale: 'ru_RU',
  canonical: BASE,
  title: 'OGCruncher — биткрашер и конвертер звука онлайн',
  description: 'Бесплатный биткрашер онлайн: уменьши битность и частоту звука, сохрани в WAV, MP3 или OGG для Unity, Godot и Scratch. Файлы не покидают браузер.',
  imageAlt: 'OGCruncher — бесплатный биткрашер, снижение частоты дискретизации и пакетный экспорт в OGG/WAV/MP3',
  keywords: 'OGCruncher, биткрашер онлайн, 8-бит звук онлайн, конвертер звука для игр, звук для Scratch, WAV для Scratch, сжать звук для Unity, ретро звук, lo-fi звук, уменьшить частоту дискретизации, конвертер OGG WAV MP3',
};

const faq = [
  {
    q: 'Что такое OGCruncher и чем он отличается от обычного конвертера?',
    a: 'OGCruncher — бесплатный браузерный биткрашер и пакетный конвертер звука для разработчиков игр, Wear OS и ретро-проектов. Он не просто перекодирует файл, а намеренно меняет звучание: фильтры и скорость через OfflineAudioContext, мягкий экспандер, квантование 1–16 бит, TPDF-дизер и tanh-сатурацию, а затем экспортирует результат в OGG, WAV и MP3.',
  },
  {
    q: 'Мои файлы куда-то загружаются?',
    a: 'Нет. Файлы остаются на вашем устройстве: декодирование, фильтры, DSP-обработка и кодирование в OGG/WAV/MP3 выполняются локально в браузере и отдельном Web Worker. По сети загружаются только файлы самого сайта и, по желанию, пример звука.',
  },
  {
    q: 'Какой формат выбрать для Scratch 3.0?',
    a: 'Нажмите кнопку «ДЛЯ SCRATCH»: инструмент сохранит один WAV-файл на каждый звук. Scratch 3.0 открывает WAV и MP3, а OGG не поддерживает. Один звук должен весить до 10 МБ; для длинной музыки выберите MP3 или качество ниже.',
  },
  {
    q: 'Как OGCruncher выбирает между 8-битным и 16-битным WAV?',
    a: 'Разрядность WAV подстраивается под ползунок «БИТНОСТЬ»: от 1 до 8 бит файл сохраняется как 8-битный PCM WAV, а от 9 до 16 бит — как 16-битный. Так короткие 8-битные эффекты остаются компактными, а 12- и 16-битные не теряют точности.',
  },
  {
    q: 'Какой формат и частоту выбрать для Unity, Godot, WebGL или Wear OS?',
    a: 'Для коротких кликов интерфейса, шагов и ударов берите моно PCM WAV 8 или 16 бит на 16 000–22 050 Гц: он воспроизводится мгновенно без декодирования. Для фоновых лупов и музыки используйте Ogg Vorbis на 22 050–32 000 Гц, когда важен размер APK или сборки WebGL. Unity всё равно перекодирует импортированные WAV по настройкам AudioClip, а Safari/iOS поддерживает OGG ограниченно, поэтому для WebGL добавьте MP3 как запасной вариант.',
  },
  {
    q: 'Почему MP3 на очень низкой частоте (например, 4 000 Гц) сохраняется как 8 000 Гц?',
    a: 'Стандарт MPEG для MP3 поддерживает только девять частот, самая низкая — 8 000 Гц (8k, 11.025k, 12k, 16k, 22.05k, 24k, 32k, 44.1k и 48k). Если выбрать нестандартную частоту, например 4 000 или 28 000 Гц, WAV и OGG сохранят её точно, а MP3 пересчитывается оконной интерполяцией Lanczos-3 к ближайшей допустимой частоте. На 8–12 кГц MP3 имеет 64 кбит/с, выше — 128 кбит/с.',
  },
  {
    q: 'Как работают пакетная обработка, ZIP и ссылки с настройками?',
    a: 'Добавьте несколько файлов в очередь, настройте звук и нажмите «ОБРАБОТАТЬ»: все файлы пройдут с одинаковыми параметрами. Затем скачайте каждый файл отдельно, всё сразу кнопкой «СКАЧАТЬ ВСЁ (.ZIP)» или нажмите «КОПИРОВАТЬ ССЫЛКУ», чтобы поделиться настройками.',
  },
  {
    q: 'Как за 10 секунд сделать 8-битный звук для Unity или Godot?',
    a: 'Добавьте чистый звук прыжка или удара в WAV или MP3, поставьте битность 4–8 и частоту 11 025–16 000 Гц (моно), включите краш-режим и сохраните в OGG или 8-битный WAV.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE}#app`,
      name: 'OGCruncher',
      alternateName: ['OG Cruncher', 'OGCruncher биткрашер', 'Figarist OGCruncher'],
      url: BASE,
      inLanguage: 'ru',
      description: 'Бесплатный браузерный биткрашер, снижение частоты дискретизации и пакетное сохранение звука в OGG/WAV/MP3 на OfflineAudioContext и Web Workers.',
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'Обработка звука для игр',
      operatingSystem: 'Любой браузер (Windows, macOS, Linux, Android, iOS)',
      browserRequirements: 'Требуются Web Audio API (OfflineAudioContext) и Web Workers',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Квантование звука 1–16 бит и краш-режим (удаление DC-смещения, мягкий экспандер, сглаживание алиасинга)',
        'Частота дискретизации от 4 000 до 48 000 Гц с быстрыми стандартными значениями',
        'Tanh-сатурация, шум ленты и треугольный TPDF-дизер',
        'Фильтры HPF и LPF, усиление баса на 80 Гц, скорость/тон и нормализация пика до -1 или 0 дБFS',
        'Обработка полностью в браузере, без отправки файлов',
        'Пакетное сохранение в выбранные форматы OGG, 8/16-битный WAV и MP3, исходные имена файлов и ZIP-архив',
        'Обрезка тишины в начале и конце с короткими затуханиями без щелчков',
        'Кнопка «ДЛЯ SCRATCH»: один WAV-файл на звук для Scratch 3.0',
      ],
      image: 'https://sivochka.com/OGCruncher/images/social-card.png',
      author: {
        '@type': 'Person',
        '@id': 'https://sivochka.com#person',
        name: 'Игорь Сивочка',
        alternateName: ['Ihor Sivochka', 'Sivochka Ihor', 'Ігор Сівочка', 'Ігор Глібович Сівочка', 'Figarist'],
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
        { '@type': 'ListItem', position: 3, name: 'По-русски', item: BASE },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}#faq`,
      inLanguage: 'ru',
      mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ],
};

const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const faqHtml = faq.map((item, index) => `      <details class="faq-item"${index === 0 ? ' open' : ''}>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`).join('\n');

/** [english, russian] pairs; each English string must appear in index.html. */
const pairs = [
  // Paths: ru/index.html lives one folder deeper.
  ['<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="../style.css" />'],
  ['<script type="module" src="js/main.js"></script>', '<script type="module" src="../js/main.js"></script>'],

  // Header
  ['aria-label="Back to Figarist"', 'aria-label="На сайт Figarist"'],
  ['<span class="logo-title__kw"> Free Online Audio Bit-Crusher &amp; Compressor</span>', '<span class="logo-title__kw"> бесплатный биткрашер и конвертер звука онлайн</span>'],
  ['aria-label="OGCruncher navigation"', 'aria-label="Навигация OGCruncher"'],
  ['title="Install OGCruncher as a standalone app" hidden>⬇ INSTALL APP</button>', 'title="Установить OGCruncher как отдельное приложение" hidden>⬇ УСТАНОВИТЬ</button>'],
  ['aria-label="Language">', 'aria-label="Язык">'],
  [`<span id="lang-current">EN</span>
            <span class="lang-caret" aria-hidden="true">▾</span>
          </button>
          <div id="lang-menu" class="lang-menu" role="menu" hidden>
            <a class="lang-btn is-active" href="./" hreflang="en" lang="en" role="menuitem" aria-current="page">EN · English</a>
            <a class="lang-btn" href="uk/" hreflang="uk" lang="uk" role="menuitem">UK · Українська</a>
            <a class="lang-btn" href="pl/" hreflang="pl" lang="pl" role="menuitem">PL · Polski</a>
            <a class="lang-btn" href="ru/" hreflang="ru" lang="ru" role="menuitem">RU · Русский</a>
            <a class="lang-btn" href="ko/" hreflang="ko" lang="ko" role="menuitem">KO · 한국어</a>
          </div>`,
    `<span id="lang-current">RU</span>
            <span class="lang-caret" aria-hidden="true">▾</span>
          </button>
          <div id="lang-menu" class="lang-menu" role="menu" hidden>
            <a class="lang-btn" href="../" hreflang="en" lang="en" role="menuitem">EN · English</a>
            <a class="lang-btn" href="../uk/" hreflang="uk" lang="uk" role="menuitem">UK · Українська</a>
            <a class="lang-btn" href="../pl/" hreflang="pl" lang="pl" role="menuitem">PL · Polski</a>
            <a class="lang-btn is-active" href="./" hreflang="ru" lang="ru" role="menuitem" aria-current="page">RU · Русский</a>
            <a class="lang-btn" href="../ko/" hreflang="ko" lang="ko" role="menuitem">KO · 한국어</a>
          </div>`],
  ['title="About OGCruncher">ABOUT</button>', 'title="О OGCruncher">О САЙТЕ</button>'],

  // Intro
  ['aria-label="OGCruncher status"', 'aria-label="Статус OGCruncher"'],
  ['<span class="tool-intro__kicker">A SMALL TOOL FOR BIG SOUNDS</span>', '<span class="tool-intro__kicker">МАЛЕНЬКИЙ ИНСТРУМЕНТ ДЛЯ БОЛЬШИХ ЗВУКОВ</span>'],
  ['<p>Shape, preview and export game audio without leaving your browser.</p>', '<p>Меняйте звук, слушайте результат и сохраняйте его для игры — прямо в браузере.</p>'],
  ['</span> Files stay in this browser</span>', '</span> Файлы никуда не отправляются</span>'],

  // Input panel
  ['aria-label="Audio processing workspace"', 'aria-label="Рабочая область обработки звука"'],
  ['aria-label="File input panel"', 'aria-label="Панель файлов"'],
  ['<div class="panel-label" aria-hidden="true">[ INPUT ]</div>', '<div class="panel-label" aria-hidden="true">[ ФАЙЛЫ ]</div>'],
  ['title="Show both spectra simultaneously">DUAL VIEW: OFF</button>', 'title="Показать оба графика одновременно">ДВА ГРАФИКА: ВЫКЛ</button>'],
  ['aria-label="Drag and drop audio files here"', 'aria-label="Перетащите сюда звуковые файлы"'],
  ['<p class="drop-title">DROP AUDIO FILES HERE</p>', '<p class="drop-title">ПЕРЕТАЩИТЕ СЮДА ЗВУКИ</p>'],
  ['<p class="drop-sub">or <label for="file-input" class="file-label-btn">BROWSE FILES</label></p>', '<p class="drop-sub">или <label for="file-input" class="file-label-btn">ВЫБЕРИТЕ ФАЙЛЫ</label></p>'],
  ['title="Test OGCruncher with a pre-loaded track"', 'title="Попробовать OGCruncher на готовом звуке"'],
  ['<span id="btn-load-demo-label">TRY DEMO TRACK 🎵</span>', '<span id="btn-load-demo-label">ПОПРОБОВАТЬ ПРИМЕР 🎵</span>'],
  ['<span class="metrics-label">RMS</span>', '<span class="metrics-label" title="Средняя громкость (RMS)">СРЕДН.</span>'],
  ['<span class="metrics-label">PEAK</span>', '<span class="metrics-label" title="Пиковая громкость (PEAK)">ПИК</span>'],
  ['<span class="metrics-label">DUR</span>', '<span class="metrics-label" title="Длительность">ВРЕМЯ</span>'],
  ['DRY —</span>', 'БЫЛО —</span>'],
  ['WET —</span>', 'СТАЛО —</span>'],
  ['aria-label="Choose audio files"', 'aria-label="Выбрать звуковые файлы"'],
  ['<span class="panel-label" style="margin:0">[ QUEUE ]</span>', '<span class="panel-label" style="margin:0">[ ОЧЕРЕДЬ ]</span>'],
  ['aria-label="Clear queue">CLEAR</button>', 'aria-label="Очистить очередь">ОЧИСТИТЬ</button>'],
  ['aria-label="Processing queue"', 'aria-label="Очередь обработки"'],
  ['<span class="savings-title-text">⚡ SIZE OUTLOOK · METADATA-BACKED ESTIMATES</span>', '<span class="savings-title-text">⚡ ОЖИДАЕМЫЙ РАЗМЕР · ОЦЕНКА ПО МЕТАДАННЫМ</span>'],
  ['class="badge badge--amber">ANALYZING…</span>', 'class="badge badge--amber">СЧИТАЮ…</span>'],
  ['<span class="savings-label">ORIGINAL</span>', '<span class="savings-label">БЫЛО</span>'],
  ['<span class="savings-label">EST. WAV</span>', '<span class="savings-label">≈ WAV</span>'],
  ['<span class="savings-label">EST. OGG RANGE</span>', '<span class="savings-label">≈ OGG</span>'],
  ['<span class="savings-label">EST. MP3</span>', '<span class="savings-label">≈ MP3</span>'],
  ['aria-label="Resize input panel"', 'aria-label="Изменить ширину панели файлов"'],

  // Controls
  ['aria-label="Processing controls"', 'aria-label="Настройки обработки"'],
  ['<div class="panel-label" aria-hidden="true">[ PARAMETERS ]</div>', '<div class="panel-label" aria-hidden="true">[ НАСТРОЙКИ ]</div>'],
  ['aria-label="Processing mode"', 'aria-label="Режим"'],
  ['aria-label="Switch to Simple mode">SIMPLE</button>', 'aria-label="Простой режим">ПРОСТОЙ</button>'],
  ['aria-label="Switch to Advanced mode">ADVANCED</button>', 'aria-label="Расширенный режим">РАСШИРЕННЫЙ</button>'],
  ['<span class="control-label">PRESETS</span>', '<span class="control-label">ПРЕСЕТЫ</span>'],
  ['title="Copy current settings as a shareable link">COPY LINK</button>', 'title="Скопировать настройки как ссылку">КОПИРОВАТЬ ССЫЛКУ</button>'],
  ['title="Save current settings as your custom preset">SAVE CURRENT</button>', 'title="Сохранить текущие настройки как свой пресет">СОХРАНИТЬ СВОЙ</button>'],
  ['aria-label="Apply Author\'s LO-Q preset (8-bit, 22050Hz)"', 'aria-label="Авторский пресет LO-Q (8 бит, 22050 Гц)"'],
  ['<span class="preset-card__meta">8-bit / 22k Hz</span>', '<span class="preset-card__meta">8 бит / 22 кГц</span>'],
  ['aria-label="Apply retro gaming NES preset (4-bit, 12000Hz)"', 'aria-label="Ретро-пресет NES (4 бита, 12000 Гц)"'],
  ['<span class="preset-card__meta">4-bit / 12k Hz</span>', '<span class="preset-card__meta">4 бита / 12 кГц</span>'],
  ['aria-label="Apply vintage sampler Amiga 500 preset (8-bit, 28000Hz)"', 'aria-label="Пресет сэмплера Amiga 500 (8 бит, 28000 Гц)"'],
  ['<span class="preset-card__meta">8-bit / 28k Hz</span>', '<span class="preset-card__meta">8 бит / 28 кГц</span>'],
  ['aria-label="Apply your custom preset" disabled>', 'aria-label="Ваш пресет" disabled>'],
  ['<span class="preset-card__title">MY PRESET</span>', '<span class="preset-card__title">МОЙ ПРЕСЕТ</span>'],
  ['<span id="preset-user-meta" class="preset-card__meta">NOT SAVED</span>', '<span id="preset-user-meta" class="preset-card__meta">НЕ СОХРАНЁН</span>'],
  ['<span class="control-label">SIZE & QUALITY</span>', '<span class="control-label">РАЗМЕР И КАЧЕСТВО</span>'],
  ['<span id="out-simple-quality" class="control-value">HIGH</span>', '<span id="out-simple-quality" class="control-value">ВЫСОКИЙ</span>'],
  ['aria-label="Adjust size and quality"', 'aria-label="Размер и качество"'],
  ['data-val="0">TINY</span>', 'data-val="0">МИНИ</span>'],
  ['data-val="1">LOW</span>', 'data-val="1">НИЗКИЙ</span>'],
  ['data-val="2">MEDIUM</span>', 'data-val="2">СРЕДНИЙ</span>'],
  ['data-val="3">HIGH</span>', 'data-val="3">ВЫСОКИЙ</span>'],
  ['<p class="simple-desc" id="simple-quality-desc">High Quality (32kHz / 16-bit) — clear and optimized.</p>', '<p class="simple-desc" id="simple-quality-desc">Высокое качество (32 кГц / 16 бит) — минимальное изменение звука.</p>'],
  ['data-tooltip="Audio resolution (bits). Lower bits = more \'pixelated\' noise and lo-fi artifacts.">BIT DEPTH</label>', 'data-tooltip="Разрядность звука в битах. Меньше бит — больше «пиксельного» хруста, как в старых играх.">БИТНОСТЬ</label>'],
  ['aria-label="Bit depth"', 'aria-label="Битность"'],
  ['data-tooltip="Sampling frequency. Lower values make audio muffled and add metallic aliasing.">RATE</label>', 'data-tooltip="Частота дискретизации. Чем ниже, тем глуше звук и сильнее металлический алиасинг.">ЧАСТОТА</label>'],
  ['22050 <span class="unit">Hz</span></output>', '22050 <span class="unit">Гц</span></output>'],
  ['aria-label="Sample rate in Hz"', 'aria-label="Частота дискретизации в герцах"'],
  ['data-tooltip="Saturation drive (tanh). 1.0 is clean bypass (OFF); higher values add harmonic density.">GRIT</label>', 'data-tooltip="Сатурация (tanh). 1.0 — без изменений (ВЫКЛ), выше — плотнее и насыщеннее звук.">ХРУСТ</label>'],
  ['<output id="out-grit" for="slider-grit" class="control-value">OFF</output>', '<output id="out-grit" for="slider-grit" class="control-value">ВЫКЛ</output>'],
  ['aria-label="Saturation drive amount"', 'aria-label="Сила сатурации"'],
  ['data-tooltip="Adds subtle floor hiss of vintage gear or tape (shown in dBFS).">NOISE</label>', 'data-tooltip="Добавляет лёгкое шипение старой аппаратуры или кассеты (в дБFS).">ШУМ</label>'],
  ['<output id="out-noise" for="slider-noise" class="control-value">OFF</output>', '<output id="out-noise" for="slider-noise" class="control-value">ВЫКЛ</output>'],
  ['aria-label="Noise floor level"', 'aria-label="Уровень шума"'],
  ['data-tooltip="Creative bit-crush pipeline: DC removal, |x|^1.15 soft expander, quantization, and 2-tap anti-alias smoothing.">CRUSH MODE</label>', 'data-tooltip="Творческий биткраш: удаление DC-смещения, мягкий экспандер |x|^1.15, квантование и сглаживание алиасинга.">КРАШ-РЕЖИМ</label>'],
  ['<span id="out-mariomode" class="control-value" aria-live="polite">ON</span>', '<span id="out-mariomode" class="control-value" aria-live="polite">ВКЛ</span>'],
  ['title="DC removal, soft expander (|x|^1.15), quantization, and 2-tap anti-alias smoothing"', 'title="Удаление DC-смещения, мягкий экспандер (|x|^1.15), квантование и сглаживание"'],
  ['aria-label="Enable expander, dither and anti-alias pipeline"', 'aria-label="Включить краш-режим"'],
  ['<span class="toggle-label-text">EXPANDER</span>', '<span class="toggle-label-text">ЭКСПАНДЕР</span>'],
  ['data-tooltip="Adds triangular TPDF dither to soften quantization distortion. Turn OFF for raw retro grit.">DITHER</label>', 'data-tooltip="Треугольный TPDF-дизер смягчает искажения квантования. Выключите для грубого ретро-звучания.">ДИЗЕР</label>'],
  ['<span id="out-dither" class="control-value" aria-live="polite">ON</span>', '<span id="out-dither" class="control-value" aria-live="polite">ВКЛ</span>'],
  ['aria-label="Toggle triangular TPDF dither noise"', 'aria-label="Включить TPDF-дизер"'],
  ['data-tooltip="Normalizes output peak to -1 dBFS (safe headroom for OGG/MP3) or 0 dBFS full scale.">NORMALIZE</label>', 'data-tooltip="Выравнивает пик до -1 дБFS (безопасный запас для OGG/MP3) или до 0 дБFS.">НОРМАЛИЗАЦИЯ</label>'],
  ['title="Toggle normalization ceiling between -1 dBFS (safe headroom for lossy codecs) and 0 dBFS">-1 dB</button>', 'title="Переключить потолок между -1 дБFS (запас для OGG/MP3) и 0 дБFS">-1 дБ</button>'],
  ['<span id="out-normalize" class="control-value">ON</span>', '<span id="out-normalize" class="control-value">ВКЛ</span>'],
  ['aria-label="Enable peak normalization"', 'aria-label="Включить нормализацию пика"'],
  ['data-tooltip="Converts stereo to mono. Perfect for game SFX to save memory and CPU.">OUTPUT</label>', 'data-tooltip="Преобразует стерео в моно. Для игровых эффектов это экономит память и процессор.">КАНАЛЫ</label>'],
  ['<span id="out-stereo" class="control-value">MONO</span>', '<span id="out-stereo" class="control-value">МОНО</span>'],
  ['aria-label="Toggle between Mono and Stereo output"', 'aria-label="Моно или стерео"'],
  ['<span class="toggle-label-text">FORCE MONO</span>', '<span class="toggle-label-text">ВСЕГДА МОНО</span>'],
  ['data-tooltip="Trims leading and trailing silence below -48 dBFS and applies a 4 ms click-free micro-fade.">TRIM SILENCE</label>', 'data-tooltip="Обрезает тишину (тише -48 дБFS) в начале и конце и добавляет короткое затухание без щелчков.">ОБРЕЗАТЬ ТИШИНУ</label>'],
  ['<span id="out-trim" class="control-value" aria-live="polite">OFF</span>', '<span id="out-trim" class="control-value" aria-live="polite">ВЫКЛ</span>'],
  ['aria-label="Enable auto-trim silence with micro-fade"', 'aria-label="Обрезать тишину"'],
  ['<span class="toggle-label-text">-48 dB + FADE</span>', '<span class="toggle-label-text">-48 дБ + ЗАТУХАНИЕ</span>'],
  ['data-tooltip="Adjust playback speed. Lowering it creates a \'slow & chopped\' effect with lower pitch.">SPEED / PITCH</label>', 'data-tooltip="Скорость воспроизведения. Медленнее — ниже тон, быстрее — выше.">СКОРОСТЬ / ТОН</label>'],
  ['aria-label="Playback speed and pitch"', 'aria-label="Скорость и тон"'],
  ['data-tooltip="Fine-tune frequencies to shape your lo-fi sound.">FILTERS & EQ</span>', 'data-tooltip="Точная настройка частот.">ФИЛЬТРЫ И EQ</span>'],
  ['data-tooltip="Cuts low frequencies (rumble). Helps remove muddy bass and clear up the mix.">HPF (CUT LOWS)</label>', 'data-tooltip="Убирает низкие частоты (гул), делая звук чище.">HPF (УБРАТЬ НИЗ)</label>'],
  ['<output id="out-hpf" class="filter-value">20 Hz</output>', '<output id="out-hpf" class="filter-value">20 Гц</output>'],
  ['data-tooltip="Cuts high frequencies. Makes sound soft, \'underwater\' or phone-like.">LPF (CUT HIGHS)</label>', 'data-tooltip="Срезает высокие частоты. Звук становится мягким, как под водой или в телефоне.">LPF (УБРАТЬ ВЕРХ)</label>'],
  ['<output id="out-lpf" class="filter-value">OFF</output>', '<output id="out-lpf" class="filter-value">ВЫКЛ</output>'],
  ['data-tooltip="Enhances low-end frequencies for a deeper and more powerful punch.">BASS BOOST (80Hz)</label>', 'data-tooltip="Усиливает низкие частоты для более глубокого и мощного удара.">УСИЛИТЬ БАС (80 Гц)</label>'],
  ['<summary>HOW SETTINGS WORK</summary>', '<summary>КАК РАБОТАЮТ НАСТРОЙКИ</summary>'],
  [`<p>Simple mode selects a complete quality tier. Advanced mode exposes every
        parameter. Preview uses the same offline render order as export; ORIGINAL
        means a dry signal at the selected output rate, channel mode and speed.</p>`,
    `<p>В простом режиме выбирается готовый уровень качества. В расширенном доступны
        все ползунки. Прослушивание звучит так же, как сохранённый файл; ОРИГИНАЛ —
        это сухой сигнал с выбранной частотой, каналами и скоростью.</p>`],
  [`<p>Monitor volume changes listening level only. Normalize is linked peak
        normalization for export and is not perceptual loudness matching.</p>`,
    `<p>Ползунок громкости 🔊 меняет только уровень прослушивания. Нормализация
        выравнивает пик файла на экспорте, а не воспринимаемую громкость.</p>`],

  ['<span class="toggle-label-text">TPDF DITHER</span>', '<span class="toggle-label-text">TPDF-ДИЗЕР</span>'],
  ['<span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>', '<span>0,5×</span><span>1,0×</span><span>1,5×</span><span>2,0×</span>'],
  ['<output id="out-bass" class="filter-value">+0 dB</output>', '<output id="out-bass" class="filter-value">0 дБ</output>'],
  ['class="savings-val">0 KB</span>', 'class="savings-val">0 КБ</span>'],

  // Export + actions
  ['aria-label="Export format and naming options"', 'aria-label="Форматы и имена файлов"'],
  ['<span class="export-options__label">EXPORT</span>', '<span class="export-options__label">ЭКСПОРТ</span>'],
  ['title="Export Ogg Vorbis (.ogg)">OGG</button>', 'title="Сохранить Ogg Vorbis (.ogg)">OGG</button>'],
  ['title="Export 8-bit or 16-bit PCM WAV (.wav)">WAV</button>', 'title="Сохранить 8- или 16-битный PCM WAV (.wav)">WAV</button>'],
  ['title="Export MP3 (.mp3)">MP3</button>', 'title="Сохранить MP3 (.mp3)">MP3</button>'],
  ['title="Scratch 3.0 imports only WAV and MP3 (max 10 MB per sound): export WAV only">FOR SCRATCH</button>', 'title="Scratch 3.0 открывает только WAV и MP3 (до 10 МБ на звук): сохранять только WAV">ДЛЯ SCRATCH</button>'],
  ['title="Keep original filenames without _crunched_8bit_22050hz suffix (preserves Unity .meta and Godot .import references)">KEEP NAMES</button>', 'title="Сохранять исходные имена файлов без суффикса _crunched_8bit_22050hz (сохраняет .meta в Unity и .import в Godot)">СВОИ ИМЕНА</button>'],
  ['aria-label="Preview selected audio">', 'aria-label="Послушать выбранный звук">'],
  ['<span id="btn-preview-label">PREVIEW</span>', '<span id="btn-preview-label">ПОСЛУШАТЬ</span>'],
  ['aria-label="Crunch all">', 'aria-label="Обработать все">'],
  ['<span id="btn-process-label">CRUNCH</span>', '<span id="btn-process-label">ОБРАБОТАТЬ</span>'],
  ['<p class="codec-info export-hint">Making a Scratch game? Press <strong>FOR SCRATCH</strong> to get one WAV file per sound.</p>', '<p class="codec-info export-hint">Делаете игру в Scratch? Нажмите <strong>ДЛЯ SCRATCH</strong> — получите один WAV-файл на каждый звук.</p>'],
  ['<p id="codec-info" class="codec-info">Codecs: WAV 16-bit PCM · OGG q0 (~64 kbps) · MP3 128 kbps</p>', '<p id="codec-info" class="codec-info">Форматы: OGG q0 (~64 кбит/с) · WAV 16-бит PCM · MP3 128 кбит/с</p>'],
  ['<p id="effective-settings" class="effective-settings">Effective settings appear after a file is loaded.</p>', '<p id="effective-settings" class="effective-settings">Активные настройки появятся после загрузки файла.</p>'],
  ['class="btn btn--ghost btn--xs cancel-button" hidden>STOP PROCESSING</button>', 'class="btn btn--ghost btn--xs cancel-button" hidden>ОСТАНОВИТЬ</button>'],
  ['aria-label="Toggle comparison">', 'aria-label="Сравнить с оригиналом">'],
  ['<span class="ab-label">COMPARING:</span>', '<span class="ab-label">СЕЙЧАС ИГРАЕТ:</span>'],
  ['<span id="ab-status" class="ab-value">CRUNCHED (WET)</span>', '<span id="ab-status" class="ab-value">ОБРАБОТАННЫЙ</span>'],
  ['title="Automatically re-render preview when you change controls" aria-label="Toggle live parameter updates">', 'title="Автоматически обновлять звук при изменении ползунков" aria-label="Автообновление звука">'],
  ['<span class="live-label">LIVE UPDATE: <span id="live-status">ON</span></span>', '<span class="live-label">НА ЛЕТУ: <span id="live-status">ВКЛ</span></span>'],
  ['title="Loop preview continuously or play once as a one-shot SFX" aria-pressed="true" aria-label="Toggle preview loop">', 'title="Повторять по кругу или проиграть один раз как короткий эффект" aria-pressed="true" aria-label="Повтор по кругу">'],
  ['<span class="live-label">LOOP: <span id="loop-status">ON</span></span>', '<span class="live-label">ПОВТОР: <span id="loop-status">ВКЛ</span></span>'],
  ['title="Preview Volume">🔊</span>', 'title="Громкость прослушивания">🔊</span>'],
  ['aria-label="Preview volume"', 'aria-label="Громкость прослушивания"'],
  ['<span id="progress-text">Processing…</span>', '<span id="progress-text">Обработка…</span>'],

  // Log + results
  ['aria-label="Resize output panel"', 'aria-label="Изменить ширину панели результатов"'],
  ['aria-label="Processing log">', 'aria-label="Журнал обработки">'],
  ['<div class="panel-label" aria-hidden="true">[ LOG ]</div>', '<div class="panel-label" aria-hidden="true">[ ЖУРНАЛ ]</div>'],
  ['aria-label="Processing log output"', 'aria-label="Сообщения журнала"'],
  ['<p class="log-line log-line--sys">OGCruncher initialized</p>', '<p class="log-line log-line--sys">OGCruncher запущен</p>'],
  ['<p class="log-line log-line--sys">engine: OfflineAudioContext · Float32Array DSP</p>', '<p class="log-line log-line--sys">движок: OfflineAudioContext · Float32Array DSP</p>'],
  ['<span id="norm-ceiling-label" class="toggle-label-text">-1 dBFS PEAK</span>', '<span id="norm-ceiling-label" class="toggle-label-text">-1 дБFS ПИК</span>'],
  ['<p class="log-line log-line--sys">status: awaiting input ▌</p>', '<p class="log-line log-line--sys">статус: ожидание файла ▌</p>'],
  ['<span id="results-batch-summary" class="results-batch-summary">0 files ready</span>', '<span id="results-batch-summary" class="results-batch-summary">0 файлов готово</span>'],
  ['class="btn btn--ghost btn--xs">CLEAR RESULTS</button>', 'class="btn btn--ghost btn--xs">ОЧИСТИТЬ РЕЗУЛЬТАТЫ</button>'],
  ['class="btn btn--primary btn--xs btn-download-zip" hidden>DOWNLOAD ALL (.ZIP)</button>', 'class="btn btn--primary btn--xs btn-download-zip" hidden>СКАЧАТЬ ВСЁ (.ZIP)</button>'],
  ['aria-label="Download results"', 'aria-label="Готовые файлы"'],

  // Guide
  ['<span class="tool-intro__kicker">DOCUMENTATION &amp; GAME AUDIO GUIDE</span>', '<span class="tool-intro__kicker">СПРАВКА: ЗВУК ДЛЯ ИГР</span>'],
  ['<h2 id="seo-guide-title" class="seo-guide__title">Free Online Audio Bit-Crusher, Sample Rate Reducer &amp; Game SFX Optimizer</h2>', '<h2 id="seo-guide-title" class="seo-guide__title">Бесплатный биткрашер онлайн и конвертер звука для игр и Scratch</h2>'],
  [/<p class="seo-guide__lead">[\s\S]*?<\/p>/, `<p class="seo-guide__lead">
        <strong>OGCruncher</strong> — браузерный инструмент для звука от <a data-goatcounter-click="ogcruncher-hub" href="https://sivochka.com/?ref=OGCruncher" target="_blank" rel="noopener noreferrer">Игоря Сивочки (Figarist)</a>. Перетащите файлы <code>WAV</code>, <code>MP3</code>, <code>FLAC</code>, <code>OGG</code> или <code>AIFF</code> в очередь, уменьшите битность и частоту, добавьте фильтры или хруст, сравните «было» и «стало» и сохраните готовые звуки для игры. Всё работает локально через <code>OfflineAudioContext</code> и Web Workers — файлы никуда не отправляются.
      </p>`],
  [/<article class="seo-card">\s*<h3>1–16 Bit Quantization[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Звук для Scratch за 3 шага</h3>
        <p>
          1) Перетащите звук или нажмите «ПОПРОБОВАТЬ ПРИМЕР». 2) Выберите готовый пресет, например <strong>NES 8-BIT</strong>, и нажмите «ПОСЛУШАТЬ». 3) Нажмите <strong>«ДЛЯ SCRATCH»</strong>, затем «ОБРАБОТАТЬ» и скачайте WAV. В Scratch откройте вкладку «Звуки» → «Загрузить звук». Scratch не открывает <code>.ogg</code>, а один звук должен весить до 10 МБ.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Simultaneous Batch Export[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Битность, частота, дизер и хруст: 1–16 бит</h3>
        <p>
          Создайте настоящий 4-, 8- или 12-битный звук и уменьшите частоту от 4 000 до 48 000 Гц кнопками стандартных значений. <strong>Краш-режим</strong> убирает DC-смещение, добавляет мягкий экспандер <code>|x|^1.15</code> и сглаживает алиасинг. <strong>TPDF-дизер</strong> смягчает зернистость, <strong>хруст</strong> (<code>tanh</code>) добавляет плотности, а <strong>шум</strong> — шипение старой кассеты.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Retro Console Presets[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Пакетное сохранение в WAV, OGG и MP3 для Unity и Godot</h3>
        <p>
          Добавьте в очередь десятки эффектов и обработайте их с одинаковыми настройками. Выберите нужные форматы: 8- или 16-битный <strong>PCM WAV</strong> для мгновенного воспроизведения, <strong>Ogg Vorbis</strong> для компактных лупов и <strong>MP3</strong> (128 кбит/с, на 8–12 кГц — 64 кбит/с). Кнопка «СВОИ ИМЕНА» сохраняет исходные имена файлов для <code>.meta</code> в Unity и <code>.import</code> в Godot, а обрезка тишины убирает паузу перед ударом.
        </p>
      </article>`],
  ['<h3 id="seo-matrix-title" class="seo-table__title">Recommended Settings for Game Engines &amp; Retro Targets</h3>', '<h3 id="seo-matrix-title" class="seo-table__title">Рекомендуемые настройки для игр и Scratch</h3>'],
  ['<th scope="col">Target / Use Case</th>', '<th scope="col">Назначение</th>'],
  ['<th scope="col">Bit Depth &amp; Rate</th>', '<th scope="col">Битность и частота</th>'],
  ['<th scope="col">Channels &amp; DSP</th>', '<th scope="col">Каналы и эффекты</th>'],
  ['<th scope="col">Recommended Format</th>', '<th scope="col">Формат</th>'],
  ['<td><strong>Unity / Godot Low-Latency Combat &amp; UI SFX</strong></td>', '<td><strong>Unity / Godot: удары, выстрелы, клики интерфейса</strong></td>'],
  ['<td>8–12 bit · 22,050 Hz</td>', '<td>8–12 бит · 22 050 Гц</td>'],
  ['<td>Mono · Normalize ON · HPF 80 Hz</td>', '<td>Моно · Нормализация ВКЛ · HPF 80 Гц</td>'],
  ['<td>PCM WAV (zero decode latency; note: Unity re-encodes imported WAVs per AudioClip Import Settings)</td>', '<td>PCM WAV (играет без задержки; Unity всё равно перекодирует WAV по настройкам импорта AudioClip)</td>'],
  ['<td><strong>Wear OS, Mobile &amp; WebGL Loops</strong></td>', '<td><strong>Wear OS, смартфоны и WebGL: лупы и музыка</strong></td>'],
  ['<td>12–16 bit · 22,050–32,000 Hz</td>', '<td>12–16 бит · 22 050–32 000 Гц</td>'],
  ['<td>Mono or Stereo · Dither ON · Grit 1.2</td>', '<td>Моно или стерео · Дизер ВКЛ · Хруст 1,2</td>'],
  ['<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS support for OGG is limited and version-dependent, so ship an MP3 fallback for WebGL</td>', '<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS поддерживает OGG ограниченно, поэтому для WebGL добавьте MP3</td>'],
  ['<td><strong>Scratch 3.0 (Kids &amp; Classroom Games)</strong></td>', '<td><strong>Scratch 3.0 (игры детей и на уроках)</strong></td>'],
  ['<td>8–16 bit · 22,050 Hz</td>', '<td>8–16 бит · 22 050 Гц</td>'],
  ['<td>Mono · Normalize ON</td>', '<td>Моно · Нормализация ВКЛ</td>'],
  ['<td>PCM WAV (short SFX) or MP3 (music), max 10 MB per file — Scratch 3.0 does not import <code>.ogg</code></td>', '<td>Кнопка «ДЛЯ SCRATCH» → WAV (для длинной музыки — MP3), до 10 МБ на файл; <code>.ogg</code> Scratch не открывает</td>'],
  ['<td><strong>NES / 8-Bit Chiptune Crunch</strong></td>', '<td><strong>NES / 8-битный чиптюн</strong></td>'],
  ['<td>4 bit · 12,000 Hz</td>', '<td>4 бита · 12 000 Гц</td>'],
  ['<td>Mono · Crush ON · Dither OFF · LPF 6 kHz</td>', '<td>Моно · Краш ВКЛ · Дизер ВЫКЛ · LPF 6 кГц</td>'],
  ['<td>8-Bit PCM WAV or OGG</td>', '<td>8-битный PCM WAV или OGG</td>'],
  ['<td><strong>Amiga 500 / 90s Tracker Sampler</strong></td>', '<td><strong>Amiga 500 / трекерная музыка 90-х</strong></td>'],
  ['<td>8 bit · 28,000 Hz</td>', '<td>8 бит · 28 000 Гц</td>'],
  ['<td>Stereo · Grit 1.5 · Noise -46 dB · LPF 10 kHz</td>', '<td>Стерео · Хруст 1,5 · Шум -46 дБ · LPF 10 кГц</td>'],
  ['<td>8-Bit PCM WAV / MP3 preview</td>', '<td>8-битный PCM WAV / MP3</td>'],
  [/<h2 id="faq-heading" class="seo-guide__subtitle">Frequently Asked Questions \(FAQ\)<\/h2>[\s\S]*?(?=\n    <\/section>)/,
    `<h2 id="faq-heading" class="seo-guide__subtitle">Частые вопросы (FAQ)</h2>\n${faqHtml}`],
  [`<aside class="seo-locale-card" aria-labelledby="seo-locale-title">
      <h3 id="seo-locale-title">OGCruncher in other languages</h3>
      <p>Full localized versions of the tool with plain-language guides for Scratch, Unity, and Godot.</p>
      <ul class="seo-locale-links">
        <li><a href="uk/" hreflang="uk" lang="uk">Українська версія →</a></li>
        <li><a href="pl/" hreflang="pl" lang="pl">Wersja polska →</a></li>
        <li><a href="ru/" hreflang="ru" lang="ru">Русская версия →</a></li>
        <li><a href="ko/" hreflang="ko" lang="ko">한국어 버전 →</a></li>
      </ul>
    </aside>`,
    `<aside class="seo-locale-card" aria-labelledby="seo-locale-title">
      <h3 id="seo-locale-title">OGCruncher на других языках</h3>
      <p>Полные версии инструмента на английском, украинском, польском и корейском языках.</p>
      <ul class="seo-locale-links">
        <li><a href="../" hreflang="en" lang="en">English version →</a></li>
        <li><a href="../uk/" hreflang="uk" lang="uk">Українська версія →</a></li>
        <li><a href="../pl/" hreflang="pl" lang="pl">Wersja polska →</a></li>
        <li><a href="../ko/" hreflang="ko" lang="ko">한국어 버전 →</a></li>
      </ul>
    </aside>`],

  // Footer, notices, modal
  ['<span class="footer-note">Made by Ihor Sivochka for game developers and curious people.</span>', '<span class="footer-note">Сделал Игорь Сивочка для разработчиков игр и всех любознательных.</span>'],
  ['<a href="#guide" class="footer-link">Guide</a>', '<a href="#guide" class="footer-link">Справка</a>'],
  ['<a href="#faq" class="footer-link">FAQ</a>', '<a href="#faq" class="footer-link">Вопросы</a>'],
  ['<a href="https://sivochka.com/privacy/" class="footer-link" target="_blank" rel="noopener noreferrer">Privacy policy</a>', '<a href="https://sivochka.com/ru/privacy/" class="footer-link" target="_blank" rel="noopener noreferrer">Политика конфиденциальности</a>'],
  ['<strong>UPDATE READY</strong>', '<strong>ЕСТЬ ОБНОВЛЕНИЕ</strong>'],
  ['<span id="sw-update-message">A new version is waiting.</span>', '<span id="sw-update-message">Новая версия уже готова.</span>'],
  ['class="btn btn--primary btn--xs">ACTIVATE &amp; RELOAD</button>', 'class="btn btn--primary btn--xs">ОБНОВИТЬ И ПЕРЕЗАГРУЗИТЬ</button>'],
  ['<h2 id="modal-info-title" class="modal-title">ABOUT OGCRUNCHER</h2>', '<h2 id="modal-info-title" class="modal-title">О OGCRUNCHER</h2>'],
  ['<p>OGCruncher is a small browser audio tool by Ihor Sivochka. Shape high-quality audio into gritty, lo-fi samples for games, Wear OS assets and retro projects. Files are processed locally in your browser.</p>', '<p>OGCruncher — небольшой браузерный инструмент для звука от Игоря Сивочки. Он превращает чистый звук в хрустящие ретро-эффекты для игр, Scratch, Wear OS и ретро-проектов. Файлы обрабатываются локально в вашем браузере.</p>'],
  ['<button id="btn-info-ok" class="btn btn--primary" style="width:100%">UNDERSTOOD</button>', '<button id="btn-info-ok" class="btn btn--primary" style="width:100%">ПОНЯТНО</button>'],
];

module.exports = { meta, jsonLd, pairs };
