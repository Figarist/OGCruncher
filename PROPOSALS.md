# OGCruncher Roadmap: Top 10 Proposals

This document outlines the high-priority features, technical improvements, and user experience enhancements proposed for the next stages of OGCruncher development.

---

### 1. True TPDF Dithering (DSP)
Implement **Triangular Probability Density Function (TPDF)** dithering in the `processDSP` pipeline. Unlike simple white noise, TPDF dithering completely eliminates quantization distortion and harmonic aliasing at extremely low bit depths (1–4 bits), providing a more "analog-like" floor for lo-fi processing.

### 2. Waveform Preview & Seek Bar (UX)
Add a waveform visualization (using Canvas or `wavesurfer.js`) to the preview panel. This should include a seek bar, allowing users to jump to specific parts of the track (e.g., transients vs. tails) to audit how processing affects different signal characteristics.

### 3. Advanced Encoder Settings (Export)
Expose quality settings for MP3 and OGG exports. Currently, bitrate is hardcoded (e.g., 128kbps for MP3). Adding a slider (32kbps to 320kbps) will allow users to choose between intentional "encoder artifacts" and high-fidelity archival.

### 4. Legacy Resampling Modes (DSP)
The Web Audio API provides high-quality clean resampling. To better mimic vintage hardware (like the SP-1200 or Akai S900), add selectable interpolation modes:
- **Clean** (Standard Browser)
- **Linear** (Authentic lo-fi "jitter")
- **Nearest Neighbor** (Extreme aliasing/staircase artifacts)

### 5. Per-File Queue Progress (UI)
Enhance the file queue interface to show individual progress bars for each file being processed. This is essential for large batch jobs, providing clear feedback on which files are done, in progress, or waiting.

### 6. Expanded "Crunch Modes" (DSP)
Diversify the "Mario Mode" concept with additional nonlinear distortion algorithms:
- **S-Curve**: Soft saturation/compression.
- **Hard Clip**: Digital clipping for aggressive transients.
- **Sine Fold**: Harmonic folding/waveshaping for metallic textures.

### 7. Dynamic Noise & Gating (DSP)
Add a "Dynamic Noise" mode where the noise floor level is modulated by the signal amplitude (Envelope Follower). This mimics the behavior of vintage gear that only produces hiss when a signal is present, or includes a basic noise gate to clean up tails.

### 8. Batch Naming Templates (Export)
Allow users to define a naming pattern for processed files using variables. 
Example: `{name}_[8bit]_[22kHz].wav`. This automates library organization for power users handling hundreds of samples.

### 9. A/B/C Comparison Slot (UX)
Expand the comparison tool to include a second "Wet" slot. Users could compare the **Original** signal against **Preset A** and **Preset B** simultaneously, making it much easier to fine-tune subtle parameter differences.

### 10. Enhanced PWA Offline Support (Reliability)
Audit and update the `vite-plugin-pwa` configuration to ensure all external assets (Google Fonts, `lame.js`, `OggVorbisEncoder.js`) are aggressively cached. This ensures OGCruncher remains a robust, reliable tool in environments without internet access, such as airplanes or basement studios.
