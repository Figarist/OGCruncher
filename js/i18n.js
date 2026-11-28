/**
 * Runtime strings for the localized pages.
 *
 * Static markup is translated at build time (scripts/build-locales.cjs writes
 * uk/index.html, pl/index.html, ru/index.html). This module only covers text
 * that JavaScript writes after the page loads. Keys are the English source
 * strings, so the English page and the Node regression harness (no `document`)
 * get the original text unchanged.
 * Developer log lines stay in English on purpose: they are a technical console.
 */

const SUPPORTED_LANGS = new Set(['en', 'uk', 'pl', 'ru']);
const docLang = (typeof document !== 'undefined' && document.documentElement)
  ? String(document.documentElement.lang || '').slice(0, 2).toLowerCase()
  : 'en';
export const LANG = SUPPORTED_LANGS.has(docLang) ? docLang : 'en';

const PL = {
  // Units
  'dB': 'dB',
  'dBFS': 'dBFS',
  'kbps': 'kbps',
  'bit': 'bit',
  'B': 'B',
  'KB': 'KB',
  'MB': 'MB',
  's': 's',
  'change unavailable': 'zmiana niedostępna',

  // Worker progress labels
  'DSP…': 'przetwarzanie…',
  'Encoding OGG…': 'zapisuję OGG…',
  'Encoding WAV…': 'zapisuję WAV…',
  'Encoding MP3…': 'zapisuję MP3…',

  // Toggles and statuses
  'ON': 'WŁ.',
  'OFF': 'WYŁ.',
  'MONO': 'MONO',
  'STEREO': 'STEREO',
  'IDLE': 'GOTOWY',
  'PROCESSING': 'PRZETWARZAM',
  'CANCELLED': 'ANULOWANO',
  'PARTIAL': 'CZĘŚCIOWO',
  'DONE': 'GOTOWE',
  'FAILED': 'BŁĄD',
  'WAITING': 'W KOLEJCE',
  'WEB ONLY': 'TYLKO ONLINE',
  '⬇ INSTALL APP': '⬇ ZAINSTALUJ',
  'Install OGCruncher as a standalone app': 'Zainstaluj OGCruncher jako osobną aplikację',
  'ANALYZING…': 'LICZĘ…',
  'UNAVAILABLE': 'NIEDOSTĘPNE',
  'PER-FORMAT': 'DLA KAŻDEGO FORMATU',
  'LOADING…': 'ŁADUJĘ…',
  'TRY DEMO TRACK 🎵': 'WYPRÓBUJ PRZYKŁAD 🎵',
  'UPDATING…': 'AKTUALIZUJĘ…',
  'ACTIVATE & RELOAD': 'AKTUALIZUJ I PRZEŁADUJ',

  // Buttons
  'CRUNCH': 'PRZETWÓRZ',
  'CRUNCHING…': 'PRZETWARZAM…',
  'PREVIEW': 'ODSŁUCHAJ',
  'STOP': 'STOP',
  'Preview selected audio': 'Odsłuchaj wybrany dźwięk',
  'Stop preview': 'Zatrzymaj odsłuch',
  'CRUNCHED (WET)': 'PRZETWORZONY',
  'ORIGINAL (DRY · OUTPUT SETTINGS)': 'ORYGINAŁ',
  'Compare crunched preview': 'Porównaj z przetworzonym',
  'Compare original dry preview': 'Porównaj z oryginałem',
  'Previewing: {name}': 'Teraz gra: {name}',
  'PACKING ZIP…': 'PAKUJĘ ZIP…',
  'DOWNLOAD ALL (.ZIP)': 'POBIERZ WSZYSTKO (.ZIP)',
  'DOWNLOAD / DRAG': 'POBIERZ / PRZECIĄGNIJ',
  'Remove from queue': 'Usuń z kolejki',
  'Remove {name} from queue': 'Usuń {name} z kolejki',
  'DUAL VIEW: {state}': 'DWA WYKRESY: {state}',
  'Unavailable output formats': 'Formaty, których nie udało się zapisać',
  '{format} unavailable: {message}': '{format}: nie udało się zapisać ({message})',

  // Simple mode tiers
  'TINY (MICRO)': 'MINI',
  'LOW (PORTABLE)': 'NISKI',
  'MEDIUM (RETRO)': 'ŚREDNI',
  'HIGH': 'WYSOKI',
  'Micro size (8kHz / 8-bit) — telephone-like and intentionally lo-fi.':
    'Najmniejszy plik (8 kHz / 8 bit) — brzmienie jak ze starego telefonu.',
  'Low size (16kHz / 8-bit) — compact retro/mobile character.':
    'Mały plik (16 kHz / 8 bit) — kompaktowy dźwięk retro na telefon.',
  'Medium size (22.05kHz / 12-bit) — audible vintage texture.':
    'Średni plik (22,05 kHz / 12 bit) — wyraźna, przyjemna tekstura retro.',
  'High quality (32kHz / 16-bit) — the least destructive Simple option.':
    'Wysoka jakość (32 kHz / 16 bit) — najmniejsza zmiana brzmienia.',

  // Summaries
  'Simple': 'Tryb prosty',
  'Advanced': 'Tryb zaawansowany',
  'stereo': 'stereo',
  'mono': 'mono',
  'on': 'wł.',
  'off': 'wył.',
  '{mode} · {rate} Hz · {bits}-bit effect · {channels} output · filters {filters}':
    '{mode} · {rate} Hz · {bits} bit · {channels} · filtry {filters}',
  'Codecs: {list}': 'Formaty: {list}',
  'Original names': 'oryginalne nazwy',
  '{db} dBFS PEAK': '{db} dBFS SZCZYT',
  'File {index}/{total} — {label}': 'Plik {index}/{total} — {label}',
  'Completed: {full} full, {partial} partial; failed: {failed}; cancelled: {cancelled}; not attempted: {skipped}.':
    'Zakończono: {full} w pełni, {partial} częściowo; błędy: {failed}; anulowano: {cancelled}; pominięto: {skipped}.',
  '{count} file ready': '{count} plik gotowy',
  '{count} files ready (few)': '{count} pliki gotowe',
  '{count} files ready': '{count} plików gotowych',

  // Toasts
  'Processing cancelled.': 'Przetwarzanie anulowane.',
  '{full} full · {partial} partial · {failed} failed': '{full} w pełni · {partial} częściowo · {failed} z błędem',
  '✅ {count} file(s) crunched.': '✅ Przetworzono plików: {count}.',
  '📦 ZIP archive downloaded.': '📦 Archiwum ZIP pobrane.',
  '⚠ Failed to build ZIP archive.': '⚠ Nie udało się utworzyć archiwum ZIP.',
  '🎵 Demo track loaded.': '🎵 Przykład wczytany.',
  'Demo track unavailable.': 'Przykład jest obecnie niedostępny.',
  'Keep at least one export format enabled.': 'Pozostaw włączony co najmniej jeden format eksportu.',
  '🔗 Link copied to clipboard': '🔗 Link skopiowany do schowka',
  '⚠ Copy manually from address bar': '⚠ Skopiuj link ręcznie z paska adresu',
  '◉ author preset loaded': '◉ Wczytano preset LO-Q',
  '🎮 NES 8-bit preset loaded': '🎮 Wczytano preset NES 8-BIT',
  '💾 Amiga 500 preset loaded': '💾 Wczytano preset AMIGA 500',
  '👤 custom preset loaded': '👤 Wczytano własny preset',
  '❌ Failed to load custom preset': '❌ Nie udało się wczytać własnego presetu',
  '💾 custom preset saved': '💾 Zapisano własny preset',
  '↩ undo': '↩ cofnięto',
  '↪ redo': '↪ ponowiono',
  '✅ App installed!': '✅ Aplikacja zainstalowana!',
  '{count} exact duplicate file was already queued and not added again. Re-selected files remain separate unless they are the same File object.':
    'Ten plik jest już w kolejce i nie został dodany ponownie.',
  '{count} exact duplicate files were already queued and not added again. Re-selected files remain separate unless they are the same File object.':
    'Te pliki ({count}) są już w kolejce i nie zostały dodane ponownie.',
  '🧩 Scratch: WAV only. Keep each sound under 10 MB.': '🧩 Dla Scratch: tylko WAV. Każdy dźwięk poniżej 10 MB.',
  '{name} is {size}: larger than Scratch’s 10 MB limit.': '{name} ma {size} — przekracza limit 10 MB w Scratch.',

  // The few log lines a first-time visitor reads
  'ready. drop files or click browse.': 'gotowe. upuść pliki lub kliknij „wybierz pliki”.',
  'Demo track loaded successfully.': 'Przykład został wczytany.',
  '{added} file(s) added. Queue: {total} total.': 'Dodano plików: {added}. Razem w kolejce: {total}.',
  'Offline cache is unavailable; the audio workflow still runs online.': 'Pamięć offline jest niedostępna, ale aplikacja działa normalnie online.',

  // Service worker update notice
  'A new version is ready. Reload is safe now; no queued files or generated results were detected.':
    'Nowa wersja jest gotowa. Możesz bezpiecznie przeładować stronę — kolejka i wyniki są puste.',
  'Activate the waiting update and reload the page.': 'Aktywuj nową wersję i przeładuj stronę.',
  'Update waiting. Finish or download your work, then clear the queue before activating; reload clears in-memory audio state.':
    'Aktualizacja czeka. Pobierz gotowe pliki i wyczyść kolejkę przed przeładowaniem — odświeżenie usuwa stan audio z pamięci.',
  'Reload is disabled while queued files, preview, processing, or results are present.':
    'Przeładowanie jest zablokowane, gdy w kolejce są pliki, trwa odsłuch lub są gotowe wyniki.',
  'Update activation requested. The page will reload after the new worker takes control.':
    'Aktualizuję… Strona przeładuje się automatycznie.',
};

const RU = {
  // Units
  'dB': 'дБ',
  'dBFS': 'дБFS',
  'kbps': 'кбит/с',
  'bit': 'бит',
  'B': 'Б',
  'KB': 'КБ',
  'MB': 'МБ',
  's': 'с',
  'change unavailable': 'изменение недоступно',

  // Worker progress labels
  'DSP…': 'обработка…',
  'Encoding OGG…': 'сохраняю OGG…',
  'Encoding WAV…': 'сохраняю WAV…',
  'Encoding MP3…': 'сохраняю MP3…',

  // Toggles and statuses
  'ON': 'ВКЛ',
  'OFF': 'ВЫКЛ',
  'MONO': 'МОНО',
  'STEREO': 'СТЕРЕО',
  'IDLE': 'ОЖИДАНИЕ',
  'PROCESSING': 'ОБРАБОТКА',
  'CANCELLED': 'ОТМЕНЕНО',
  'PARTIAL': 'ЧАСТИЧНО',
  'DONE': 'ГОТОВО',
  'FAILED': 'ОШИБКА',
  'WAITING': 'В ОЧЕРЕДИ',
  'WEB ONLY': 'ТОЛЬКО ОНЛАЙН',
  '⬇ INSTALL APP': '⬇ УСТАНОВИТЬ',
  'Install OGCruncher as a standalone app': 'Установить OGCruncher как отдельное приложение',
  'ANALYZING…': 'СЧИТАЮ…',
  'UNAVAILABLE': 'НЕДОСТУПНО',
  'PER-FORMAT': 'ДЛЯ КАЖДОГО ФОРМАТА',
  'LOADING…': 'ЗАГРУЗКА…',
  'TRY DEMO TRACK 🎵': 'ПОПРОБОВАТЬ ПРИМЕР 🎵',
  'UPDATING…': 'ОБНОВЛЯЮ…',
  'ACTIVATE & RELOAD': 'ОБНОВИТЬ И ПЕРЕЗАГРУЗИТЬ',

  // Buttons
  'CRUNCH': 'ОБРАБОТАТЬ',
  'CRUNCHING…': 'ОБРАБАТЫВАЮ…',
  'PREVIEW': 'ПОСЛУШАТЬ',
  'STOP': 'СТОП',
  'Preview selected audio': 'Послушать выбранный звук',
  'Stop preview': 'Остановить прослушивание',
  'CRUNCHED (WET)': 'ОБРАБОТАННЫЙ',
  'ORIGINAL (DRY · OUTPUT SETTINGS)': 'ОРИГИНАЛ',
  'Compare crunched preview': 'Сравнить с обработанным',
  'Compare original dry preview': 'Сравнить с оригиналом',
  'Previewing: {name}': 'Сейчас играет: {name}',
  'PACKING ZIP…': 'УПАКОВКА ZIP…',
  'DOWNLOAD ALL (.ZIP)': 'СКАЧАТЬ ВСЁ (.ZIP)',
  'DOWNLOAD / DRAG': 'СКАЧАТЬ / ПЕРЕТАЩИТЬ',
  'Remove from queue': 'Удалить из очереди',
  'Remove {name} from queue': 'Удалить {name} из очереди',
  'DUAL VIEW: {state}': 'ДВА ГРАФИКА: {state}',
  'Unavailable output formats': 'Форматы, которые не удалось сохранить',
  '{format} unavailable: {message}': '{format}: не удалось сохранить ({message})',

  // Simple mode tiers
  'TINY (MICRO)': 'МИНИ',
  'LOW (PORTABLE)': 'НИЗКИЙ',
  'MEDIUM (RETRO)': 'СРЕДНИЙ',
  'HIGH': 'ВЫСОКИЙ',
  'Micro size (8kHz / 8-bit) — telephone-like and intentionally lo-fi.':
    'Минимальный размер (8 кГц / 8 бит) — звук как из старого телефона.',
  'Low size (16kHz / 8-bit) — compact retro/mobile character.':
    'Малый размер (16 кГц / 8 бит) — компактный ретро-звук для мобильных игр.',
  'Medium size (22.05kHz / 12-bit) — audible vintage texture.':
    'Средний размер (22,05 кГц / 12 бит) — заметная винтажная текстура.',
  'High quality (32kHz / 16-bit) — the least destructive Simple option.':
    'Высокое качество (32 кГц / 16 бит) — минимальное изменение звука.',

  // Summaries
  'Simple': 'Простой режим',
  'Advanced': 'Расширенный режим',
  'stereo': 'стерео',
  'mono': 'моно',
  'on': 'вкл',
  'off': 'выкл',
  '{mode} · {rate} Hz · {bits}-bit effect · {channels} output · filters {filters}':
    '{mode} · {rate} Гц · {bits} бит · {channels} · фильтры {filters}',
  'Codecs: {list}': 'Форматы: {list}',
  'Original names': 'исходные имена',
  '{db} dBFS PEAK': '{db} дБFS ПИК',
  'File {index}/{total} — {label}': 'Файл {index}/{total} — {label}',
  'Completed: {full} full, {partial} partial; failed: {failed}; cancelled: {cancelled}; not attempted: {skipped}.':
    'Готово: {full} полностью, {partial} частично; ошибок: {failed}; отменено: {cancelled}; не обработано: {skipped}.',
  '{count} file ready': '{count} файл готов',
  '{count} files ready (few)': '{count} файла готовы',
  '{count} files ready': '{count} файлов готово',

  // Toasts
  'Processing cancelled.': 'Обработка отменена.',
  '{full} full · {partial} partial · {failed} failed': '{full} полностью · {partial} частично · {failed} с ошибкой',
  '✅ {count} file(s) crunched.': '✅ Обработано файлов: {count}.',
  '📦 ZIP archive downloaded.': '📦 ZIP-архив скачан.',
  '⚠ Failed to build ZIP archive.': '⚠ Не удалось собрать ZIP-архив.',
  '🎵 Demo track loaded.': '🎵 Пример загружен.',
  'Demo track unavailable.': 'Пример сейчас недоступен.',
  'Keep at least one export format enabled.': 'Оставьте включённым хотя бы один формат экспорта.',
  '🔗 Link copied to clipboard': '🔗 Ссылка скопирована в буфер обмена',
  '⚠ Copy manually from address bar': '⚠ Скопируйте ссылку из адресной строки',
  '◉ author preset loaded': '◉ Пресет LO-Q загружен',
  '🎮 NES 8-bit preset loaded': '🎮 Пресет NES 8-BIT загружен',
  '💾 Amiga 500 preset loaded': '💾 Пресет AMIGA 500 загружен',
  '👤 custom preset loaded': '👤 Пользовательский пресет загружен',
  '❌ Failed to load custom preset': '❌ Не удалось загрузить пользовательский пресет',
  '💾 custom preset saved': '💾 Пользовательский пресет сохранён',
  '↩ undo': '↩ отменено',
  '↪ redo': '↪ возвращено',
  '✅ App installed!': '✅ Приложение установлено!',
  '{count} exact duplicate file was already queued and not added again. Re-selected files remain separate unless they are the same File object.':
    'Этот файл уже есть в очереди и не был добавлен повторно.',
  '{count} exact duplicate files were already queued and not added again. Re-selected files remain separate unless they are the same File object.':
    'Эти файлы ({count}) уже есть в очереди и не были добавлены повторно.',
  '🧩 Scratch: WAV only. Keep each sound under 10 MB.': '🧩 Для Scratch: только WAV. Каждый звук — до 10 МБ.',
  '{name} is {size}: larger than Scratch’s 10 MB limit.': '{name} весит {size} — это больше лимита Scratch в 10 МБ.',

  // The few log lines a first-time visitor reads
  'ready. drop files or click browse.': 'готово. перетащите файлы или нажмите «выбрать файлы».',
  'Demo track loaded successfully.': 'Пример успешно загружен.',
  '{added} file(s) added. Queue: {total} total.': 'Добавлено файлов: {added}. Всего в очереди: {total}.',
  'Offline cache is unavailable; the audio workflow still runs online.': 'Офлайн-кэш недоступен, но приложение работает онлайн.',

  // Service worker update notice
  'A new version is ready. Reload is safe now; no queued files or generated results were detected.':
    'Доступна новая версия. Можно безопасно перезагрузить страницу: в очереди нет файлов и результатов.',
  'Activate the waiting update and reload the page.': 'Активировать обновление и перезагрузить страницу.',
  'Update waiting. Finish or download your work, then clear the queue before activating; reload clears in-memory audio state.':
    'Ожидает обновление. Сначала скачайте результаты и очистите очередь: перезагрузка сбросит состояние аудио в памяти.',
  'Reload is disabled while queued files, preview, processing, or results are present.':
    'Перезагрузка недоступна, пока в очереди есть файлы, идёт прослушивание или есть готовые результаты.',
  'Update activation requested. The page will reload after the new worker takes control.':
    'Обновляю… Страница перезагрузится автоматически.',
};

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
  '{count} file ready': '{count} файл готовий',
  '{count} files ready (few)': '{count} файли готові',
  '{count} files ready': '{count} файлів готово',

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

const DICTIONARIES = { uk: UK, pl: PL, ru: RU };

const NUMBER_LOCALES = {
  en: 'en-US',
  uk: 'uk-UA',
  pl: 'pl-PL',
  ru: 'ru-RU',
};

const HZ_UNITS = {
  en: 'Hz',
  uk: 'Гц',
  pl: 'Hz',
  ru: 'Гц',
};

/** Translate an English source string; `{name}` placeholders are filled from vars. */
export function t(text, vars) {
  const dict = DICTIONARIES[LANG];
  let out = (dict && Object.prototype.hasOwnProperty.call(dict, text)) ? dict[text] : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
  return out;
}

/** Slavic 3-form plural rules for uk, pl, ru; English 2-form rules for en. */
export function plural(count, forms) {
  const n = Math.abs(Number(count) || 0);
  if (LANG === 'en') return n === 1 ? forms.one : (forms.other ?? forms.many);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (LANG === 'pl') {
    if (n === 1) return forms.one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
    return forms.many;
  }
  if (mod10 === 1 && mod100 !== 11) return forms.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
  return forms.many;
}

/** Number formatting that matches the page language (12 000 vs 12,000). */
export function formatNumber(value) {
  return Number(value).toLocaleString(NUMBER_LOCALES[LANG] || 'en-US');
}

/** "Hz" unit in the page language. */
export function hz(value) {
  return `${formatNumber(value)} ${HZ_UNITS[LANG] || 'Hz'}`;
}
