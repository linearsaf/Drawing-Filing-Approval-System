# Changelog

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
