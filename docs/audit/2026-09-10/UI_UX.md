# UI/UX and visual alignment

Reference: [Figarist Ukrainian home](https://figarist.github.io/uk/), inspected live
on 2026-09-10 through screenshot and computed CSS. App: local production build.

## Brand fit

Current warm background, white/warm cards, navy text, green accents, system font,
20px corners and subtle shadows already match the reference foundation. Keep them.
The old purple/Outfit documentation does not describe the current site. The reference
uses generous readable text and clear action hierarchy; the app has denser microcopy
and monospace. Matching colors alone is insufficient.

Use [DESIGN.md](../../../DESIGN.md) tokens. Retain technical readouts but make primary
instructions and status readable. Preserve the tool workflow. Spectrum still uses
hard-coded former purple/cyan colors; centralize them and check surface contrast.

## Usability findings

- **Mobile Advanced (U01):** inline speed span creates an implicit column, collapsing
  switches to 14px at 390px and colliding labels. Check child geometry, not just overflow.
- **Estimate trust (F01–F03):** +0% hides growth; one estimate represents two codecs.
  Separate per-format estimated/actual values and explain uncertain metadata.
- **Microcopy size:** savings labels are `.52rem` (~8.32px at 16px root). Prefer 12–14px
  supporting text and 14–16px instructions, then test zoom and long names.
- **Result hierarchy:** desktop Simple reserves substantial blank space while a large
  log competes with downloads. Make results prominent and logs collapsible.
- **State clarity:** add semantic selected mode; update accessible Preview name to Stop
  during playback; reset A/B label; identify the selected preview file.
- **Keyboard/help:** scope shortcuts and provide focus/touch help and non-drag resizing.

## Proposed workflow

1. Add files/try demo and show validated duration, channels and file count.
2. Choose mode with predictable preservation of Advanced settings. Show effective
   sample rate, effect depth and chosen export format.
3. Preview selected file, seek/loop region and compare against an explicitly defined
   dry reference. Monitor volume stays separate from export gain.
4. Encode selected formats from frozen settings. Show stage, cancellation and retries.
5. Display actual sizes and parameters, then offer individual or collision-safe ZIP
   download with a settings manifest.

## Accessibility acceptance plan

Test keyboard focus order, modal Tab/Escape/Enter, screen-reader names/state, 200% zoom,
reduced motion, touch help and long filenames. Keep comfortable 44px product targets.
WCAG 2.2 AA's minimum target criterion uses 24px with spacing/exceptions; do not call
every sub-44px target an automatic AA failure. See [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
No complete contrast or screen-reader audit was executed.

Acceptance widths: 320/390/600/860/1180/1440 CSS px, both modes, expanded filters,
empty queue, preview and results. Only desktop and narrow 390/320 conditions were
observed here; other widths and 200% zoom are follow-up checks, not claimed passes.

## QoL order

Fix trust/access first, then format selection, download-all, per-file preview,
waveform seeking, cancel/retry and numeric entry. Follow with full Ukrainian UI and
optional loudness-matched A/B. Defer ADPCM/M/S/new resamplers until correctness work.
See [the prioritized backlog](../../../PROPOSALS.md).
