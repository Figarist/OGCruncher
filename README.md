# OGCruncher

**OGCruncher** is a high-performance, in-browser audio bit-crusher and lo-fi DSP converter. Designed for speed, it runs entirely on the client-side using Vanilla JavaScript and `OfflineAudioContext`, ensuring raw buffer manipulation with zero garbage-collection overhead during the processing loop.

![OGCruncher UI](https://raw.githubusercontent.com/Figarist/OGCruncher/master/www/icons/icon-512.png) *(Note: Icon path is a placeholder)*

## Features

- **Zero-Allocation DSP**: Processes audio buffers in-place using `Float32Array` to prevent memory leaks and GC stutters.
- **Complete Lo-Fi Pipeline**:
  - DC Offset Removal
  - Peak Normalization
  - Soft Expander (`|x|^1.15`)
  - Triangular Dither
  - 8-bit to 16-bit Quantization
  - Adjacent-sample Anti-Aliasing
  - Soft Clipping (`tanh` saturation)
- **LO-Q Preset**: One-click 8-bit / 22050 Hz preset (the lo-fi sweet spot).
- **Batch Processing**: Drag and drop multiple files and convert them instantly.
- **OGG Vorbis Export**: Encodes directly to heavily compressed OGG Vorbis (quality 0) for tiny file sizes, ideal for game engines.

## Tech Stack

- **UI**: Vanilla HTML5 / CSS3 with a clean, responsive "Bento Grid" aesthetic.
- **Core Engine**: Pure JavaScript (`OfflineAudioContext`). No heavy frameworks or external dependencies.
- **PWA**: Fully installable as a Progressive Web App with offline support (Service Worker).
- **Desktop Wrapper**: Packaged as a lightweight desktop application (`.exe`, `.app`, `.AppImage`) via [Neutralinojs](https://neutralino.js.org/).

## Development & Build

### Running Locally
You can run the web app with any static server:
```bash
python -m http.server 8000
# or
npx serve www
```

### Desktop App (Neutralinojs)
To build the standalone desktop executables:
```bash
npm install -g @neutralinojs/neu
neu update
neu build
```
The compiled binaries will be available in the `dist/OGCruncher/` directory.

### GitHub Actions CI/CD
This project includes a fully automated workflow:
- **PWA Deployment**: Automatically deploys the `www` directory to GitHub Pages on every push to `master`.
- **Desktop Release**: Automatically builds Neutralino executables and publishes them as a ZIP archive in the GitHub Releases tab.

## Design System
The UI uses the **Cloud Dancer** color palette, smooth bento-box panels, and crisp typography (`Outfit` and `Fira Code`) to ensure a beautiful and functional developer experience.

---
*Created by [figarist](https://figarist.github.io/)*
