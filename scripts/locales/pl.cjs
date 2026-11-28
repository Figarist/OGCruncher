/**
 * Polish page source: exact English → Polish replacements applied to
 * index.html by scripts/build-locales.cjs. Every English string must exist in
 * index.html; the generator fails loudly when the English page drifts.
 */

const BASE = 'https://sivochka.com/OGCruncher/pl/';

const meta = {
  lang: 'pl',
  ogLocale: 'pl_PL',
  canonical: BASE,
  title: 'OGCruncher — bitcrusher i konwerter audio online',
  description: 'Darmowy bitcrusher online: zmniejsz głębię bitową i próbkowanie, zapisz WAV, MP3 lub OGG dla Unity, Godot i Scratch. Pliki zostają w przeglądarce.',
  imageAlt: 'OGCruncher — darmowy bitcrusher, redukcja próbkowania i wsadowy eksport OGG/WAV/MP3',
  keywords: 'OGCruncher, bitcrusher online, dźwięk 8-bit online, konwerter audio do gier, dźwięk do Scratch, WAV do Scratch, kompresja audio Unity, dźwięk retro, lo-fi audio, zmniejsz częstotliwość próbkowania, konwerter OGG WAV MP3',
};

const faq = [
  {
    q: 'Czym jest OGCruncher i czym różni się od zwykłego konwertera audio?',
    a: 'OGCruncher to darmowy przeglądarkowy bitcrusher i wsadowy konwerter audio dla twórców gier, Wear OS i projektów retro. Nie tylko przekodowuje plik, ale celowo kształtuje brzmienie: filtry i prędkość przez OfflineAudioContext, miękki ekspander, kwantyzację 1–16 bitów, dither TPDF i nasycenie tanh, a potem eksportuje OGG, WAV i MP3.',
  },
  {
    q: 'Czy moje pliki audio są gdziekolwiek wysyłane?',
    a: 'Nie. Twoje pliki zostają na urządzeniu: dekodowanie, filtry, obróbka DSP i kodowanie do OGG/WAV/MP3 działają lokalnie w przeglądarce oraz w osobnym Web Workerze. Z sieci pobierane są jedynie pliki samej strony i opcjonalny przykład dźwięku.',
  },
  {
    q: 'Jaki format wybrać dla Scratch 3.0?',
    a: 'Kliknij przycisk „DLA SCRATCH”: narzędzie zapisze jeden plik WAV dla każdego dźwięku. Scratch 3.0 obsługuje WAV i MP3, natomiast nie otwiera plików OGG. Pojedynczy dźwięk nie może przekraczać 10 MB; do dłuższej muzyki wybierz MP3 lub niższą jakość.',
  },
  {
    q: 'Jak OGCruncher wybiera między 8-bitowym a 16-bitowym WAV?',
    a: 'Rozdzielczość pliku WAV automatycznie dopasowuje się do suwaka „GŁĘBIA BITOWA”: od 1 do 8 bitów eksport odbywa się jako 8-bitowy PCM WAV, a od 9 do 16 bitów jako 16-bitowy. Dzięki temu krótkie efekty 8-bitowe pozostają lekkie, a nagrania 12- i 16-bitowe nie tracą precyzji.',
  },
  {
    q: 'Jaki format i próbkowanie wybrać do Unity, Godot, WebGL lub Wear OS?',
    a: 'Do krótkich kliknięć interfejsu, kroków i ciosów wybierz mono PCM WAV 8 lub 16 bit przy 16 000–22 050 Hz: odtwarza się natychmiast bez dekodowania. Do pętli tła i muzyki użyj Ogg Vorbis 22 050–32 000 Hz, gdy liczy się rozmiar APK lub paczki WebGL. Unity i tak przekodowuje importowane WAV według ustawień AudioClip, a Safari/iOS ma ograniczone wsparcie OGG, więc dla WebGL warto dodać MP3 jako zapas.',
  },
  {
    q: 'Dlaczego MP3 przy bardzo niskiej częstotliwości (np. 4 000 Hz) zapisuje się jako 8 000 Hz?',
    a: 'Standard MPEG dla MP3 obsługuje tylko dziewięć częstotliwości próbkowania, a najniższa to 8 000 Hz (8k, 11.025k, 12k, 16k, 22.05k, 24k, 32k, 44.1k i 48k). Gdy wybierzesz nietypową wartość, np. 4 000 lub 28 000 Hz, WAV i OGG zachowują ją dokładnie, a MP3 jest przepróbkowane oknem Lanczos-3 do najbliższej dozwolonej częstotliwości. Przy 8–12 kHz MP3 ma 64 kbps, a wyżej 128 kbps.',
  },
  {
    q: 'Jak działa przetwarzanie wsadowe, ZIP i linki z ustawieniami?',
    a: 'Wrzuć kilka plików do kolejki, ustaw brzmienie i kliknij „PRZETWÓRZ”: wszystkie pliki przejdą z tymi samymi parametrami. Potem pobierz każdy plik osobno, całość przyciskiem „POBIERZ WSZYSTKO (.ZIP)” albo kliknij „KOPIUJ LINK”, aby udostępnić swoje ustawienia.',
  },
  {
    q: 'Jak w 10 sekund zrobić 8-bitowy efekt dźwiękowy do Unity lub Godot?',
    a: 'Dodaj czysty dźwięk skoku lub uderzenia w WAV albo MP3, ustaw głębię na 4–8 bitów i częstotliwość 11 025–16 000 Hz (mono), włącz tryb Crush i zapisz jako OGG lub 8-bitowy WAV.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE}#app`,
      name: 'OGCruncher',
      alternateName: ['OG Cruncher', 'OGCruncher bitcrusher', 'Figarist OGCruncher'],
      url: BASE,
      inLanguage: 'pl',
      description: 'Darmowy bitcrusher w przeglądarce, reduktor próbkowania i wsadowy konwerter audio do OGG/WAV/MP3 oparty na OfflineAudioContext i Web Workers.',
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'Przetwarzanie audio do gier',
      operatingSystem: 'Dowolna przeglądarka (Windows, macOS, Linux, Android, iOS)',
      browserRequirements: 'Wymaga Web Audio API (OfflineAudioContext) oraz Web Workers',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Kwantyzacja dźwięku 1–16 bitów i tryb Crush (usuwanie składowej DC, miękki ekspander, wygładzanie antyaliasingowe)',
        'Częstotliwość próbkowania od 4 000 do 48 000 Hz z przyciskami standardowych wartości',
        'Nasycenie tanh (Grit), szum taśmy i trójkątny dither TPDF',
        'Filtry HPF i LPF, podbicie basu 80 Hz, prędkość/wysokość dźwięku i normalizacja szczytu do -1 lub 0 dBFS',
        'Przetwarzanie w 100% lokalnie w przeglądarce, bez wysyłania plików',
        'Wsadowy eksport do wybranych formatów OGG, 8/16-bit PCM WAV i MP3, oryginalne nazwy plików i archiwum ZIP',
        'Automatyczne przycinanie ciszy na początku i końcu z krótkim wyciszeniem bez trzasków',
        'Przycisk „DLA SCRATCH”: jeden plik WAV na dźwięk dla Scratch 3.0',
      ],
      image: 'https://sivochka.com/OGCruncher/images/social-card.png',
      author: {
        '@type': 'Person',
        '@id': 'https://sivochka.com#person',
        name: 'Ihor Sivochka',
        alternateName: ['Ігор Сівочка', 'Sivochka Ihor', 'Ігор Глібович Сівочка', 'Игорь Сивочка', 'Figarist'],
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
        { '@type': 'ListItem', position: 3, name: 'Po polsku', item: BASE },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}#faq`,
      inLanguage: 'pl',
      mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ],
};

const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const faqHtml = faq.map((item, index) => `      <details class="faq-item"${index === 0 ? ' open' : ''}>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`).join('\n');

/** [english, polish] pairs; each English string must appear in index.html. */
const pairs = [
  // Paths: pl/index.html lives one folder deeper.
  ['<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="../style.css" />'],
  ['<script type="module" src="js/main.js"></script>', '<script type="module" src="../js/main.js"></script>'],

  // Header
  ['aria-label="Back to Figarist"', 'aria-label="Powrót na stronę Figarist"'],
  ['<span class="logo-title__kw"> Free Online Audio Bit-Crusher &amp; Compressor</span>', '<span class="logo-title__kw"> darmowy bitcrusher i konwerter audio online</span>'],
  ['aria-label="OGCruncher navigation"', 'aria-label="Nawigacja OGCruncher"'],
  ['title="Install OGCruncher as a standalone app" hidden>⬇ INSTALL APP</button>', 'title="Zainstaluj OGCruncher jako osobną aplikację" hidden>⬇ ZAINSTALUJ</button>'],
  ['aria-label="Language">', 'aria-label="Język">'],
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
    `<span id="lang-current">PL</span>
            <span class="lang-caret" aria-hidden="true">▾</span>
          </button>
          <div id="lang-menu" class="lang-menu" role="menu" hidden>
            <a class="lang-btn" href="../" hreflang="en" lang="en" role="menuitem">EN · English</a>
            <a class="lang-btn" href="../uk/" hreflang="uk" lang="uk" role="menuitem">UK · Українська</a>
            <a class="lang-btn is-active" href="./" hreflang="pl" lang="pl" role="menuitem" aria-current="page">PL · Polski</a>
            <a class="lang-btn" href="../ru/" hreflang="ru" lang="ru" role="menuitem">RU · Русский</a>
            <a class="lang-btn" href="../ko/" hreflang="ko" lang="ko" role="menuitem">KO · 한국어</a>
          </div>`],
  ['title="About OGCruncher">ABOUT</button>', 'title="O OGCruncher">O PROGRAMIE</button>'],

  // Intro
  ['aria-label="OGCruncher status"', 'aria-label="Status OGCruncher"'],
  ['<span class="tool-intro__kicker">A SMALL TOOL FOR BIG SOUNDS</span>', '<span class="tool-intro__kicker">MAŁE NARZĘDZIE DO WIELKICH DŹWIĘKÓW</span>'],
  ['<p>Shape, preview and export game audio without leaving your browser.</p>', '<p>Kształtuj, odsłuchuj i eksportuj dźwięki do gier bez opuszczania przeglądarki.</p>'],
  ['</span> Files stay in this browser</span>', '</span> Pliki zostają w tej przeglądarce</span>'],

  // Input panel
  ['aria-label="Audio processing workspace"', 'aria-label="Obszar roboczy obróbki dźwięku"'],
  ['aria-label="File input panel"', 'aria-label="Panel plików wejściowych"'],
  ['<div class="panel-label" aria-hidden="true">[ INPUT ]</div>', '<div class="panel-label" aria-hidden="true">[ PLIKI ]</div>'],
  ['title="Show both spectra simultaneously">DUAL VIEW: OFF</button>', 'title="Pokaż oba widma jednocześnie">DWA WYKRESY: WYŁ.</button>'],
  ['aria-label="Drag and drop audio files here"', 'aria-label="Przeciągnij i upuść pliki audio tutaj"'],
  ['<p class="drop-title">DROP AUDIO FILES HERE</p>', '<p class="drop-title">UPUŚĆ PLIKI AUDIO TUTAJ</p>'],
  ['<p class="drop-sub">or <label for="file-input" class="file-label-btn">BROWSE FILES</label></p>', '<p class="drop-sub">lub <label for="file-input" class="file-label-btn">WYBIERZ PLIKI</label></p>'],
  ['title="Test OGCruncher with a pre-loaded track"', 'title="Przetestuj OGCruncher na gotowym dźwięku"'],
  ['<span id="btn-load-demo-label">TRY DEMO TRACK 🎵</span>', '<span id="btn-load-demo-label">WYPRÓBUJ PRZYKŁAD 🎵</span>'],
  ['<span class="metrics-label">RMS</span>', '<span class="metrics-label" title="Średnia głośność (RMS)">RMS</span>'],
  ['<span class="metrics-label">PEAK</span>', '<span class="metrics-label" title="Poziom szczytowy (PEAK)">SZCZYT</span>'],
  ['<span class="metrics-label">DUR</span>', '<span class="metrics-label" title="Czas trwania">CZAS</span>'],
  ['DRY —</span>', 'BYŁO —</span>'],
  ['WET —</span>', 'JEST —</span>'],
  ['aria-label="Choose audio files"', 'aria-label="Wybierz pliki audio"'],
  ['<span class="panel-label" style="margin:0">[ QUEUE ]</span>', '<span class="panel-label" style="margin:0">[ KOLEJKA ]</span>'],
  ['aria-label="Clear queue">CLEAR</button>', 'aria-label="Wyczyść kolejkę">WYCZYŚĆ</button>'],
  ['aria-label="Processing queue"', 'aria-label="Kolejka przetwarzania"'],
  ['<span class="savings-title-text">⚡ SIZE OUTLOOK · METADATA-BACKED ESTIMATES</span>', '<span class="savings-title-text">⚡ SZACOWANY ROZMIAR · NA PODSTAWIE METADANYCH</span>'],
  ['class="badge badge--amber">ANALYZING…</span>', 'class="badge badge--amber">LICZĘ…</span>'],
  ['<span class="savings-label">ORIGINAL</span>', '<span class="savings-label">ORYGINAŁ</span>'],
  ['<span class="savings-label">EST. WAV</span>', '<span class="savings-label">≈ WAV</span>'],
  ['<span class="savings-label">EST. OGG RANGE</span>', '<span class="savings-label">≈ OGG</span>'],
  ['<span class="savings-label">EST. MP3</span>', '<span class="savings-label">≈ MP3</span>'],
  ['aria-label="Resize input panel"', 'aria-label="Zmień szerokość panelu plików"'],

  // Controls
  ['aria-label="Processing controls"', 'aria-label="Ustawienia przetwarzania"'],
  ['<div class="panel-label" aria-hidden="true">[ PARAMETERS ]</div>', '<div class="panel-label" aria-hidden="true">[ PARAMETRY ]</div>'],
  ['aria-label="Processing mode"', 'aria-label="Tryb przetwarzania"'],
  ['aria-label="Switch to Simple mode">SIMPLE</button>', 'aria-label="Przełącz na tryb prosty">PROSTY</button>'],
  ['aria-label="Switch to Advanced mode">ADVANCED</button>', 'aria-label="Przełącz na tryb zaawansowany">ZAAWANSOWANY</button>'],
  ['<span class="control-label">PRESETS</span>', '<span class="control-label">PRESETY</span>'],
  ['title="Copy current settings as a shareable link">COPY LINK</button>', 'title="Skopiuj obecne ustawienia jako link">KOPIUJ LINK</button>'],
  ['title="Save current settings as your custom preset">SAVE CURRENT</button>', 'title="Zapisz obecne ustawienia jako własny preset">ZAPISZ WŁASNY</button>'],
  ['aria-label="Apply Author\'s LO-Q preset (8-bit, 22050Hz)"', 'aria-label="Zastosuj autorski preset LO-Q (8 bit, 22050 Hz)"'],
  ['<span class="preset-card__meta">8-bit / 22k Hz</span>', '<span class="preset-card__meta">8 bit / 22k Hz</span>'],
  ['aria-label="Apply retro gaming NES preset (4-bit, 12000Hz)"', 'aria-label="Zastosuj retro preset NES (4 bit, 12000 Hz)"'],
  ['<span class="preset-card__meta">4-bit / 12k Hz</span>', '<span class="preset-card__meta">4 bit / 12k Hz</span>'],
  ['aria-label="Apply vintage sampler Amiga 500 preset (8-bit, 28000Hz)"', 'aria-label="Zastosuj preset samplera Amiga 500 (8 bit, 28000 Hz)"'],
  ['<span class="preset-card__meta">8-bit / 28k Hz</span>', '<span class="preset-card__meta">8 bit / 28k Hz</span>'],
  ['aria-label="Apply your custom preset" disabled>', 'aria-label="Zastosuj własny preset" disabled>'],
  ['<span class="preset-card__title">MY PRESET</span>', '<span class="preset-card__title">MÓJ PRESET</span>'],
  ['<span id="preset-user-meta" class="preset-card__meta">NOT SAVED</span>', '<span id="preset-user-meta" class="preset-card__meta">NIEZAPISANY</span>'],
  ['<span class="control-label">SIZE & QUALITY</span>', '<span class="control-label">ROZMIAR I JAKOŚĆ</span>'],
  ['<span id="out-simple-quality" class="control-value">HIGH</span>', '<span id="out-simple-quality" class="control-value">WYSOKI</span>'],
  ['aria-label="Adjust size and quality"', 'aria-label="Dostosuj rozmiar i jakość"'],
  ['data-val="0">TINY</span>', 'data-val="0">MINI</span>'],
  ['data-val="1">LOW</span>', 'data-val="1">NISKI</span>'],
  ['data-val="2">MEDIUM</span>', 'data-val="2">ŚREDNI</span>'],
  ['data-val="3">HIGH</span>', 'data-val="3">WYSOKI</span>'],
  ['<p class="simple-desc" id="simple-quality-desc">High Quality (32kHz / 16-bit) — clear and optimized.</p>', '<p class="simple-desc" id="simple-quality-desc">Wysoka jakość (32 kHz / 16 bit) — najmniejsza zmiana brzmienia.</p>'],
  ['data-tooltip="Audio resolution (bits). Lower bits = more \'pixelated\' noise and lo-fi artifacts.">BIT DEPTH</label>', 'data-tooltip="Rozdzielczość dźwięku w bitach. Mniej bitów = bardziej „pikselowy” chrzęst jak ze starych gier.">GŁĘBIA BITOWA</label>'],
  ['aria-label="Bit depth"', 'aria-label="Głębia bitowa"'],
  ['data-tooltip="Sampling frequency. Lower values make audio muffled and add metallic aliasing.">RATE</label>', 'data-tooltip="Częstotliwość próbkowania. Niższe wartości przytłumiają dźwięk i dodają metaliczny aliasing.">PRÓBKOWANIE</label>'],
  ['22050 <span class="unit">Hz</span></output>', '22050 <span class="unit">Hz</span></output>'],
  ['aria-label="Sample rate in Hz"', 'aria-label="Częstotliwość próbkowania w Hz"'],
  ['data-tooltip="Saturation drive (tanh). 1.0 is clean bypass (OFF); higher values add harmonic density.">GRIT</label>', 'data-tooltip="Nasycenie (tanh). 1.0 to czysty sygnał (WYŁ.); wyższe wartości zagęszczają brzmienie.">NASYCENIE</label>'],
  ['<output id="out-grit" for="slider-grit" class="control-value">OFF</output>', '<output id="out-grit" for="slider-grit" class="control-value">WYŁ.</output>'],
  ['aria-label="Saturation drive amount"', 'aria-label="Siła nasycenia"'],
  ['data-tooltip="Adds subtle floor hiss of vintage gear or tape (shown in dBFS).">NOISE</label>', 'data-tooltip="Dodaje delikatny szum starego sprzętu lub taśmy (w dBFS).">SZUM</label>'],
  ['<output id="out-noise" for="slider-noise" class="control-value">OFF</output>', '<output id="out-noise" for="slider-noise" class="control-value">WYŁ.</output>'],
  ['aria-label="Noise floor level"', 'aria-label="Poziom szumu"'],
  ['data-tooltip="Creative bit-crush pipeline: DC removal, |x|^1.15 soft expander, quantization, and 2-tap anti-alias smoothing.">CRUSH MODE</label>', 'data-tooltip="Kreatywny bit-crush: usunięcie DC, miękki ekspander |x|^1.15, kwantyzacja i wygładzanie antyaliasingowe.">TRYB CRUSH</label>'],
  ['<span id="out-mariomode" class="control-value" aria-live="polite">ON</span>', '<span id="out-mariomode" class="control-value" aria-live="polite">WŁ.</span>'],
  ['title="DC removal, soft expander (|x|^1.15), quantization, and 2-tap anti-alias smoothing"', 'title="Usunięcie DC, miękki ekspander (|x|^1.15), kwantyzacja i wygładzanie antyaliasingowe"'],
  ['aria-label="Enable expander, dither and anti-alias pipeline"', 'aria-label="Włącz tryb Crush"'],
  ['<span class="toggle-label-text">EXPANDER</span>', '<span class="toggle-label-text">EKSPANDER</span>'],
  ['data-tooltip="Adds triangular TPDF dither to soften quantization distortion. Turn OFF for raw retro grit.">DITHER</label>', 'data-tooltip="Trójkątny dither TPDF łagodzi zniekształcenia kwantyzacji. Wyłącz dla surowego efektu retro.">DITHER</label>'],
  ['<span id="out-dither" class="control-value" aria-live="polite">ON</span>', '<span id="out-dither" class="control-value" aria-live="polite">WŁ.</span>'],
  ['aria-label="Toggle triangular TPDF dither noise"', 'aria-label="Przełącz dither TPDF"'],
  ['data-tooltip="Normalizes output peak to -1 dBFS (safe headroom for OGG/MP3) or 0 dBFS full scale.">NORMALIZE</label>', 'data-tooltip="Normalizuje szczyt wyjścia do -1 dBFS (bezpieczny zapas dla OGG/MP3) lub 0 dBFS.">NORMALIZACJA</label>'],
  ['title="Toggle normalization ceiling between -1 dBFS (safe headroom for lossy codecs) and 0 dBFS">-1 dB</button>', 'title="Przełącz sufit normalizacji między -1 dBFS (zapas dla OGG/MP3) a 0 dBFS">-1 dB</button>'],
  ['<span id="out-normalize" class="control-value">ON</span>', '<span id="out-normalize" class="control-value">WŁ.</span>'],
  ['aria-label="Enable peak normalization"', 'aria-label="Włącz normalizację szczytu"'],
  ['data-tooltip="Converts stereo to mono. Perfect for game SFX to save memory and CPU.">OUTPUT</label>', 'data-tooltip="Zamienia stereo na mono. Idealne dla efektów w grach — oszczędza pamięć i CPU.">KANAŁY</label>'],
  ['<span id="out-stereo" class="control-value">MONO</span>', '<span id="out-stereo" class="control-value">MONO</span>'],
  ['aria-label="Toggle between Mono and Stereo output"', 'aria-label="Przełącz między Mono a Stereo"'],
  ['<span class="toggle-label-text">FORCE MONO</span>', '<span class="toggle-label-text">WYMUSZAJ MONO</span>'],
  ['data-tooltip="Trims leading and trailing silence below -48 dBFS and applies a 4 ms click-free micro-fade.">TRIM SILENCE</label>', 'data-tooltip="Przytnie ciszę poniżej -48 dBFS na początku i końcu oraz doda krótkie wyciszenie bez trzasków.">PRZYTNIJ CISZĘ</label>'],
  ['<span id="out-trim" class="control-value" aria-live="polite">OFF</span>', '<span id="out-trim" class="control-value" aria-live="polite">WYŁ.</span>'],
  ['aria-label="Enable auto-trim silence with micro-fade"', 'aria-label="Włącz przycinanie ciszy"'],
  ['<span class="toggle-label-text">-48 dB + FADE</span>', '<span class="toggle-label-text">-48 dB + FADE</span>'],
  ['data-tooltip="Adjust playback speed. Lowering it creates a \'slow & chopped\' effect with lower pitch.">SPEED / PITCH</label>', 'data-tooltip="Prędkość odtwarzania. Wolniej obniża ton, szybciej go podwyższa.">PRĘDKOŚĆ / TON</label>'],
  ['aria-label="Playback speed and pitch"', 'aria-label="Prędkość i wysokość dźwięku"'],
  ['data-tooltip="Fine-tune frequencies to shape your lo-fi sound.">FILTERS & EQ</span>', 'data-tooltip="Precyzyjnie przytnij lub podbij wybrane pasma.">FILTRY I EQ</span>'],
  ['data-tooltip="Cuts low frequencies (rumble). Helps remove muddy bass and clear up the mix.">HPF (CUT LOWS)</label>', 'data-tooltip="Obcina niskie częstotliwości (dudnienie) i oczyszcza brzmienie.">HPF (OBETNIJ DÓŁ)</label>'],
  ['<output id="out-hpf" class="filter-value">20 Hz</output>', '<output id="out-hpf" class="filter-value">20 Hz</output>'],
  ['data-tooltip="Cuts high frequencies. Makes sound soft, \'underwater\' or phone-like.">LPF (CUT HIGHS)</label>', 'data-tooltip="Obcina wysokie częstotliwości. Dźwięk staje się miękki, jak pod wodą lub z telefonu.">LPF (OBETNIJ GÓRĘ)</label>'],
  ['<output id="out-lpf" class="filter-value">OFF</output>', '<output id="out-lpf" class="filter-value">WYŁ.</output>'],
  ['data-tooltip="Enhances low-end frequencies for a deeper and more powerful punch.">BASS BOOST (80Hz)</label>', 'data-tooltip="Wzmacnia niskie pasmo dla głębszego, mocniejszego uderzenia.">PODBICIE BASU (80 Hz)</label>'],
  ['<summary>HOW SETTINGS WORK</summary>', '<summary>JAK DZIAŁAJĄ USTAWIENIA</summary>'],
  [`<p>Simple mode selects a complete quality tier. Advanced mode exposes every
        parameter. Preview uses the same offline render order as export; ORIGINAL
        means a dry signal at the selected output rate, channel mode and speed.</p>`,
    `<p>Tryb prosty wybiera gotowy poziom jakości. Tryb zaawansowany odkrywa
        wszystkie suwaki. Odsłuch brzmi dokładnie tak jak eksport; ORYGINAŁ to
        surowy sygnał przy wybranym próbkowaniu, kanałach i prędkości.</p>`],
  [`<p>Monitor volume changes listening level only. Normalize is linked peak
        normalization for export and is not perceptual loudness matching.</p>`,
    `<p>Suwak głośności 🔊 zmienia tylko poziom odsłuchu. Normalizacja wyrównuje
        szczyt pliku wyjściowego, a nie subiektywną głośność.</p>`],

  ['<span class="toggle-label-text">TPDF DITHER</span>', '<span class="toggle-label-text">TPDF DITHER</span>'],
  ['<span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>', '<span>0,5×</span><span>1,0×</span><span>1,5×</span><span>2,0×</span>'],
  ['<output id="out-bass" class="filter-value">+0 dB</output>', '<output id="out-bass" class="filter-value">0 dB</output>'],
  ['class="savings-val">0 KB</span>', 'class="savings-val">0 KB</span>'],

  // Export + actions
  ['aria-label="Export format and naming options"', 'aria-label="Formaty eksportu i nazwy plików"'],
  ['<span class="export-options__label">EXPORT</span>', '<span class="export-options__label">EKSPORT</span>'],
  ['title="Export Ogg Vorbis (.ogg)">OGG</button>', 'title="Eksportuj Ogg Vorbis (.ogg)">OGG</button>'],
  ['title="Export 8-bit or 16-bit PCM WAV (.wav)">WAV</button>', 'title="Eksportuj 8- lub 16-bitowy PCM WAV (.wav)">WAV</button>'],
  ['title="Export MP3 (.mp3)">MP3</button>', 'title="Eksportuj MP3 (.mp3)">MP3</button>'],
  ['title="Scratch 3.0 imports only WAV and MP3 (max 10 MB per sound): export WAV only">FOR SCRATCH</button>', 'title="Scratch 3.0 importuje tylko WAV i MP3 (maks. 10 MB na dźwięk): eksportuj tylko WAV">DLA SCRATCH</button>'],
  ['title="Keep original filenames without _crunched_8bit_22050hz suffix (preserves Unity .meta and Godot .import references)">KEEP NAMES</button>', 'title="Zachowaj oryginalne nazwy plików bez dopisku _crunched_8bit_22050hz (chroni .meta w Unity i .import w Godot)">WŁASNE NAZWY</button>'],
  ['aria-label="Preview selected audio">', 'aria-label="Odsłuchaj wybrany dźwięk">'],
  ['<span id="btn-preview-label">PREVIEW</span>', '<span id="btn-preview-label">ODSŁUCHAJ</span>'],
  ['aria-label="Crunch all">', 'aria-label="Przetwórz wszystkie">'],
  ['<span id="btn-process-label">CRUNCH</span>', '<span id="btn-process-label">PRZETWÓRZ</span>'],
  ['<p class="codec-info export-hint">Making a Scratch game? Press <strong>FOR SCRATCH</strong> to get one WAV file per sound.</p>', '<p class="codec-info export-hint">Tworzysz grę w Scratch? Kliknij <strong>DLA SCRATCH</strong>, aby zapisać jeden plik WAV na dźwięk.</p>'],
  ['<p id="codec-info" class="codec-info">Codecs: WAV 16-bit PCM · OGG q0 (~64 kbps) · MP3 128 kbps</p>', '<p id="codec-info" class="codec-info">Formaty: OGG q0 (~64 kbps) · WAV 16-bit PCM · MP3 128 kbps</p>'],
  ['<p id="effective-settings" class="effective-settings">Effective settings appear after a file is loaded.</p>', '<p id="effective-settings" class="effective-settings">Aktywne ustawienia pojawią się po wczytaniu pliku.</p>'],
  ['class="btn btn--ghost btn--xs cancel-button" hidden>STOP PROCESSING</button>', 'class="btn btn--ghost btn--xs cancel-button" hidden>ZATRZYMAJ</button>'],
  ['aria-label="Toggle comparison">', 'aria-label="Przełącz porównanie z oryginałem">'],
  ['<span class="ab-label">COMPARING:</span>', '<span class="ab-label">PORÓWNANIE:</span>'],
  ['<span id="ab-status" class="ab-value">CRUNCHED (WET)</span>', '<span id="ab-status" class="ab-value">PRZETWORZONY</span>'],
  ['title="Automatically re-render preview when you change controls" aria-label="Toggle live parameter updates">', 'title="Automatycznie odświeżaj odsłuch przy zmianie suwaków" aria-label="Przełącz podgląd na żywo">'],
  ['<span class="live-label">LIVE UPDATE: <span id="live-status">ON</span></span>', '<span class="live-label">NA ŻYWO: <span id="live-status">WŁ.</span></span>'],
  ['title="Loop preview continuously or play once as a one-shot SFX" aria-pressed="true" aria-label="Toggle preview loop">', 'title="Odtwarzaj w pętli lub pojedynczo jako krótki efekt" aria-pressed="true" aria-label="Przełącz pętlę odsłuchu">'],
  ['<span class="live-label">LOOP: <span id="loop-status">ON</span></span>', '<span class="live-label">PĘTLA: <span id="loop-status">WŁ.</span></span>'],
  ['title="Preview Volume">🔊</span>', 'title="Głośność odsłuchu">🔊</span>'],
  ['aria-label="Preview volume"', 'aria-label="Głośność odsłuchu"'],
  ['<span id="progress-text">Processing…</span>', '<span id="progress-text">Przetwarzanie…</span>'],

  // Log + results
  ['aria-label="Resize output panel"', 'aria-label="Zmień szerokość panelu wyników"'],
  ['aria-label="Processing log">', 'aria-label="Dziennik przetwarzania">'],
  ['<div class="panel-label" aria-hidden="true">[ LOG ]</div>', '<div class="panel-label" aria-hidden="true">[ DZIENNIK ]</div>'],
  ['aria-label="Processing log output"', 'aria-label="Wpisy dziennika"'],
  ['<p class="log-line log-line--sys">OGCruncher initialized</p>', '<p class="log-line log-line--sys">OGCruncher uruchomiony</p>'],
  ['<p class="log-line log-line--sys">engine: OfflineAudioContext · Float32Array DSP</p>', '<p class="log-line log-line--sys">silnik: OfflineAudioContext · Float32Array DSP</p>'],
  ['<span id="norm-ceiling-label" class="toggle-label-text">-1 dBFS PEAK</span>', '<span id="norm-ceiling-label" class="toggle-label-text">-1 dBFS SZCZYT</span>'],
  ['<p class="log-line log-line--sys">status: awaiting input ▌</p>', '<p class="log-line log-line--sys">status: czekam na pliki ▌</p>'],
  ['<span id="results-batch-summary" class="results-batch-summary">0 files ready</span>', '<span id="results-batch-summary" class="results-batch-summary">0 plików gotowych</span>'],
  ['class="btn btn--ghost btn--xs">CLEAR RESULTS</button>', 'class="btn btn--ghost btn--xs">WYCZYŚĆ WYNIKI</button>'],
  ['class="btn btn--primary btn--xs btn-download-zip" hidden>DOWNLOAD ALL (.ZIP)</button>', 'class="btn btn--primary btn--xs btn-download-zip" hidden>POBIERZ WSZYSTKO (.ZIP)</button>'],
  ['aria-label="Download results"', 'aria-label="Gotowe pliki do pobrania"'],

  // Guide
  ['<span class="tool-intro__kicker">DOCUMENTATION &amp; GAME AUDIO GUIDE</span>', '<span class="tool-intro__kicker">DOKUMENTACJA I PORADNIK AUDIO DO GIER</span>'],
  ['<h2 id="seo-guide-title" class="seo-guide__title">Free Online Audio Bit-Crusher, Sample Rate Reducer &amp; Game SFX Optimizer</h2>', '<h2 id="seo-guide-title" class="seo-guide__title">Darmowy bitcrusher online, reduktor próbkowania i optymalizator SFX do gier</h2>'],
  [/<p class="seo-guide__lead">[\s\S]*?<\/p>/, `<p class="seo-guide__lead">
        <strong>OGCruncher</strong> to przeglądarkowe narzędzie audio od <a data-goatcounter-click="ogcruncher-hub" href="https://sivochka.com/?ref=OGCruncher" target="_blank" rel="noopener noreferrer">Ihora Sivochki (Figarist)</a>. Upuść pliki <code>WAV</code>, <code>MP3</code>, <code>FLAC</code>, <code>OGG</code> lub <code>AIFF</code> do kolejki, zmniejsz głębię bitową i częstotliwość próbkowania, dodaj filtry czy nasycenie, porównaj na żywo oryginał z efektem i zapisz gotowe dźwięki do gry. Wszystko działa lokalnie w przeglądarce przez <code>OfflineAudioContext</code> i Web Workers — pliki nigdzie nie są wysyłane.
      </p>`],
  [/<article class="seo-card">\s*<h3>1–16 Bit Quantization[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Dźwięk do Scratch w 3 krokach</h3>
        <p>
          1) Upuść dźwięk lub kliknij „WYPRÓBUJ PRZYKŁAD”. 2) Wybierz gotowy preset, np. <strong>NES 8-BIT</strong>, i kliknij „ODSŁUCHAJ”. 3) Kliknij <strong>„DLA SCRATCH”</strong>, potem „PRZETWÓRZ” i pobierz WAV. W Scratch otwórz zakładkę „Dźwięki” → „Wczytaj dźwięk”. Scratch nie obsługuje <code>.ogg</code>, a plik może mieć maksymalnie 10 MB.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Simultaneous Batch Export[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Głębia 1–16 bit, próbkowanie, dither i nasycenie</h3>
        <p>
          Uzyskaj prawdziwe brzmienie 4-, 8- lub 12-bitowe oraz próbkowanie od 4 000 do 48 000 Hz za pomocą przycisków standardowych wartości. <strong>Tryb Crush</strong> usuwa składową DC, stosuje miękki ekspander <code>|x|^1.15</code> i wygładza aliasing. <strong>Dither TPDF</strong> łagodzi ziarnistość, <strong>nasycenie</strong> (<code>tanh</code>) dodaje gęstości, a <strong>szum</strong> imituje starą taśmę.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Retro Console Presets[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Wsadowy eksport do WAV, OGG i MP3 dla Unity i Godot</h3>
        <p>
          Dodaj do kolejki dziesiątki efektów i przetwórz je z identycznymi parametrami. Wybierz formaty: 8- lub 16-bitowy <strong>PCM WAV</strong> do natychmiastowego odtwarzania, <strong>Ogg Vorbis</strong> dla lekkich pętli oraz <strong>MP3</strong> (128 kbps, przy 8–12 kHz — 64 kbps). Przycisk „WŁASNE NAZWY” zachowuje nazwy plików dla <code>.meta</code> w Unity i <code>.import</code> w Godot, a przycinanie ciszy usuwa puste pauzy.
        </p>
      </article>`],
  ['<h3 id="seo-matrix-title" class="seo-table__title">Recommended Settings for Game Engines &amp; Retro Targets</h3>', '<h3 id="seo-matrix-title" class="seo-table__title">Zalecane ustawienia dla silników gier i projektów retro</h3>'],
  ['<th scope="col">Target / Use Case</th>', '<th scope="col">Zastosowanie</th>'],
  ['<th scope="col">Bit Depth &amp; Rate</th>', '<th scope="col">Bity i próbkowanie</th>'],
  ['<th scope="col">Channels &amp; DSP</th>', '<th scope="col">Kanały i efekty</th>'],
  ['<th scope="col">Recommended Format</th>', '<th scope="col">Zalecany format</th>'],
  ['<td><strong>Unity / Godot Low-Latency Combat &amp; UI SFX</strong></td>', '<td><strong>Unity / Godot: ciosy, strzały i kliknięcia UI</strong></td>'],
  ['<td>8–12 bit · 22,050 Hz</td>', '<td>8–12 bit · 22 050 Hz</td>'],
  ['<td>Mono · Normalize ON · HPF 80 Hz</td>', '<td>Mono · Normalizacja WŁ. · HPF 80 Hz</td>'],
  ['<td>PCM WAV (zero decode latency; note: Unity re-encodes imported WAVs per AudioClip Import Settings)</td>', '<td>PCM WAV (natychmiastowe odtwarzanie; Unity i tak przekodowuje WAV według ustawień AudioClip)</td>'],
  ['<td><strong>Wear OS, Mobile &amp; WebGL Loops</strong></td>', '<td><strong>Wear OS, telefony i WebGL: pętle oraz muzyka</strong></td>'],
  ['<td>12–16 bit · 22,050–32,000 Hz</td>', '<td>12–16 bit · 22 050–32 000 Hz</td>'],
  ['<td>Mono or Stereo · Dither ON · Grit 1.2</td>', '<td>Mono lub Stereo · Dither WŁ. · Nasycenie 1,2</td>'],
  ['<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS support for OGG is limited and version-dependent, so ship an MP3 fallback for WebGL</td>', '<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS ma ograniczone wsparcie OGG, więc dla WebGL dodaj zapasowy MP3</td>'],
  ['<td><strong>Scratch 3.0 (Kids &amp; Classroom Games)</strong></td>', '<td><strong>Scratch 3.0 (gry szkolne i dla dzieci)</strong></td>'],
  ['<td>8–16 bit · 22,050 Hz</td>', '<td>8–16 bit · 22 050 Hz</td>'],
  ['<td>Mono · Normalize ON</td>', '<td>Mono · Normalizacja WŁ.</td>'],
  ['<td>PCM WAV (short SFX) or MP3 (music), max 10 MB per file — Scratch 3.0 does not import <code>.ogg</code></td>', '<td>Przycisk „DLA SCRATCH” → WAV (do muzyki MP3), maks. 10 MB na plik — Scratch nie wczytuje <code>.ogg</code></td>'],
  ['<td><strong>NES / 8-Bit Chiptune Crunch</strong></td>', '<td><strong>NES / 8-bitowy chiptune</strong></td>'],
  ['<td>4 bit · 12,000 Hz</td>', '<td>4 bit · 12 000 Hz</td>'],
  ['<td>Mono · Crush ON · Dither OFF · LPF 6 kHz</td>', '<td>Mono · Crush WŁ. · Dither WYŁ. · LPF 6 kHz</td>'],
  ['<td>8-Bit PCM WAV or OGG</td>', '<td>8-bitowy PCM WAV lub OGG</td>'],
  ['<td><strong>Amiga 500 / 90s Tracker Sampler</strong></td>', '<td><strong>Amiga 500 / sampler z lat 90.</strong></td>'],
  ['<td>8 bit · 28,000 Hz</td>', '<td>8 bit · 28 000 Hz</td>'],
  ['<td>Stereo · Grit 1.5 · Noise -46 dB · LPF 10 kHz</td>', '<td>Stereo · Nasycenie 1,5 · Szum -46 dB · LPF 10 kHz</td>'],
  ['<td>8-Bit PCM WAV / MP3 preview</td>', '<td>8-bitowy PCM WAV / MP3</td>'],
  [/<h2 id="faq-heading" class="seo-guide__subtitle">Frequently Asked Questions \(FAQ\)<\/h2>[\s\S]*?(?=\n    <\/section>)/,
    `<h2 id="faq-heading" class="seo-guide__subtitle">Często zadawane pytania (FAQ)</h2>\n${faqHtml}`],
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
      <h3 id="seo-locale-title">OGCruncher w innych językach</h3>
      <p>Pełne wersje narzędzia po angielsku, ukraińsku, rosyjsku i koreańsku.</p>
      <ul class="seo-locale-links">
        <li><a href="../" hreflang="en" lang="en">English version →</a></li>
        <li><a href="../uk/" hreflang="uk" lang="uk">Українська версія →</a></li>
        <li><a href="../ru/" hreflang="ru" lang="ru">Русская версия →</a></li>
        <li><a href="../ko/" hreflang="ko" lang="ko">한국어 버전 →</a></li>
      </ul>
    </aside>`],

  // Footer, notices, modal
  ['<span class="footer-note">Made by Ihor Sivochka for game developers and curious people.</span>', '<span class="footer-note">Stworzył Ihor Sivochka dla twórców gier i ciekawskich.</span>'],
  ['<a href="#guide" class="footer-link">Guide</a>', '<a href="#guide" class="footer-link">Poradnik</a>'],
  ['<a href="#faq" class="footer-link">FAQ</a>', '<a href="#faq" class="footer-link">FAQ</a>'],
  ['<a href="https://sivochka.com/privacy/" class="footer-link" target="_blank" rel="noopener noreferrer">Privacy policy</a>', '<a href="https://sivochka.com/pl/privacy/" class="footer-link" target="_blank" rel="noopener noreferrer">Polityka prywatności</a>'],
  ['<strong>UPDATE READY</strong>', '<strong>DOSTĘPNA AKTUALIZACJA</strong>'],
  ['<span id="sw-update-message">A new version is waiting.</span>', '<span id="sw-update-message">Nowa wersja jest gotowa.</span>'],
  ['class="btn btn--primary btn--xs">ACTIVATE &amp; RELOAD</button>', 'class="btn btn--primary btn--xs">AKTUALIZUJ I PRZEŁADUJ</button>'],
  ['<h2 id="modal-info-title" class="modal-title">ABOUT OGCRUNCHER</h2>', '<h2 id="modal-info-title" class="modal-title">O OGCRUNCHER</h2>'],
  ['<p>OGCruncher is a small browser audio tool by Ihor Sivochka. Shape high-quality audio into gritty, lo-fi samples for games, Wear OS assets and retro projects. Files are processed locally in your browser.</p>', '<p>OGCruncher to lekkie przeglądarkowe narzędzie audio autorstwa Ihora Sivochki. Przekształca czysty dźwięk w chrupiące efekty lo-fi dla gier, Scratch, Wear OS i projektów retro. Pliki są przetwarzane lokalnie w przeglądarce.</p>'],
  ['<button id="btn-info-ok" class="btn btn--primary" style="width:100%">UNDERSTOOD</button>', '<button id="btn-info-ok" class="btn btn--primary" style="width:100%">ROZUMIEM</button>'],
];

module.exports = { meta, jsonLd, pairs };
