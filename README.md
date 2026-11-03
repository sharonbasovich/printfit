# PrintFit — experimental review build

A browser-local comparison of a planned arrangement and proposed test pieces. It checks nominal relative center positions and slot widths for named items, retains mismatches, identifies missing pair relationships, generates nominal repair plans, and requests a JSON download. Relationship filters isolate missing representation or mismatched tests without changing overall coverage. Each visible mismatch has an Inspect dimensions action that shows intended versus test values and returns keyboard focus to the findings.

**This is not physical-fit validation.** It does not model insertion paths, handle envelopes, strength, stability, printer behavior or manufacturing tolerances. Pairwise coverage does not certify a whole assembly. All sample dimensions are synthetic. A spreadsheet can implement the same mathematics; no measured time or material savings are claimed.

No runtime dependencies, AI API, analytics, account integration or server-side project data. The optional CI capture uses pinned Playwright. Serve `dist/` as static files. Run `node test_browser_core.mjs`, `node test_review_browser_core.mjs`, and `node test_review_release.mjs` and `node test_review_navigation.mjs` for the browser computation and diagnostic tests.

## Review scope
Desktop and narrow 406 CSS px layout, custom item/test creation, native edits, keyboard continuity, invalid-input retention, repair and export were reviewed. Rendering is paginated to 50 relationships and 3 evidence entries per cell; imports are bounded by 1 MB, 100 items per layout, 200 test pieces and 50,000 pair-test comparisons. Numeric coordinates are bounded to ±1,000,000 mm; slot widths positive through 1,000,000 mm.

JSON parser/roundtrip is tested. **Browser file import acceptance remains unverified** due the automation environment's native upload authorization boundary. The import feature is a review-build feature, not a validated delivery claim. No automated import permission is implied by this source. Export requests retain the unsaved-change guard until reset/close; confirm your file was saved.

AI assistance was used to develop and review code. No existing pre-event project code/assets were reused. PrintFit was submitted to the GenHacks Open track on November 2, 2026. Submission is not an award or a claim of comprehensive quality acceptance.

- [Submitted project](https://devpost.com/software/printfit)
- [Unlisted two-minute demo](https://youtu.be/zx4GFzzjp0Q)
- [Live app](https://sharonbasovich.github.io/printfit/)

The demo is intentionally silent and uses synthetic data. Sampled-frame visual review and playback completion were verified; uninterrupted perceptual motion review was not. Public/embed playback was not verified in the review environment. Browser import remains unverified as noted above.


## Actionable findings review (November 3, 2026)

The three original Node suites and 15 additional diagnostic assertions passed. Independent code review checked 29 varied-size and special-label cases without mutating project data. GitHub Chromium checks cover seven scenario groups: filtered correction and safe return, keyboard/empty filter, selector/missing-plan state, special labels, invalid-edit retention, 390px layout, and cancelled/accepted reset. Actual desktop browser interaction and pixels were independently reviewed. Native import, physical device and screen-reader testing remain unverified.

The inspection panel compares nominal relative spacing and both slot widths. It does not automatically alter any dimension, and a corrected comparison is not a physical-fit result.

### Retire obsolete tests
Select a test piece and choose **Remove selected test**. Confirmation explains that its evidence will no longer count: removing a sole representative can reduce coverage. **Undo last removal** restores the exact previous project, test order and inspection context until the next successful project change. Repeated removals retain only the most recent undo. Export the project to keep changes; this is not autosave or a physical-fit certification.

Browser regression additionally covers cancellation/focus, sole-representative removal, redundant mismatch retirement, exact Undo, edit invalidation, empty test sets, repeated removal and narrow keyboard interaction.
