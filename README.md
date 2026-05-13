# OGCruncher 🎛️

**OGCruncher** is a professional-grade, in-browser audio workstation for bit-crushing and lo-fi DSP processing. Built for sound designers and game developers, it enables high-speed batch conversion of audio assets with a focus on efficiency, precision, and aesthetic feedback.

![OGCruncher UI](https://raw.githubusercontent.com/Figarist/OGCruncher/master/www/icons/icon-512.png)

## 🚀 Key Features

- **Professional DSP Engine**: Zero-allocation processing using `OfflineAudioContext` and `Float32Array` for glitch-free, high-performance buffer manipulation.
- **Dual Spectrum Analysis**: Real-time frequency visualization comparing **Original** (pre-FX) vs. **Crunched** (post-FX) signals simultaneously. Includes frequency grid markers (1k–20k).
- **A/B Comparison Workflow**: Instant seamless switching between processed and raw audio during preview with zero latency.
- **Advanced Parameter Control**:
  - **Bit Depth & Rate**: Precision resolution and sampling control.
  - **Grit & Saturation**: Character-driven `tanh` saturation for warm analog-style clipping.
  - **Crush Mode**: Integrated pipeline with soft expansion, triangular dither, and adjacent-sample anti-aliasing.
  - **Dynamic Filters**: High-Pass (HPF), Low-Pass (LPF), and 80Hz Bass Boost.
- **Pro Workflow Optimization**:
  - **Hotkeys**: Global support for `Space` (Preview), `Enter` (Crunch), and `C` (A/B Toggle).
  - **Auto-Save**: State persistence via `localStorage`—your settings are never lost on refresh.
  - **Intelligent Queue**: Individual file management and batch ZIP exports.
- **English Documentation**: Beginner-friendly professional tooltips for every parameter.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Bento-grid UI), and ES6+ JavaScript.
- **Audio Engine**: Web Audio API (Offline processing). No external DSP frameworks.
- **Format Support**: Direct encoding to high-compression **Ogg Vorbis** (Quality 0) for optimized game assets.
- **Environment**: Progressive Web App (PWA) with offline support and Desktop packaging via **Neutralinojs**.

## 💻 Development

### Running Locally
You can serve the application using any static file server:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve www
```

### Desktop Build (Neutralinojs)
To generate standalone binaries for Windows, macOS, and Linux:
```bash
npm install -g @neutralinojs/neu
neu update
neu build
```

## 🎨 Design System
The UI utilizes the **Cloud Dancer** design language—a minimalist, high-contrast Bento-grid aesthetic with premium glassmorphism effects, crisp typography (`Outfit` & `Fira Code`), and a focus on visual feedback.

---
*Developed by [figarist](https://figarist.github.io/)*
