# Test matrix

| ID | Scenario | Input / setup | Observed result | Status / evidence |
|---|---|---|---|---|
| PROV-001 | Establish deployed revision | Live HTML, GitHub Actions, deployment API | SHA `70a63f7`; run `34505605897` success; deployment `6376910130` | Pass · Online UI observed, Static source review |
| UI-001 | Desktop shell | Isolated IAB, 1280×720 and normal desktop | Cloud Dancer shell, three panels, no horizontal overflow, no console warn/error | Pass · Online UI observed |
| UI-002 | Responsive widths | 320, 390, 600, 860, 1180, 1440 CSS px | No horizontal overflow; controls remained within panel; filters usable at 320 | Pass · Online UI observed |
| UI-003 | About dialog | Open `ABOUT`, press Escape | AX dialog/title/button exposed; Escape closed and focus returned | Pass · Online UI observed |
| UI-004 | Visual reference | Live `/uk/` comparison | Same warm background, rounded white cards, dark/navy text, green accents, compact nav language | Pass with UX notes · Online UI observed |
| FUNC-001 | Demo default export | `demo.mp3`, default 16-bit/32 kHz/mono | 1/1 success; OGG/WAV/MP3 links; valid downloaded containers | Pass · Online browser audio/runtime measured, Downloaded production output inspected |
| FUNC-002 | Preview / A-B / stop | 1 s synthetic 440 Hz WAV | Metrics shown; preview started/stopped; A/B semantic label toggled | Partial · Online UI observed; signal parity Not verified |
| FUNC-003 | Low boundary | 1-bit, 8 kHz, mono | WAV header 8-bit/8 kHz/1ch; OGG/MP3 links valid | Pass · Online browser audio/runtime measured |
| FUNC-004 | High boundary | 16-bit, 48 kHz, mono | WAV header 16-bit/48 kHz/1ch; output completed | Pass · Online browser audio/runtime measured |
| FUNC-005 | Stereo output | Stereo asymmetric WAV, stereo mode | Log `Decoded 2ch → 2ch`; WAV header 2ch/48 kHz/16-bit | Pass · Online browser audio/runtime measured |
| FUNC-006 | Mixed invalid batch | 3 valid WAV + zero-byte/21-byte invalid files | 3 succeeded, 2 failed; processing continued per file | Pass with ONLINE-003 · Online UI observed |
| FUNC-007 | All-invalid batch | Empty + corrupt WAV | 0 succeeded, 2 failed; terminal summary correct; estimate remained ANALYZING | Pass with defect · Online UI observed |
| FUNC-008 | Long Unicode filename | 236-character Unicode filename, short filesystem path | 15.7 KB accepted and processed; output basename retained/truncated safely | Pass · Online UI observed |
| FUNC-009 | Same name/size collision | Two different 96,044-byte `same.wav` files, distinct hashes/timestamps | Only one queue item appeared | Fail · Online UI observed, Local reproduction |
| FUNC-010 | Cancel | 4 MB demo, cancel during DSP | `CANCELLED`; `0 success(es); 1 unfinished`; controls recovered | Pass · Online UI observed |
| FUNC-011 | Retry after cancel | Re-run cancelled demo queue | Retry processed to 1/1 success | Pass · Online UI observed |
| STATE-001 | Presets and simple tiers | Author/custom/save; Simple q0–q3 | Save/load restored custom 16-bit/32 kHz/0.5×; Simple labels/ranges updated | Pass · Online UI observed |
| STATE-002 | Share URL and reload | Copy-link state, author state, malformed hash | State restored after real reload; malformed hash did not expose NaN; clipboard payload not readable via bridge | Partial · Online UI observed, Not verified |
| PWA-001 | Offline reload | Controlled cached client, Network offline | Shell reloaded; demo loaded and processed offline | Pass · Browser fault injection, Online browser audio/runtime measured |
| PWA-002 | Waiting SW/update | Active + waiting SW in controlled client | Old shell persisted until controlled activation/reload; current shell then appeared | Finding ONLINE-002 · Browser fault injection |
| DEPLOY-001 | Asset MIME/magic | HEAD live HTML/CSS/JS/worker/manifest/encoder/audio | 200 and expected MIME for used paths; root `.mem` cached asset 200 | Pass · Static source review, Online UI observed |
| LOCAL-001 | Regression suite | `npm test` | Both regression scripts passed | Pass, local only · Local reproduction |

## Representative fixture set

All fixtures were synthetic and created outside the repository under
`D:\OGCruncher-online-audit-artifacts\2026-09-13`. The generator is
`scripts/create-online-audit-fixtures.cjs` and is intentionally untracked.

The set included silence, DC, 440 Hz sine, asymmetric stereo, impulse, quiet
sine, duplicate basenames, Unicode filename, long filename, empty file,
corrupt WAV, and a non-audio text file.
