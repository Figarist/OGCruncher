# Deployment and PWA audit

## Provenance

The live root returned `200 text/html; charset=utf-8`, `Last-Modified:
Thu, 10 Sep 2026 17:01:27 GMT`, and weak ETag `W/"6aa2e267-7ae4"`. It referenced
the current live bundle names:

- `/OGCruncher/assets/index-DeJNM5kz.js`
- `/OGCruncher/assets/index-DmnEQgsA.css`
- `/OGCruncher/assets/dsp.worker-1-VnHSTp.js`

GitHub API provenance matched those observations:

- Actions run `34505605897`, run number `93`, `master`, `head_sha`
  `70a63f7fff3e81d294612eb6870e2d3b0faf4b91`, completed/success;
- Pages deployment `6376910130`, environment `github-pages`, same SHA, created
  `2026-09-10T17:00:59Z`, updated `2026-09-10T17:01:32Z`;
- local repo is `HEAD 84da67a`, ahead of `origin/master` by two commits.

The exact deployed commit is therefore Verified as `70a63f7`; it is not
`84da67a`.

## Asset and MIME checks

Used live paths returned `200` with expected types:

| Path | Type observed |
|---|---|
| `/OGCruncher/` | `text/html; charset=utf-8` |
| `/OGCruncher/sw.js` | `application/javascript; charset=utf-8` |
| `/OGCruncher/manifest.webmanifest` | `application/manifest+json; charset=utf-8` |
| `/OGCruncher/assets/index-DeJNM5kz.js` | `application/javascript; charset=utf-8` |
| `/OGCruncher/assets/index-DmnEQgsA.css` | `text/css; charset=utf-8` |
| `/OGCruncher/assets/dsp.worker-1-VnHSTp.js` | `application/javascript; charset=utf-8` |
| `/OGCruncher/OggVorbisEncoder.min.js` | `application/javascript; charset=utf-8` |
| `/OGCruncher/OggVorbisEncoder.min.js.mem` | `application/octet-stream` |
| `/OGCruncher/demo.mp3` | `audio/mp3` |
| `/OGCruncher/images/logo.svg` | `image/svg+xml` |

The service worker precache listed the root encoder/`.mem`, demo, worker, HTML,
CSS, JS, logo, and manifest. The app’s processing path therefore had the
needed cached encoder assets in the tested profile.

The live HTML contained the manifest link twice; see `DEPLOY-001`.

## Service-worker behavior

Local configuration uses `registerType: 'prompt'`, `skipWaiting: false`, and
`clientsClaim: false`, with static assets cached by Workbox and no runtime
caching rules. That is a reasonable starting point for protecting in-memory
audio state, but the live controlled-client observation exposed the update
boundary:

- active OGCruncher controller and waiting OGCruncher worker coexisted;
- controlled `fetch('index.html')` returned the old shell;
- after isolated `SKIP_WAITING` plus reload, the current Cloud Dancer shell
  appeared;
- the queue/results are in-memory, so reload is not state-neutral.

This is the basis for `ONLINE-002`; no production worker was altered. The
activation was performed only in the isolated audit profile.

## Offline scenario

With the isolated tab’s network emulated offline:

1. reload succeeded from the cached application revision;
2. bundled demo loaded successfully;
3. demo processing completed 1/1 with OGG/WAV/MP3 result links.

This verifies the tested cached path, not every future revision or every
browser’s installability/offline semantics.

## Operational recommendation

Before authorized release, deploy the intended local HEAD or explicitly chosen
revision, verify the live hash/assets, then rerun the update scenario with an
active queue, preview, and result set. Do not infer deployment from a local
successful build alone.
