# UI/UX and visual alignment

## Reference comparison

The live app was compared with <https://figarist.github.io/uk/> in the same
isolated in-app browser environment. Both use the same warm `rgb(242, 240, 235)`
page background, system UI font family, rounded white surfaces, dark navy text,
and restrained green accent language. OGCruncher extends that system with a
denser audio-tool layout, technical monospace log, and explicit LOCAL/OFFLINE /
PWA READY badges.

Representative screenshots were captured for the live app at 1280×720, 390×844,
and 320×800, plus the Figarist Ukrainian reference. They are listed in
[EVIDENCE.md](EVIDENCE.md).

## Observed strengths

- The desktop shell is visually coherent: rounded header, three white panels,
  pale dividers, green success accents, and dark log panel.
- The title and status hierarchy are understandable: tool identity, local-file
  promise, queue, parameters, preview/process actions, and results are separate.
- The live AX tree exposed labeled sliders for bit depth, sample rate, grit,
  noise, speed, HPF, LPF, and bass; switches had descriptions; result links had
  format/size descriptions.
- The About overlay had an AX dialog title and an `UNDERSTOOD` button; Escape
  closed it and returned focus to `ABOUT`.
- At tested widths 320–1440 there was no horizontal overflow. At 320 px the
  filters, mode buttons, and controls remained inside the panel with usable
  widths. This corrects the historical mobile-collapse concern for the tested
  live revision.

## UX improvements

These are recommendations, not confirmed defects:

1. Reduce the visual height of the technical log or add a compact/expandable
   mode. At mobile widths the log and long control column create substantial
   vertical travel before results are visible.
2. Give `ANALYZING…` a bounded progress/error explanation and keep the final
   estimate state visually tied to the queue outcome. This overlaps confirmed
   `ONLINE-003`.
3. When two inputs have the same visible basename, show their source context or
   a collision warning. This overlaps confirmed `ONLINE-004`.
4. Make update prompts describe the state boundary explicitly: “An update is
   ready; your current queue/results are kept until you finish” or disable the
   destructive reload path while state is active.
5. Consider a first-run “Simple” default or a compact Advanced disclosure for
   users who only want a quick conversion. Advanced currently exposes many
   technical controls at once, even though the visual language remains clean.

## Accessibility boundaries

Observed semantic labeling and keyboard-adjacent behavior are positive signals,
not certification. This audit did not run a complete WCAG/AT matrix, screen
reader combination, 200% browser zoom reflow audit, color-contrast tool audit,
touch-device gestures, or reduced-motion certification. Those remain
Not verified.
