# OGCruncher Design Document V2.1 🎛️

## 1. Overview
**OGCruncher** is a high-performance, browser-based audio processing tool designed for bit-crushing and lo-fi sound design. It prioritizes speed, precision, and a professional "Cloud Dancer" aesthetic for game developers and sound designers who need to batch-process audio assets into high-quality Ogg Vorbis, MP3, or WAV formats with specific lo-fi characteristics.

## 2. Technical Architecture

### 2.1 Build System & Modularization
The project uses **Vite** for modern development and optimized production builds. The codebase is fully modularized using **ES Modules (ESM)**, with logic split into specialized files in the `js/` directory:
- `main.js`: Entry point.
- `state.js`: Global state management, simple/advanced mode persistence, and synchronization.
- `dsp.js`: Core audio processing logic.
- `ui.js`: DOM manipulation and layout handling.
- `preview.js`: Audio playback and A/B comparison.
- `encoders.js`: OGG/MP3/WAV export wrappers.
- `utils.js`: Helper functions.

### 2.2 Engine Philosophy: "Zero-Allocation"
The core DSP engine follows a **zero-allocation** style, performing buffer mutations in-place on `Float32Array` objects. This minimizes Garbage Collection (GC) overhead during heavy batch processing.

### 2.2 Audio Pipeline
The processing pipeline leverages the **Web Audio API**'s `OfflineAudioContext` for faster-than-realtime rendering.

**Data Flow:**
1. **Decode**: `AudioContext.decodeAudioData` converts input files to raw PCM.
2. **Filter Chain**: A sequence of `BiquadFilterNode` (HPF, LPF, Bass Boost) applied via `OfflineAudioContext`.
3. **Resample**: The `OfflineAudioContext` handles resampling to the target frequency (e.g., 22050Hz).
4. **DSP Stage (In-Place)**:
   - **Noise Floor**: Injecting low-level white noise.
   - **DC Offset Removal**: Centering the waveform.
   - **Initial Normalization**: Scaling to 1.0 peak for consistent crushing.
   - **Crush Mode (Optional)**:
     - **Soft Expander**: Enhances low-level detail before crushing.
     - **Triangular Dither**: Minimizes quantization distortion artifacts.
     - **Quantization**: Rounding to target bit depth (1–16 bit).
     - **Anti-Aliasing**: Adjacent-sample averaging to reduce foldback noise.
   - **Saturation**: `Math.tanh(x * grit)` for warm analog-style clipping.
5. **Post-Process**: Optional peak normalization to 0 dBFS.
6. **Encode**: Converting processed PCM to OGG, MP3, or WAV.

## 3. UI/UX Design System: "Cloud Dancer"

The interface follows a **Flexible Bento Grid** layout, optimized for a left-to-right processing workflow.

### 3.1 Core Palette (V2.1 Purple System)
- **Background**: `#f2f0eb` (Cloud Dancer) - warm, off-white neutral.
- **Surface/Cards**: `#ffffff` (Pure White).
- **Primary Accent**: `#7c69e3` (Soft Purple) - used for primary actions like "CRUNCH".
- **Secondary Accent**: `#ff85a1` (Vibrant Pink) - used for toggle states and comparisons.
- **Secondary Dark**: `#c9184a` (Deep Cherry) - used for high-contrast labels and "STOP" states.
- **Functional Accents**: 
  - Cyan (`#b2f5ea`): Active "Live" states, PWA status.
  - Yellow (`#fef3c7`): Idle/Waiting states.
  - Mint (`#c6f6d5`): Normalization/Positive toggles.

### 3.2 Typography
- **Primary (UI/Headings)**: `Outfit` (Sans-serif) - modern and highly legible.
- **Technical (Logs/Metadata)**: `Fira Code` (Monospace) - emphasizes technical accuracy.

### 3.3 Layout Constraints
- **Bento Gap**: `20px` (`--hub-gap`)
- **Corner Radius**: `20px` (`--card-radius`)
- **Desktop Grid**: Resizable 3-column layout (`var(--col-left) 6px var(--col-center) 6px var(--col-right)`).
- **Resizers**: Full-height interactive handles with Windows-style dragging and visual handles.
- **Mobile Stack**: Transitions into a vertical stack with a sticky header.

### 3.4 Simple Mode Dashboard & Widgets
- **Mode Toggle Tabs**: A rounded pill button container (`SIMPLE` / `ADVANCED`) positioned at the top of the parameter controls. Uses transition animations and shadow highlights for the active state.
- **Bento-style Bento Grid Adaptation**: In Simple Mode, the 11 technical cards are hidden and replaced with a wide, single-card layout (`#group-simple-quality`) that spans both columns.
- **Pips & Snap Alignment**: Quality slider snaps cleanly to discrete labels (TINY, LOW, MEDIUM, HIGH) representing standard target hardware presets.
- **Estimated Savings Card**: Displays live original vs estimated file sizes. Employs a pulsing badge style (`.badge--pulse-green`) when savings are significant.


## 4. Motion & Interaction

### 4.1 Transitions
- **Panel Entry**: Y-axis slide-up (200-400ms) with staggered delays for each Bento panel.
- **Log Streaming**: New entries slide in from the bottom with a brief brightness highlight.
- **Resizer Handles**: Subtle expansion and glow on hover for intuitive layout customization.

### 4.2 Feedback Systems
- **Header Progress**: A linear, glowing progress bar integrated into the very top of the header.
- **Waveform Glow**: The spectral visualizer pulses with a purple glow animation when audio is processing or playing.
- **A/B Comparison**: Instantaneous toggle between raw and processed signals with synchronized playback.
- **Stabilized Console**: The log window has a fixed relative height (`50vh`) to prevent layout jumping during processing.

### 4.3 Drag UX
- **Selection Blocking**: Globally disabling `-webkit-user-select` during active resizer dragging or slider interaction to prevent visual noise.
- **Custom Cursor**: Context-aware cursor switching (`col-resize`) during layout customization.

## 5. Professional Workflow Features
- **Deep Linking**: All parameters are encodable into the URL hash for preset sharing.
- **Batch Processing**: Parallel file handling with ZIP export via `JSZip`.
- **Layout Persistence**: Custom panel widths are saved to `localStorage`.
- **PWA & Offline**: Managed via `vite-plugin-pwa`. It automatically generates a service worker that caches all critical assets, including heavy encoder libraries (`.js` and `.mem` files), ensuring reliability in zero-connectivity environments.
- **Cross-Platform**: Optimized for both high-resolution desktops and touch-friendly mobile devices.

## 6. Technical Constraints
- **Zero-Allocation DSP**: responsive interface during heavy mutations.
- **Touch Targets**: Minimum hit area of `44px` for all interactive elements.
- **Keyboard Shortcuts**: `Space` (Preview), `Enter` (Crunch), `C` (A/B Toggle), `N` (Live Update).
