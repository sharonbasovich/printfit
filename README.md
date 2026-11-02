# PrintFit — experimental review build

A browser-local comparison of a planned arrangement and proposed test pieces. It checks nominal relative center positions and slot widths for named items, retains mismatches, identifies missing pair relationships, generates nominal repair plans, and requests a JSON download.

**This is not physical-fit validation.** It does not model insertion paths, handle envelopes, strength, stability, printer behavior or manufacturing tolerances. Pairwise coverage does not certify a whole assembly. All sample dimensions are synthetic. A spreadsheet can implement the same mathematics; no measured time or material savings are claimed.

No runtime dependencies, AI API, analytics, account integration or server-side project data. The optional CI capture uses pinned Playwright. Serve `dist/` as static files. Run `node test_browser_core.mjs`, `node test_review_browser_core.mjs`, and `node test_review_release.mjs` for the browser computation tests.

## Review scope
Desktop and narrow 406 CSS px layout, custom item/test creation, native edits, keyboard continuity, invalid-input retention, repair and export were reviewed. Rendering is paginated to 50 relationships and 3 evidence entries per cell; imports are bounded by 1 MB, 100 items per layout, 200 test pieces and 50,000 pair-test comparisons. Numeric coordinates are bounded to ±1,000,000 mm; slot widths positive through 1,000,000 mm.

JSON parser/roundtrip is tested. **Browser file import acceptance remains unverified** due the automation environment's native upload authorization boundary. The import feature is a review-build feature, not a validated delivery claim. No automated import permission is implied by this source. Export requests retain the unsaved-change guard until reset/close; confirm your file was saved.

AI assistance was used to develop and review code. No existing pre-event project code/assets were reused. PrintFit was submitted to the GenHacks Open track on November 2, 2026. Submission is not an award or a claim of comprehensive quality acceptance.

- [Submitted project](https://devpost.com/software/printfit)
- [Unlisted two-minute demo](https://youtu.be/zx4GFzzjp0Q)
- [Live app](https://sharonbasovich.github.io/printfit/)

The demo is intentionally silent and uses synthetic data. Sampled-frame visual review and playback completion were verified; uninterrupted perceptual motion review was not. Public/embed playback was not verified in the review environment. Browser import remains unverified as noted above.
