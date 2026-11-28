/**
 * Korean page source: exact English → Korean replacements applied to
 * index.html by scripts/build-locales.cjs. Every English string must exist in
 * index.html; the generator fails loudly when the English page drifts.
 */

const BASE = 'https://sivochka.com/OGCruncher/ko/';

const meta = {
  lang: 'ko',
  ogLocale: 'ko_KR',
  canonical: BASE,
  title: 'OGCruncher — 무료 온라인 비트크러셔 & 오디오 압축기',
  description: '무료 온라인 비트크러셔 및 오디오 압축기: 1~16비트 양자화와 샘플레이트 감소를 브라우저에서 로컬로 처리하고 Unity, Godot, Scratch용 OGG, WAV, MP3 파일로 일괄 내보내기하세요. 파일 업로드 없이 즉시 작동합니다.',
  imageAlt: 'OGCruncher — 무료 온라인 오디오 비트크러셔, 샘플레이트 감소기 및 OGG/WAV/MP3 일괄 변환기',
  keywords: 'OGCruncher, 비트크러셔 온라인, 무료 비트크러셔, 8비트 오디오 변환, 샘플레이트 감소, OGG 압축, Unity 오디오 최적화, Scratch 소리 변환, 8비트 WAV 변환기, 게임 효과음 제작, 레트로 사운드, Wear OS 오디오',
};

const faq = [
  {
    q: 'OGCruncher란 무엇이며 일반 오디오 변환기와 어떻게 다른가요?',
    a: 'OGCruncher는 인디 게임 개발자, Wear OS 제작자, 레트로 프로젝트 크리에이터를 위해 만든 무료 브라우저 기반 오디오 비트크러셔 겸 일괄 변환기입니다. 단순 재인코딩이 아니라 OfflineAudioContext 필터링 및 속도 조절, 소프트 익스팬더, 1~16비트 양자화, TPDF 디더링, tanh 새추레이션 파이프라인을 거쳐 OGG, WAV, MP3로 내보냅니다.',
  },
  {
    q: '내 오디오 파일이 외부 서버로 업로드되나요?',
    a: '아니요. 디코딩, DSP 처리, OGG/WAV/MP3 인코딩까지 모든 작업이 사용자 브라우저와 전용 Web Worker 내부에서만 실행됩니다. 네트워크 요청은 앱 자체 정적 파일과 선택적 데모 트랙 로드 시에만 발생합니다.',
  },
  {
    q: 'Scratch 3.0에는 어떤 포맷으로 내보내야 하나요?',
    a: '「SCRATCH용」 버튼을 누르면 사운드당 하나의 WAV 파일만 내보냅니다. Scratch 3.0은 WAV와 MP3만 지원하며 OGG 파일은 불러올 수 없습니다. 또한 파일당 10 MB 이하를 유지해야 하며, 긴 배경음악은 MP3나 낮은 샘플레이트를 권장합니다.',
  },
  {
    q: '8비트 WAV와 16비트 WAV는 어떻게 자동 선택되나요?',
    a: 'WAV 비트 심도는 비트 심도 슬라이더를 따릅니다. 1~8비트 설정에서는 8비트 PCM WAV로, 9~16비트 설정에서는 16비트 PCM WAV로 저장되어 레트로 효과음은 가볍게, 고해상도 사운드는 정밀하게 유지합니다.',
  },
  {
    q: 'Unity, Godot, WebGL, Wear OS에는 어떤 설정이 좋나요?',
    a: 'UI 클릭·발소리·타격감 있는 효과음은 디코딩 지연이 없는 모노 8비트 또는 16비트 PCM WAV(16,000~22,050 Hz)가 적합합니다. 배경 루프나 APK·WebGL 용량이 중요한 경우에는 22,050~32,000 Hz의 Ogg Vorbis를 사용하세요. 단, Safari/iOS는 OGG 지원이 제한적이므로 WebGL 빌드에는 MP3를 함께 준비하는 것이 좋습니다.',
  },
  {
    q: '4,000 Hz 같은 초저주파수로 설정해도 MP3는 왜 8,000 Hz로 저장되나요?',
    a: 'MPEG MP3 표준은 8k, 11.025k, 12k, 16k, 22.05k, 24k, 32k, 44.1k, 48k의 9가지 샘플레이트만 허용합니다. WAV와 OGG는 4,000 Hz나 28,000 Hz를 그대로 저장하지만, MP3 인코더는 창 함수 Lanczos-3 리샘플링을 통해 가장 가까운 허용 샘플레이트로 변환합니다. 8~12 kHz에서는 64 kbps, 16 kHz 이상에서는 128 kbps로 인코딩됩니다.',
  },
  {
    q: '일괄 처리, ZIP 다운로드, 설정 공유 링크는 어떻게 작동하나요?',
    a: '여러 오디오 파일을 대기열에 올리고 설정을 맞춘 뒤 「크런치」를 누르면 모든 파일에 동일한 DSP 체인이 적용됩니다. 완료 후 개별 파일로 받거나 「모두 다운로드 (.ZIP)」로 한 번에 받고, 「링크 복사」로 현재 파라미터가 담긴 URL을 공유할 수 있습니다.',
  },
  {
    q: 'Unity나 Godot용 8비트 효과음을 10초 만에 만드는 방법은?',
    a: '깔끔한 점프·타격음(WAV/MP3)을 올리고 비트 심도 4~8비트, 샘플레이트 11,025~16,000 Hz(모노), 크러시 모드 켜기를 선택한 다음 OGG 또는 8비트 WAV로 내보내면 됩니다.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE}#app`,
      name: 'OGCruncher',
      alternateName: ['OG Cruncher', 'OGCruncher 비트크러셔', 'Figarist OGCruncher'],
      url: BASE,
      inLanguage: 'ko',
      description: 'OfflineAudioContext 및 Web Workers 기반의 무료 브라우저 오디오 비트크러셔, 샘플레이트 감소기, OGG/WAV/MP3 일괄 변환기.',
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: '게임 오디오 DSP & 비트크러셔',
      operatingSystem: '모든 브라우저 (Windows, macOS, Linux, Android, iOS)',
      browserRequirements: 'Web Audio API (OfflineAudioContext) 및 Web Workers 지원 필요',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        '1~16비트 오디오 양자화 및 크러시 모드 (DC 제거, 소프트 익스팬더, 안티앨리어싱 필터)',
        '4,000 Hz ~ 48,000 Hz 샘플레이트 감소 및 표준 프리셋 버튼',
        'tanh 새추레이션 드라이브(그릿), 테이프 노이즈 플로어 및 TPDF 디더링',
        'HPF·LPF 필터, 80 Hz 베이스 부스트, 속도/피치 조절 및 -1 / 0 dBFS 피크 노멀라이즈',
        '파일 업로드 없이 100% 브라우저 내 로컬 처리',
        'Web Worker 기반 OGG, 8/16비트 PCM WAV, MP3 선택 일괄 내보내기, 원본 파일명 유지 및 ZIP 압축',
        '앞뒤 무음 자동 자르기 및 클릭 노이즈 없는 마이크로 페이드',
        '「SCRATCH용」 원클릭 프리셋: Scratch 3.0용 단일 WAV 출력',
      ],
      image: 'https://sivochka.com/OGCruncher/images/social-card.png',
      author: {
        '@type': 'Person',
        '@id': 'https://sivochka.com#person',
        name: 'Ihor Sivochka',
        alternateName: ['Ihor Sivochka', 'Sivochka Ihor', 'Ігор Сівочка', 'Figarist'],
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
        { '@type': 'ListItem', position: 3, name: '한국어', item: BASE },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}#faq`,
      inLanguage: 'ko',
      mainEntity: faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    },
  ],
};

const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const faqHtml = faq.map((item, index) => `      <details class="faq-item"${index === 0 ? ' open' : ''}>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`).join('\n');

/** [english, korean] pairs; each English string must appear in index.html. */
const pairs = [
  // Paths: ko/index.html lives one folder deeper.
  ['<link rel="stylesheet" href="style.css" />', '<link rel="stylesheet" href="../style.css" />'],
  ['<script type="module" src="js/main.js"></script>', '<script type="module" src="../js/main.js"></script>'],

  // Header
  ['aria-label="Back to Figarist"', 'aria-label="Figarist 사이트로 이동"'],
  ['<span class="logo-title__kw"> Free Online Audio Bit-Crusher &amp; Compressor</span>', '<span class="logo-title__kw"> 무료 온라인 오디오 비트크러셔 &amp; 압축기</span>'],
  ['aria-label="OGCruncher navigation"', 'aria-label="OGCruncher 탐색"'],
  ['title="Install OGCruncher as a standalone app" hidden>⬇ INSTALL APP</button>', 'title="OGCruncher를 독립 앱으로 설치" hidden>⬇ 앱 설치</button>'],
  ['aria-label="Language">', 'aria-label="언어">'],
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
    `<span id="lang-current">KO</span>
            <span class="lang-caret" aria-hidden="true">▾</span>
          </button>
          <div id="lang-menu" class="lang-menu" role="menu" hidden>
            <a class="lang-btn" href="../" hreflang="en" lang="en" role="menuitem">EN · English</a>
            <a class="lang-btn" href="../uk/" hreflang="uk" lang="uk" role="menuitem">UK · Українська</a>
            <a class="lang-btn" href="../pl/" hreflang="pl" lang="pl" role="menuitem">PL · Polski</a>
            <a class="lang-btn" href="../ru/" hreflang="ru" lang="ru" role="menuitem">RU · Русский</a>
            <a class="lang-btn is-active" href="./" hreflang="ko" lang="ko" role="menuitem" aria-current="page">KO · 한국어</a>
          </div>`],
  ['title="About OGCruncher">ABOUT</button>', 'title="OGCruncher 정보">정보</button>'],

  // Intro
  ['aria-label="OGCruncher status"', 'aria-label="OGCruncher 상태"'],
  ['<span class="tool-intro__kicker">A SMALL TOOL FOR BIG SOUNDS</span>', '<span class="tool-intro__kicker">강력한 사운드를 위한 작은 도구</span>'],
  ['<p>Shape, preview and export game audio without leaving your browser.</p>', '<p>브라우저를 벗어나지 않고 게임 오디오를 다듬고, 미리 듣고, 바로 내보내세요.</p>'],
  ['</span> Files stay in this browser</span>', '</span> 파일은 브라우저 밖으로 전송되지 않습니다</span>'],

  // Input panel
  ['aria-label="Audio processing workspace"', 'aria-label="오디오 처리 작업 공간"'],
  ['aria-label="File input panel"', 'aria-label="파일 입력 패널"'],
  ['<div class="panel-label" aria-hidden="true">[ INPUT ]</div>', '<div class="panel-label" aria-hidden="true">[ 입력 ]</div>'],
  ['title="Show both spectra simultaneously">DUAL VIEW: OFF</button>', 'title="두 스펙트럼을 동시에 보기">이중 파형: 꺼짐</button>'],
  ['aria-label="Drag and drop audio files here"', 'aria-label="여기에 오디오 파일을 끌어다 놓으세요"'],
  ['<p class="drop-title">DROP AUDIO FILES HERE</p>', '<p class="drop-title">오디오 파일을 여기에 놓으세요</p>'],
  ['<p class="drop-sub">or <label for="file-input" class="file-label-btn">BROWSE FILES</label></p>', '<p class="drop-sub">또는 <label for="file-input" class="file-label-btn">파일 찾기</label></p>'],
  ['title="Test OGCruncher with a pre-loaded track"', 'title="미리 준비된 데모 트랙으로 OGCruncher 테스트"'],
  ['<span id="btn-load-demo-label">TRY DEMO TRACK 🎵</span>', '<span id="btn-load-demo-label">데모 트랙 듣기 🎵</span>'],
  ['<span class="metrics-label">RMS</span>', '<span class="metrics-label" title="평균 음량 (RMS)">RMS</span>'],
  ['<span class="metrics-label">PEAK</span>', '<span class="metrics-label" title="최대 피크 (PEAK)">PEAK</span>'],
  ['<span class="metrics-label">DUR</span>', '<span class="metrics-label" title="재생 시간">길이</span>'],
  ['DRY —</span>', '원본 —</span>'],
  ['WET —</span>', '변환 —</span>'],
  ['aria-label="Choose audio files"', 'aria-label="오디오 파일 선택"'],
  ['<span class="panel-label" style="margin:0">[ QUEUE ]</span>', '<span class="panel-label" style="margin:0">[ 대기열 ]</span>'],
  ['aria-label="Clear queue">CLEAR</button>', 'aria-label="대기열 비우기">비우기</button>'],
  ['aria-label="Processing queue"', 'aria-label="처리 대기열"'],
  ['<span class="savings-title-text">⚡ SIZE OUTLOOK · METADATA-BACKED ESTIMATES</span>', '<span class="savings-title-text">⚡ 예상 용량 · 메타데이터 기반 추정</span>'],
  ['class="badge badge--amber">ANALYZING…</span>', 'class="badge badge--amber">분석 중…</span>'],
  ['<span class="savings-label">ORIGINAL</span>', '<span class="savings-label">원본</span>'],
  ['<span class="savings-label">EST. WAV</span>', '<span class="savings-label">예상 WAV</span>'],
  ['<span class="savings-label">EST. OGG RANGE</span>', '<span class="savings-label">예상 OGG</span>'],
  ['<span class="savings-label">EST. MP3</span>', '<span class="savings-label">예상 MP3</span>'],
  ['aria-label="Resize input panel"', 'aria-label="입력 패널 너비 조절"'],

  // Controls
  ['aria-label="Processing controls"', 'aria-label="처리 설정"'],
  ['<div class="panel-label" aria-hidden="true">[ PARAMETERS ]</div>', '<div class="panel-label" aria-hidden="true">[ 파라미터 ]</div>'],
  ['aria-label="Processing mode"', 'aria-label="처리 모드"'],
  ['aria-label="Switch to Simple mode">SIMPLE</button>', 'aria-label="간편 모드로 전환">간편</button>'],
  ['aria-label="Switch to Advanced mode">ADVANCED</button>', 'aria-label="고급 모드로 전환">고급</button>'],
  ['<span class="control-label">PRESETS</span>', '<span class="control-label">프리셋</span>'],
  ['title="Copy current settings as a shareable link">COPY LINK</button>', 'title="현재 설정을 공유 링크로 복사">링크 복사</button>'],
  ['title="Save current settings as your custom preset">SAVE CURRENT</button>', 'title="현재 설정을 내 프리셋으로 저장">현재 설정 저장</button>'],
  ['aria-label="Apply Author\'s LO-Q preset (8-bit, 22050Hz)"', 'aria-label="제작자 LO-Q 프리셋 적용 (8비트, 22050Hz)"'],
  ['<span class="preset-card__meta">8-bit / 22k Hz</span>', '<span class="preset-card__meta">8비트 / 22k Hz</span>'],
  ['aria-label="Apply retro gaming NES preset (4-bit, 12000Hz)"', 'aria-label="레트로 게임 NES 프리셋 적용 (4비트, 12000Hz)"'],
  ['<span class="preset-card__meta">4-bit / 12k Hz</span>', '<span class="preset-card__meta">4비트 / 12k Hz</span>'],
  ['aria-label="Apply vintage sampler Amiga 500 preset (8-bit, 28000Hz)"', 'aria-label="빈티지 샘플러 Amiga 500 프리셋 적용 (8비트, 28000Hz)"'],
  ['<span class="preset-card__meta">8-bit / 28k Hz</span>', '<span class="preset-card__meta">8비트 / 28k Hz</span>'],
  ['aria-label="Apply your custom preset" disabled>', 'aria-label="사용자 프리셋 적용" disabled>'],
  ['<span class="preset-card__title">MY PRESET</span>', '<span class="preset-card__title">내 프리셋</span>'],
  ['<span id="preset-user-meta" class="preset-card__meta">NOT SAVED</span>', '<span id="preset-user-meta" class="preset-card__meta">저장 안 됨</span>'],
  ['<span class="control-label">SIZE & QUALITY</span>', '<span class="control-label">용량 및 음질</span>'],
  ['<span id="out-simple-quality" class="control-value">HIGH</span>', '<span id="out-simple-quality" class="control-value">고품질</span>'],
  ['aria-label="Adjust size and quality"', 'aria-label="용량 및 음질 조절"'],
  ['data-val="0">TINY</span>', 'data-val="0">초소형</span>'],
  ['data-val="1">LOW</span>', 'data-val="1">저용량</span>'],
  ['data-val="2">MEDIUM</span>', 'data-val="2">중간</span>'],
  ['data-val="3">HIGH</span>', 'data-val="3">고품질</span>'],
  ['<p class="simple-desc" id="simple-quality-desc">High Quality (32kHz / 16-bit) — clear and optimized.</p>', '<p class="simple-desc" id="simple-quality-desc">고품질 (32kHz / 16비트) — 음질 손실이 가장 적은 간편 설정.</p>'],
  ['data-tooltip="Audio resolution (bits). Lower bits = more \'pixelated\' noise and lo-fi artifacts.">BIT DEPTH</label>', 'data-tooltip="오디오 해상도(비트). 낮출수록 레트로 게임처럼 거칠고 픽셀화된 질감이 강해집니다.">비트 심도</label>'],
  ['aria-label="Bit depth"', 'aria-label="비트 심도"'],
  ['data-tooltip="Sampling frequency. Lower values make audio muffled and add metallic aliasing.">RATE</label>', 'data-tooltip="샘플레이트 주파수. 낮출수록 고음이 줄어들고 금속성 앨리어싱이 생깁니다.">샘플레이트</label>'],
  ['22050 <span class="unit">Hz</span></output>', '22050 <span class="unit">Hz</span></output>'],
  ['aria-label="Sample rate in Hz"', 'aria-label="샘플레이트 (Hz)"'],
  ['data-tooltip="Saturation drive (tanh). 1.0 is clean bypass (OFF); higher values add harmonic density.">GRIT</label>', 'data-tooltip="새추레이션 드라이브 (tanh). 1.0은 바이패스(꺼짐)이며 높일수록 배음 밀도가 증가합니다.">그릿 (드라이브)</label>'],
  ['<output id="out-grit" for="slider-grit" class="control-value">OFF</output>', '<output id="out-grit" for="slider-grit" class="control-value">꺼짐</output>'],
  ['aria-label="Saturation drive amount"', 'aria-label="새추레이션 드라이브 강도"'],
  ['data-tooltip="Adds subtle floor hiss of vintage gear or tape (shown in dBFS).">NOISE</label>', 'data-tooltip="빈티지 장비나 카세트테이프 특유의 미세한 히스 노이즈를 추가합니다 (dBFS 단위).">노이즈</label>'],
  ['<output id="out-noise" for="slider-noise" class="control-value">OFF</output>', '<output id="out-noise" for="slider-noise" class="control-value">꺼짐</output>'],
  ['aria-label="Noise floor level"', 'aria-label="노이즈 플로어 레벨"'],
  ['data-tooltip="Creative bit-crush pipeline: DC removal, |x|^1.15 soft expander, quantization, and 2-tap anti-alias smoothing.">CRUSH MODE</label>', 'data-tooltip="크리에이티브 비트크러시 파이프라인: DC 제거, |x|^1.15 소프트 익스팬더, 양자화 및 2-탭 안티앨리어싱.">크러시 모드</label>'],
  ['<span id="out-mariomode" class="control-value" aria-live="polite">ON</span>', '<span id="out-mariomode" class="control-value" aria-live="polite">켜짐</span>'],
  ['title="DC removal, soft expander (|x|^1.15), quantization, and 2-tap anti-alias smoothing"', 'title="DC 제거, 소프트 익스팬더 (|x|^1.15), 양자화 및 2-탭 안티앨리어싱"'],
  ['aria-label="Enable expander, dither and anti-alias pipeline"', 'aria-label="크러시 모드 파이프라인 켜기"'],
  ['<span class="toggle-label-text">EXPANDER</span>', '<span class="toggle-label-text">익스팬더</span>'],
  ['data-tooltip="Adds triangular TPDF dither to soften quantization distortion. Turn OFF for raw retro grit.">DITHER</label>', 'data-tooltip="양자화 왜곡을 부드럽게 하는 삼각파 TPDF 디더링을 추가합니다. 거친 레트로 질감을 원하면 끄세요.">디더링</label>'],
  ['<span id="out-dither" class="control-value" aria-live="polite">ON</span>', '<span id="out-dither" class="control-value" aria-live="polite">켜짐</span>'],
  ['aria-label="Toggle triangular TPDF dither noise"', 'aria-label="삼각파 TPDF 디더링 켜기/끄기"'],
  ['data-tooltip="Normalizes output peak to -1 dBFS (safe headroom for OGG/MP3) or 0 dBFS full scale.">NORMALIZE</label>', 'data-tooltip="출력 피크를 -1 dBFS (OGG/MP3 안전 헤드룸) 또는 0 dBFS 풀 스케일로 정규화합니다.">노멀라이즈</label>'],
  ['title="Toggle normalization ceiling between -1 dBFS (safe headroom for lossy codecs) and 0 dBFS">-1 dB</button>', 'title="정규화 상한을 -1 dBFS(손실 코덱용 여유 공간)와 0 dBFS 사이에서 전환">-1 dB</button>'],
  ['<span id="out-normalize" class="control-value">ON</span>', '<span id="out-normalize" class="control-value">켜짐</span>'],
  ['aria-label="Enable peak normalization"', 'aria-label="피크 노멀라이즈 켜기"'],
  ['data-tooltip="Converts stereo to mono. Perfect for game SFX to save memory and CPU.">OUTPUT</label>', 'data-tooltip="스테레오를 모노로 변환합니다. 게임 효과음의 메모리와 CPU 절약에 적합합니다.">채널 출력</label>'],
  ['<span id="out-stereo" class="control-value">MONO</span>', '<span id="out-stereo" class="control-value">모노</span>'],
  ['aria-label="Toggle between Mono and Stereo output"', 'aria-label="모노/스테레오 출력 전환"'],
  ['<span class="toggle-label-text">FORCE MONO</span>', '<span class="toggle-label-text">모노 강제</span>'],
  ['data-tooltip="Trims leading and trailing silence below -48 dBFS and applies a 4 ms click-free micro-fade.">TRIM SILENCE</label>', 'data-tooltip="앞뒤 -48 dBFS 이하의 무음을 자르고 클릭 노이즈 방지를 위한 4 ms 마이크로 페이드를 적용합니다.">무음 자르기</label>'],
  ['<span id="out-trim" class="control-value" aria-live="polite">OFF</span>', '<span id="out-trim" class="control-value" aria-live="polite">꺼짐</span>'],
  ['aria-label="Enable auto-trim silence with micro-fade"', 'aria-label="자동 무음 자르기 켜기"'],
  ['<span class="toggle-label-text">-48 dB + FADE</span>', '<span class="toggle-label-text">-48 dB + 페이드</span>'],
  ['data-tooltip="Adjust playback speed. Lowering it creates a \'slow & chopped\' effect with lower pitch.">SPEED / PITCH</label>', 'data-tooltip="재생 속도를 조절합니다. 낮추면 피치가 내려가며 느리고 묵직한 효과가 납니다.">속도 / 피치</label>'],
  ['aria-label="Playback speed and pitch"', 'aria-label="재생 속도 및 피치"'],
  ['data-tooltip="Fine-tune frequencies to shape your lo-fi sound.">FILTERS & EQ</span>', 'data-tooltip="주파수를 세밀하게 다듬어 원하는 로우파이 톤을 만듭니다.">필터 &amp; EQ</span>'],
  ['data-tooltip="Cuts low frequencies (rumble). Helps remove muddy bass and clear up the mix.">HPF (CUT LOWS)</label>', 'data-tooltip="저역대(웅웅거림)를 깎아 탁한 베이스를 정리하고 믹스를 선명하게 합니다.">HPF (저음 컷)</label>'],
  ['<output id="out-hpf" class="filter-value">20 Hz</output>', '<output id="out-hpf" class="filter-value">20 Hz</output>'],
  ['data-tooltip="Cuts high frequencies. Makes sound soft, \'underwater\' or phone-like.">LPF (CUT HIGHS)</label>', 'data-tooltip="고역대를 깎아 물속이나 전화기처럼 부드럽고 먹먹한 소리를 만듭니다.">LPF (고음 컷)</label>'],
  ['<output id="out-lpf" class="filter-value">OFF</output>', '<output id="out-lpf" class="filter-value">꺼짐</output>'],
  ['data-tooltip="Enhances low-end frequencies for a deeper and more powerful punch.">BASS BOOST (80Hz)</label>', 'data-tooltip="저음역을 강조해 더 깊고 묵직한 타격감을 더합니다.">베이스 부스트 (80Hz)</label>'],
  ['<summary>HOW SETTINGS WORK</summary>', '<summary>설정 작동 방식</summary>'],
  [`<p>Simple mode selects a complete quality tier. Advanced mode exposes every
        parameter. Preview uses the same offline render order as export; ORIGINAL
        means a dry signal at the selected output rate, channel mode and speed.</p>`,
    `<p>간편 모드는 전체 음질 등급을 한 번에 선택하며, 고급 모드는 모든 파라미터를 직접 제어합니다.
        미리듣기는 내보내기와 동일한 오프라인 렌더링 순서를 따르며, 원본(DRY)은 선택한 출력 샘플레이트·채널·속도가
        적용된 이펙트 없는 원음을 들려줍니다.</p>`],
  [`<p>Monitor volume changes listening level only. Normalize is linked peak
        normalization for export and is not perceptual loudness matching.</p>`,
    `<p>모니터 볼륨(🔊)은 미리듣기 음량만 조절합니다. 노멀라이즈는 내보내기 파일의
        피크를 맞추는 기능이며 청각적 음량(라우드니스) 균일화와는 다릅니다.</p>`],

  ['<span class="toggle-label-text">TPDF DITHER</span>', '<span class="toggle-label-text">TPDF 디더링</span>'],
  ['<span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>', '<span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>'],
  ['<output id="out-bass" class="filter-value">+0 dB</output>', '<output id="out-bass" class="filter-value">+0 dB</output>'],
  ['class="savings-val">0 KB</span>', 'class="savings-val">0 KB</span>'],

  // Export + actions
  ['aria-label="Export format and naming options"', 'aria-label="내보내기 포맷 및 파일명 옵션"'],
  ['<span class="export-options__label">EXPORT</span>', '<span class="export-options__label">내보내기</span>'],
  ['title="Export Ogg Vorbis (.ogg)">OGG</button>', 'title="Ogg Vorbis (.ogg)로 내보내기">OGG</button>'],
  ['title="Export 8-bit or 16-bit PCM WAV (.wav)">WAV</button>', 'title="8비트 또는 16비트 PCM WAV (.wav)로 내보내기">WAV</button>'],
  ['title="Export MP3 (.mp3)">MP3</button>', 'title="MP3 (.mp3)로 내보내기">MP3</button>'],
  ['title="Scratch 3.0 imports only WAV and MP3 (max 10 MB per sound): export WAV only">FOR SCRATCH</button>', 'title="Scratch 3.0은 WAV와 MP3만 지원합니다 (사운드당 최대 10 MB): WAV만 내보내기">SCRATCH용</button>'],
  ['title="Keep original filenames without _crunched_8bit_22050hz suffix (preserves Unity .meta and Godot .import references)">KEEP NAMES</button>', 'title="_crunched_8bit_22050hz 접미사 없이 원본 파일명 유지 (Unity .meta 및 Godot .import 참조 보호)">원본 이름 유지</button>'],
  ['aria-label="Preview selected audio">', 'aria-label="선택한 오디오 미리듣기">'],
  ['<span id="btn-preview-label">PREVIEW</span>', '<span id="btn-preview-label">미리듣기</span>'],
  ['aria-label="Crunch all">', 'aria-label="모두 처리">'],
  ['<span id="btn-process-label">CRUNCH</span>', '<span id="btn-process-label">크런치</span>'],
  ['<p class="codec-info export-hint">Making a Scratch game? Press <strong>FOR SCRATCH</strong> to get one WAV file per sound.</p>', '<p class="codec-info export-hint">Scratch 게임을 만들고 있나요? <strong>SCRATCH용</strong>을 누르면 사운드당 WAV 파일 하나만 저장됩니다.</p>'],
  ['<p id="codec-info" class="codec-info">Codecs: WAV 16-bit PCM · OGG q0 (~64 kbps) · MP3 128 kbps</p>', '<p id="codec-info" class="codec-info">포맷: WAV 16비트 PCM · OGG q0 (~64 kbps) · MP3 128 kbps</p>'],
  ['<p id="effective-settings" class="effective-settings">Effective settings appear after a file is loaded.</p>', '<p id="effective-settings" class="effective-settings">파일을 불러오면 실제 적용 설정이 여기에 표시됩니다.</p>'],
  ['class="btn btn--ghost btn--xs cancel-button" hidden>STOP PROCESSING</button>', 'class="btn btn--ghost btn--xs cancel-button" hidden>처리 중지</button>'],
  ['aria-label="Toggle comparison">', 'aria-label="원본/변환 비교 전환">'],
  ['<span class="ab-label">COMPARING:</span>', '<span class="ab-label">비교 중:</span>'],
  ['<span id="ab-status" class="ab-value">CRUNCHED (WET)</span>', '<span id="ab-status" class="ab-value">변환됨 (WET)</span>'],
  ['title="Automatically re-render preview when you change controls" aria-label="Toggle live parameter updates">', 'title="컨트롤을 바꿀 때마다 미리듣기를 자동으로 다시 렌더링" aria-label="실시간 미리듣기 업데이트 전환">'],
  ['<span class="live-label">LIVE UPDATE: <span id="live-status">ON</span></span>', '<span class="live-label">실시간 반영: <span id="live-status">켜짐</span></span>'],
  ['title="Loop preview continuously or play once as a one-shot SFX" aria-pressed="true" aria-label="Toggle preview loop">', 'title="미리듣기를 계속 반복하거나 원샷 효과음처럼 한 번만 재생" aria-pressed="true" aria-label="미리듣기 반복 전환">'],
  ['<span class="live-label">LOOP: <span id="loop-status">ON</span></span>', '<span class="live-label">반복: <span id="loop-status">켜짐</span></span>'],
  ['title="Preview Volume">🔊</span>', 'title="미리듣기 음량">🔊</span>'],
  ['aria-label="Preview volume"', 'aria-label="미리듣기 음량"'],
  ['<span id="progress-text">Processing…</span>', '<span id="progress-text">처리 중…</span>'],

  // Log + results
  ['aria-label="Resize output panel"', 'aria-label="출력 패널 너비 조절"'],
  ['aria-label="Processing log">', 'aria-label="처리 로그">'],
  ['<div class="panel-label" aria-hidden="true">[ LOG ]</div>', '<div class="panel-label" aria-hidden="true">[ 로그 ]</div>'],
  ['aria-label="Processing log output"', 'aria-label="처리 로그 출력"'],
  ['<p class="log-line log-line--sys">OGCruncher initialized</p>', '<p class="log-line log-line--sys">OGCruncher 초기화 완료</p>'],
  ['<p class="log-line log-line--sys">engine: OfflineAudioContext · Float32Array DSP</p>', '<p class="log-line log-line--sys">엔진: OfflineAudioContext · Float32Array DSP</p>'],
  ['<span id="norm-ceiling-label" class="toggle-label-text">-1 dBFS PEAK</span>', '<span id="norm-ceiling-label" class="toggle-label-text">-1 dBFS 피크</span>'],
  ['<p class="log-line log-line--sys">status: awaiting input ▌</p>', '<p class="log-line log-line--sys">상태: 입력 대기 중 ▌</p>'],
  ['<span id="results-batch-summary" class="results-batch-summary">0 files ready</span>', '<span id="results-batch-summary" class="results-batch-summary">0개 파일 준비됨</span>'],
  ['class="btn btn--ghost btn--xs">CLEAR RESULTS</button>', 'class="btn btn--ghost btn--xs">결과 비우기</button>'],
  ['class="btn btn--primary btn--xs btn-download-zip" hidden>DOWNLOAD ALL (.ZIP)</button>', 'class="btn btn--primary btn--xs btn-download-zip" hidden>모두 다운로드 (.ZIP)</button>'],
  ['aria-label="Download results"', 'aria-label="결과 다운로드"'],

  // Guide
  ['<span class="tool-intro__kicker">DOCUMENTATION &amp; GAME AUDIO GUIDE</span>', '<span class="tool-intro__kicker">사용 설명서 &amp; 게임 오디오 가이드</span>'],
  ['<h2 id="seo-guide-title" class="seo-guide__title">Free Online Audio Bit-Crusher, Sample Rate Reducer &amp; Game SFX Optimizer</h2>', '<h2 id="seo-guide-title" class="seo-guide__title">무료 온라인 비트크러셔, 샘플레이트 감소기 &amp; 게임 SFX 최적화 도구</h2>'],
  [/<p class="seo-guide__lead">[\s\S]*?<\/p>/, `<p class="seo-guide__lead">
        <strong>OGCruncher</strong>는 <a data-goatcounter-click="ogcruncher-hub" href="https://sivochka.com/?ref=OGCruncher" target="_blank" rel="noopener noreferrer">Ihor Sivochka (Figarist)</a>가 만든 브라우저 기반 오디오 도구입니다. <code>WAV</code>, <code>MP3</code>, <code>FLAC</code>, <code>OGG</code> 또는 <code>AIFF</code> 파일을 대기열에 올리고, 비트 심도와 샘플레이트를 낮추고, 필터나 그릿을 더한 뒤 원본과 비교하고 게임용으로 내보내세요. 모든 작업은 <code>OfflineAudioContext</code>와 Web Workers를 통해 사용자 브라우저 내에서만 처리됩니다.
      </p>`],
  [/<article class="seo-card">\s*<h3>1–16 Bit Quantization[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Scratch용 오디오 3단계로 만들기</h3>
        <p>
          1) 사운드 파일을 놓거나 「데모 트랙 듣기」를 누릅니다. 2) <strong>NES 8-BIT</strong> 같은 프리셋을 고르고 「미리듣기」로 확인합니다. 3) <strong>「SCRATCH용」</strong>을 누른 뒤 「크런치」를 실행해 WAV를 다운로드하세요. Scratch에서는 「소리」 탭 → 「소리 업로드」로 불러올 수 있으며, <code>.ogg</code>는 지원되지 않고 파일당 10 MB 이하여야 합니다.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Simultaneous Batch Export[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>1~16비트 양자화, 샘플레이트, 디더링 &amp; 그릿</h3>
        <p>
          4비트·8비트·12비트 사운드를 만들고 표준 프리셋 버튼으로 4,000 Hz부터 48,000 Hz까지 샘플레이트를 줄여 보세요. <strong>크러시 모드</strong>는 DC 오프셋 제거, <code>|x|^1.15</code> 소프트 익스팬더, 안티앨리어싱 스무딩을 적용합니다. <strong>TPDF 디더링</strong>은 거친 입자감을 다듬고, <strong>그릿</strong>(<code>tanh</code>)과 <strong>노이즈</strong>는 아날로그 테이프 질감을 더합니다.
        </p>
      </article>`],
  [/<article class="seo-card">\s*<h3>Retro Console Presets[\s\S]*?<\/article>/, `<article class="seo-card">
        <h3>Unity 및 Godot용 WAV, OGG, MP3 일괄 내보내기</h3>
        <p>
          수십 개의 효과음을 대기열에 넣고 한 번에 동일한 설정으로 처리하세요. 지연 없는 재생용 8/16비트 <strong>PCM WAV</strong>, 가벼운 루프용 <strong>Ogg Vorbis</strong>, 호환성용 <strong>MP3</strong>(128 kbps, 8~12 kHz는 64 kbps)를 선택할 수 있습니다. 「원본 이름 유지」로 Unity <code>.meta</code> 및 Godot <code>.import</code> 참조를 지키고, 「무음 자르기」로 앞뒤 공백을 제거하세요.
        </p>
      </article>`],
  ['<h3 id="seo-matrix-title" class="seo-table__title">Recommended Settings for Game Engines &amp; Retro Targets</h3>', '<h3 id="seo-matrix-title" class="seo-table__title">게임 엔진 및 레트로 타깃별 추천 설정</h3>'],
  ['<th scope="col">Target / Use Case</th>', '<th scope="col">타깃 / 용도</th>'],
  ['<th scope="col">Bit Depth &amp; Rate</th>', '<th scope="col">비트 심도 &amp; 샘플레이트</th>'],
  ['<th scope="col">Channels &amp; DSP</th>', '<th scope="col">채널 &amp; DSP</th>'],
  ['<th scope="col">Recommended Format</th>', '<th scope="col">추천 포맷</th>'],
  ['<td><strong>Unity / Godot Low-Latency Combat &amp; UI SFX</strong></td>', '<td><strong>Unity / Godot: 저지연 전투 및 UI 효과음</strong></td>'],
  ['<td>8–12 bit · 22,050 Hz</td>', '<td>8~12비트 · 22,050 Hz</td>'],
  ['<td>Mono · Normalize ON · HPF 80 Hz</td>', '<td>모노 · 노멀라이즈 켜짐 · HPF 80 Hz</td>'],
  ['<td>PCM WAV (zero decode latency; note: Unity re-encodes imported WAVs per AudioClip Import Settings)</td>', '<td>PCM WAV (디코딩 지연 없음; Unity는 임포트된 WAV를 AudioClip 설정에 따라 재인코딩함)</td>'],
  ['<td><strong>Wear OS, Mobile &amp; WebGL Loops</strong></td>', '<td><strong>Wear OS, 모바일 &amp; WebGL 루프</strong></td>'],
  ['<td>12–16 bit · 22,050–32,000 Hz</td>', '<td>12~16비트 · 22,050~32,000 Hz</td>'],
  ['<td>Mono or Stereo · Dither ON · Grit 1.2</td>', '<td>모노 또는 스테레오 · 디더링 켜짐 · 그릿 1.2</td>'],
  ['<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS support for OGG is limited and version-dependent, so ship an MP3 fallback for WebGL</td>', '<td>Ogg Vorbis (<code>.ogg</code>) — Safari/iOS는 OGG 지원이 제한적이므로 WebGL에서는 MP3 대체 파일을 함께 제공하세요</td>'],
  ['<td><strong>Scratch 3.0 (Kids &amp; Classroom Games)</strong></td>', '<td><strong>Scratch 3.0 (교육 및 학생 게임)</strong></td>'],
  ['<td>8–16 bit · 22,050 Hz</td>', '<td>8~16비트 · 22,050 Hz</td>'],
  ['<td>Mono · Normalize ON</td>', '<td>모노 · 노멀라이즈 켜짐</td>'],
  ['<td>PCM WAV (short SFX) or MP3 (music), max 10 MB per file — Scratch 3.0 does not import <code>.ogg</code></td>', '<td>「SCRATCH용」 → WAV (긴 음악은 MP3), 파일당 최대 10 MB — Scratch 3.0은 <code>.ogg</code> 미지원</td>'],
  ['<td><strong>NES / 8-Bit Chiptune Crunch</strong></td>', '<td><strong>NES / 8비트 칩튠 크런치</strong></td>'],
  ['<td>4 bit · 12,000 Hz</td>', '<td>4비트 · 12,000 Hz</td>'],
  ['<td>Mono · Crush ON · Dither OFF · LPF 6 kHz</td>', '<td>모노 · 크러시 켜짐 · 디더링 꺼짐 · LPF 6 kHz</td>'],
  ['<td>8-Bit PCM WAV or OGG</td>', '<td>8비트 PCM WAV 또는 OGG</td>'],
  ['<td><strong>Amiga 500 / 90s Tracker Sampler</strong></td>', '<td><strong>Amiga 500 / 90년대 트래커 샘플러</strong></td>'],
  ['<td>8 bit · 28,000 Hz</td>', '<td>8비트 · 28,000 Hz</td>'],
  ['<td>Stereo · Grit 1.5 · Noise -46 dB · LPF 10 kHz</td>', '<td>스테레오 · 그릿 1.5 · 노이즈 -46 dB · LPF 10 kHz</td>'],
  ['<td>8-Bit PCM WAV / MP3 preview</td>', '<td>8비트 PCM WAV / MP3</td>'],
  [/<h2 id="faq-heading" class="seo-guide__subtitle">Frequently Asked Questions \(FAQ\)<\/h2>[\s\S]*?(?=\n    <\/section>)/,
    `<h2 id="faq-heading" class="seo-guide__subtitle">자주 묻는 질문 (FAQ)</h2>\n${faqHtml}`],
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
      <h3 id="seo-locale-title">다른 언어로 보는 OGCruncher</h3>
      <p>영어, 우크라이나어, 폴란드어, 러시아어 전체 번역 버전도 이용할 수 있습니다.</p>
      <ul class="seo-locale-links">
        <li><a href="../" hreflang="en" lang="en">English version →</a></li>
        <li><a href="../uk/" hreflang="uk" lang="uk">Українська версія →</a></li>
        <li><a href="../pl/" hreflang="pl" lang="pl">Wersja polska →</a></li>
        <li><a href="../ru/" hreflang="ru" lang="ru">Русская версия →</a></li>
      </ul>
    </aside>`],

  // Footer, notices, modal
  ['<span class="footer-note">Made by Ihor Sivochka for game developers and curious people.</span>', '<span class="footer-note">게임 개발자와 창작자를 위해 Ihor Sivochka가 만들었습니다.</span>'],
  ['<a href="#guide" class="footer-link">Guide</a>', '<a href="#guide" class="footer-link">가이드</a>'],
  ['<a href="#faq" class="footer-link">FAQ</a>', '<a href="#faq" class="footer-link">FAQ</a>'],
  ['<a href="https://sivochka.com/privacy/" class="footer-link" target="_blank" rel="noopener noreferrer">Privacy policy</a>', '<a href="https://sivochka.com/privacy/" class="footer-link" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a>'],
  ['<strong>UPDATE READY</strong>', '<strong>업데이트 준비됨</strong>'],
  ['<span id="sw-update-message">A new version is waiting.</span>', '<span id="sw-update-message">새 버전이 대기 중입니다.</span>'],
  ['class="btn btn--primary btn--xs">ACTIVATE &amp; RELOAD</button>', 'class="btn btn--primary btn--xs">적용 및 새로고침</button>'],
  ['<h2 id="modal-info-title" class="modal-title">ABOUT OGCRUNCHER</h2>', '<h2 id="modal-info-title" class="modal-title">OGCRUNCHER 정보</h2>'],
  ['<p>OGCruncher is a small browser audio tool by Ihor Sivochka. Shape high-quality audio into gritty, lo-fi samples for games, Wear OS assets and retro projects. Files are processed locally in your browser.</p>', '<p>OGCruncher는 Ihor Sivochka가 만든 가벼운 브라우저 오디오 도구입니다. 고음질 오디오를 게임, Scratch, Wear OS 및 레트로 프로젝트용 거친 로우파이 샘플로 변환할 수 있으며, 모든 파일은 브라우저 내에서 로컬로 처리됩니다.</p>'],
  ['<button id="btn-info-ok" class="btn btn--primary" style="width:100%">UNDERSTOOD</button>', '<button id="btn-info-ok" class="btn btn--primary" style="width:100%">확인</button>'],
];

module.exports = { meta, jsonLd, pairs };
