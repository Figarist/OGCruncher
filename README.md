# OGCruncher 🎛️

**OGCruncher** is a professional-grade, in-browser audio workstation for bit-crushing and lo-fi DSP processing. Built for sound designers and game developers, it enables high-speed batch conversion of audio assets with a focus on efficiency, precision, and aesthetic feedback.

### 🌐 [Live Demo: figarist.github.io/OGCruncher](https://figarist.github.io/OGCruncher/)

![OGCruncher UI](./public/images/logo.svg)

## 🚀 Key Features

- **Simple & Advanced UI Modes**: Toggle between a novice-friendly interface with a single 4-step **"Size & Quality"** slider (Tiny, Low, Medium, High) and the full technical parameter rack. State snapshots preserve advanced parameters when toggling back and forth.
- **Estimated Size Savings Widget**: Real-time comparison card showing original size, estimated WAV size, and estimated compressed (OGG/MP3) size alongside a pulsing green savings percentage badge (e.g. `-80% SPACE`).
- **Interactive Onboarding**: A pulsing demo track call-to-action button in the dropzone to let beginners test the application immediately with zero effort.
- **Professional DSP Engine**: True asynchronous processing using **AudioWorklet** for real-time zero-latency preview and **Web Worker** for high-speed multi-format batch encoding (Ogg, MP3, WAV) to keep the main thread fluid.
- **Dual Spectrum Analysis**: Real-time frequency visualization comparing **Original** (pre-FX) vs. **Crunched** (post-FX) signals simultaneously. Includes frequency grid markers (1k–20k).
- **A/B Comparison Workflow**: Instant seamless switching between processed and raw audio during preview with zero latency.
- **Advanced Parameter Control**:
  - **Bit Depth & Rate**: Precision resolution and sampling control.
  - **Grit & Saturation**: Character-driven `tanh` saturation for warm analog-style clipping.
  - **Speed / Pitch**: Native playback rate adjustment for "tape-style" pitch shifting and speed control (0.5x - 2.0x).
  - **Crush Mode**: Integrated pipeline with soft expansion, triangular dither, and adjacent-sample anti-aliasing.
  - **Dynamic Filters**: High-Pass (HPF), Low-Pass (LPF), and 80Hz Bass Boost.
- **Pro Workflow Optimization**:
  - **Resizable Interface**: Windows-style draggable handles to customize your workspace layout.
  - **Hotkeys**: Global support for `Space` (Preview), `Enter` (Crunch), `C` (A/B Toggle), and `N` (Live Update).
  - **Auto-Save**: State persistence via `localStorage`—your parameters and layout widths are saved automatically.
  - **Intelligent Queue**: Individual file management and batch ZIP exports.
- **English & Ukrainian Documentation**: Beginner-friendly professional tooltips for every parameter.

- **Frontend**: Vanilla HTML5, CSS3 (Custom Bento-grid UI), and modular **ES6+ JavaScript**.
- **Build System**: **Vite** for optimized bundling, HMR, and cache busting.
- **Audio Engine**: Web Audio API (Offline processing). No external DSP frameworks.
- **Format Support**: Direct encoding to high-compression **Ogg Vorbis** (Quality 0), MP3, and WAV.
- **Environment**: Progressive Web App (PWA) via `vite-plugin-pwa` and Desktop packaging via **Neutralinojs**.

## 💻 Development

### Running Locally
1. Install dependencies:
```bash
npm install
```
2. Start the development server:
```bash
npm run dev
```

### Desktop Build (Neutralinojs)
To generate standalone binaries for Windows, macOS, and Linux:
1. Build the frontend assets:
```bash
npm run build
```
2. Build the desktop app:
```bash
neu build
```

## 🎨 Design System
The UI utilizes the **Cloud Dancer** design language—a minimalist, high-contrast Bento-grid aesthetic with premium glassmorphism effects, crisp typography (`Outfit` & `Fira Code`), and a focus on visual feedback.

---
*Developed by [figarist](https://figarist.github.io/)*
