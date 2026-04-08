# Changelog

## 2026-04-08

### Added
- Added `brand.config.json` as the shared brand manifest for runtime metadata, logos, tagline, and owner identity.
- Added reusable `BrandLogo` support for app surfaces that now consume the new `public/brand` assets.

### Changed
- Rebranded the product identity from `Datum Signet` to `DrafTerra` across runtime app surfaces, auth/email branding, and stakeholder-facing documentation.
- Switched runtime logo usage to the new `public/brand` asset set, including favicon, light-background wordmark, and dark-background wordmark.
- Updated the naming background document, DOCX generator, and executive presentation generator to align with the DrafTerra positioning and tagline.
- Refined the generated DOCX content with integrated logo philosophy, embedded logo preview, lighter legal closing copy, and revised annual business value assumptions based on field estimates.

### Notes
- `LinearSAF` remains the developer and owner attribution brand.
- `scripts/generate-datum-signet-executive-pptx.js` is treated as an internal helper and is now ignored by Git.

## 2026-04-07

### Added
- Added `Datum Signet` naming background reference in `docs/Latar Belakang Penamaan Sistem.md`.
- Added a global CSS module declaration in `global.d.ts` to fix TypeScript side-effect CSS import resolution.
- Added a new executive presentation generator in `scripts/generate-datum-signet-executive-pptx.js` for a clean management-facing PPTX deck.

### Changed
- Rebranded core user-facing app identity from the previous drawing-management naming to `Datum Signet` across metadata, auth config, login UI, app shell, and auth emails.
- Updated `README.md` and `docs/Drawing_Management_APP-PRD.md` to reflect the new product name and current positioning.
- Expanded PRD out-of-scope notes to include future support for user-submitted new drawing requests routed through Draft Leader to Drafter work queues.

### Notes
- Generated `.docx` and `.pptx` artifacts remain intentionally ignored by Git and are not included in this changelog commit.
