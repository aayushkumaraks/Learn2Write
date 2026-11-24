# Learn2Write

A completely offline, zero-backend React single-page application (SPA) for learning Japanese (**Hiragana**, **Katakana**, **Kanji**), **Thai**, and **Hindi Devanagari** stroke order on touch screens and desktop browsers, ready to host on GitHub Pages.

## Features

- **100% Offline Single-Page App:** All stroke datasets, styles, icons, and system font stacks are bundled locally with zero external runtime network requests. A build-generated Service Worker (`sw.js`) and Web App Manifest (`manifest.webmanifest`) precache the entire app shell so it reloads and runs seamlessly offline.
- **Offline User-Name Profiles & Browser User List:** On first load, if no local user is active, the app asks only for a **User name** (no password) as an offline identifier. Users can login or logout with only a name, see all local users using the app on the current browser (with active-tab indicators and practiced counts), and switch between local users with isolated progress.
- **Profile Page (Language-Wise & User-Wise Progress and Accuracy):** Logged-in users can open the **Profile** view to inspect overall completion, stroke-validation accuracy, per-language and per-script progress (Japanese Hiragana/Katakana/Kanji, Thai, Hindi Vowels/Consonants/Combine), and a user-wise comparison table across all local users on the browser.
- **Permanent Browser Storage for User Progress:** Per-user practiced characters, match counts, writing preferences, and last active character/script are persisted locally in both `localStorage` and `IndexedDB` (with `navigator.storage.persist()` requested on startup and cross-tab sync), keeping progress available indefinitely until the user clears browser data.
- **Multi-Script Stroke Datasets:** Complete charts for Japanese Hiragana (46), Katakana (46), Kanji (45), Thai Consonants (44), and Hindi Devanagari Vowels, Consonants, and Combinations (73).
- **Stroke-Order Guide Animation:** Animated stroke-by-stroke playback with moving directional brush indicator, numbered stroke order, speed toggle (`Normal` / `Slow`), replay, and per-stroke step buttons.
- **Practice Grid & Writing Instruments:** Switchable crosshair (`十字リーダー`), 4×4 quad grid, or blank paper, with **2B Pencil**, **Calligraphy Brush**, **Ballpoint Pen**, and **Felt Marker** presets.
- **Automatic Touch Screen Detection:** Detects touch capability (`ontouchstart`, `navigator.maxTouchPoints`, `(pointer: coarse)`) and binds native `touch*` event listeners on touch devices or `mouse*` listeners on mouse devices, with an optional manual toggle for hybrid devices.

## Local Development

```bash
npm install
npm run dev
```

## Testing & Build

```bash
npm test
npm run build
```

## Deploying to GitHub Pages

1. Push this repository to GitHub with `main` as the default branch.
2. In your GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) automatically runs tests, builds `./dist` with relative asset paths (`base: './'`) and an offline Service Worker (`./sw.js`), and deploys to GitHub Pages.

## Attribution

Japanese stroke order vector data is sourced from KanjiVG under the Creative Commons Attribution-Share Alike 3.0 license.
