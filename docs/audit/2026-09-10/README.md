# Professional website audit — OGCruncher

2026-09-10 · `master` · `fc0209cd27a3ffa7562955bac22cf272eb740f39`.
Initial working tree: clean.

## Assessment

Production build and bundled demo OGG/WAV/MP3 export succeeded in the tested browser.
The visual foundation already matches Figarist. The application should not yet be
presented as a reliable production audio workstation: state restoration, audio-path
parity, stereo balance and several numeric/UI claims fail inspection or probes.

Prioritize S01, A01–A04, U01, S05 and S09. No P0 outage was demonstrated. P1 denotes
major workflow/correctness/security risk, P2 a bounded defect and P3 polish/debt;
these are not CVSS or accessibility conformance ratings.

## Files

- [Bug register](BUGS.md): 24 grouped issues with evidence, reproduction and acceptance.
- [Audio and formulas](AUDIO_AND_FORMULAS.md).
- [UI/UX and visual alignment](UI_UX.md).
- [Verification record](VERIFICATION.md).
- [Prioritized backlog](../../../PROPOSALS.md).
- [Architecture/design](../../../DESIGN.md).

**Browser reproduced**: observed against the local production build in the in-app
Chromium browser. **Numerically reproduced**: checked-in JavaScript executed in Node
VM with synthetic data. **Static**: source-supported finding, browser reproduction
may remain pending. **Risk**: a plausible failure requiring the stated follow-up.
None implies human listening, cross-browser success or deployed-revision verification.

This baseline record remains historical. The subsequent implementation work and its
scoped evidence are tracked in [remediation status](../../remediation/IMPLEMENTATION_STATUS.md)
and [post-remediation verification](../../remediation/VERIFICATION.md). The requested
visual direction is recorded from the live [Figarist reference](https://figarist.github.io/uk/).
