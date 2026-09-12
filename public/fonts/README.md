# Local fonts

These variable fonts are loaded by `app/layout.tsx` through `next/font/local`.
Builds use these files directly and do not fetch fonts from Google.

Source: [Google Fonts, revision 5e35378e6bda803962ee6fd257e444a7d459660d](https://github.com/google/fonts/tree/5e35378e6bda803962ee6fd257e444a7d459660d/ofl).

- `Inter[opsz,wght].ttf`: `ofl/inter`, license in `inter-OFL.txt`.
- `Geist[wght].ttf`: `ofl/geist`, license in `geist-OFL.txt`.
- `GeistMono[wght].ttf`: `ofl/geistmono`, license in `geistmono-OFL.txt`.

All three fonts use the SIL Open Font License 1.1. Keep the corresponding license
files when redistributing or updating the fonts.

Server-side scoreboard PNG exports use `NotoSansCJKsc-Regular.otf`, bundled from
[Noto CJK revision f8d157532fbfaeda587e826d4cd5b21a49186f7c](https://github.com/notofonts/noto-cjk/tree/f8d157532fbfaeda587e826d4cd5b21a49186f7c/Sans/OTF/SimplifiedChinese).
Its SIL Open Font License is in `noto-sans-cjk-OFL.txt`. This font is read locally
by the Node.js export renderer; exporting names does not fetch remote fonts.
