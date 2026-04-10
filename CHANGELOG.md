# Changelog

## 2026-04-11

### Changed
- Polished drawing detail, request detail, admin users, notifications, and account-adjacent UI surfaces with cleaner spacing, lighter visual noise, and more consistent badge treatment.
- Reworked status badge color rendering to use deterministic inline tones so border and dot colors no longer fall back incorrectly in Tailwind-driven views.
- Standardized date-time formatting across key cards and activity surfaces to a more stable `day month year, HH:MM` presentation with cleaner timestamp slots.
- Refined the embedded PDF preview experience with a more compact mobile wrapper, SVG-based zoom and print controls, and a tighter internal toolbar treatment.
- Tuned dashboard and notification timeline chips so recent activity timestamps feel more consistent with drawing detail history cards.

## 2026-04-10

### Added
- Added a new self-service `Account Settings` page so users can review account details, update their email directly, manage an avatar image, and jump to password settings from one place.
- Added self-service account APIs and local avatar storage for profile email updates, avatar upload, avatar removal, and session refresh sync after profile changes.
- Added reusable user avatar rendering for account surfaces and header account controls.
- Added support for up to 3 reference images on `Request New Drawing`, including multi-file upload handling, storage, and request detail rendering.

### Changed
- Simplified the header user dropdown into a cleaner account entry point with identity context, `Account Settings`, and `Keluar`.
- Updated drawing request storage and request detail views to support multiple reference images while staying backward-compatible with earlier single-image requests.
- Polished sidebar behavior by hiding the temporary `Drawing Control Console` heading, moving menu descriptions into desktop tooltips, and adding mobile-friendly info toggles.
- Renamed the sidebar navigation label from `Drawing List` to `Drawing Library`.
- Compacted the `Drawing List` filter panel on mobile so search, status, drafter, area, revision, and date inputs feel denser and more consistent.
- Replaced the empty-state fallback text marker with the branded DrafTerra favicon-derived SVG icon.
- Refined the account `Profile Management` panel with a custom avatar picker, clearer preview and helper states, and more balanced email action layout.
- Softened the notifications inbox filter button outline treatment to avoid the overly bright border look on the graphite hero panel.

### Notes
- Account profile edits intentionally remain limited to avatar and email in v1; name, username, role, and account status are still read-only.
- The new drawing request multi-image support stores the first image path for legacy compatibility and the full image set for current request rendering.

## 2026-04-09

### Added
- Added a new `drawing_requests` workflow so non-drafter roles can request new drawings and track request status from submission to closure.
- Added requester-facing pages and APIs for `Request New Drawing`, request detail, and request timeline.
- Added Draft Leader review and Drafter assignment-response flows, including optional image reference uploads and role-specific request queues.

### Changed
- Updated the dashboard and navigation to expose `Drawing Requests` and the new request CTA/assignment entry points by role.
- Wired request acceptance to automatically create a draft drawing that appears in the Drafter `My Queue` flow.
- Extended notifications, audit logging, and validation to support the new drawing request lifecycle end-to-end.
- Updated the PRD and generated stakeholder documents so the new intake workflow is presented as an active capability instead of future scope.
- Replaced the legacy `DM` empty-state fallback marker with a branded SVG icon derived from the current DrafTerra favicon.

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
