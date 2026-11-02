# PrintFit — experimental review build

A browser-local comparison of a planned arrangement and proposed test pieces. It checks nominal relative center positions and slot widths for named items, retains mismatches, identifies missing pair relationships, generates nominal repair plans, and requests a JSON download.

**This is not physical-fit validation.** It does not model insertion paths, handle envelopes, strength, stability, printer behavior or manufacturing tolerances. Pairwise coverage does not certify a whole assembly. All sample dimensions are synthetic. A spreadsheet can implement the same mathematics; no measured time or material savings are claimed.

No runtime dependencies, AI API, analytics, account integration or server-side project data. The optional CI capture uses pinned Playwright. Serve `dist/` as static files. Run `node test_browser_core.mjs`, `node test_review_browser_core.mjs`, and `node test_review_release.mjs` for the browser computation tests.

## Review scope
Desktop and narrow406CSSpx layout, custom item/test creation, native edits, keyboard continuity, invalid-input retention, repair and export were reviewed. Rendering is paginated to50relationships and3evidence entries per cell; imports are bounded by1MB,100items perlayout,200testpieces and50,000pair-test comparisons. Numeric coordinates are bounded to±1,000,000mm; slot widths positive through1,000,000mm.

JSON parser/roundtrip is tested. **Browser file import acceptance remains unverified** due the automation environment's native upload authorization boundary. The import feature is a review-build feature, not a validated delivery claim. No automated import permission is implied by this source. Export requests retain the unsaved-change guard until reset/close; confirm your file was saved.

AI assistance was used to develop and review code. No existing pre-event project code/assets were reused. This is an experimental candidate for GenHacks Open track; registration is not a submission. A complete judged demo and final acceptance remain outstanding.
