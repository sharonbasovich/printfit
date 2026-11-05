# Ordered import review — November 5, 2026

Base source: dca6f6be0bc7c457062a7bdd4c69a487514bfbe2. Remote main was rechecked before editing; no open PR was present. GenHacks rules were rechecked: submissions run November 1, 2026 at midnight Eastern through December 26 at midnight Eastern. The submitted project entry, film and existing release history were not edited.

## Reproduction and implementation

The final deterministic harness fails five of its 11 scenario groups against the original app module: ordering, invalid later requests, declined later replacement, accepted Reset and obsolete error/cleanup ownership. It passes all 11 against the candidate.

Only a nonempty selection or accepted Reset advances import generation. After the asynchronous read, obsolete results return before parsing, confirmation or mutation. Obsolete catch/finally cannot replace status or clear a newer selection. Valid current requests retain atomic validation and current dirty-state confirmation. Declined/invalid imports preserve the project and removal Undo. A completed owning request clears its input so a same-file selection can be handled again.

Ordinary edits, remove/Undo, planning and creation keep their prior behavior. Cancelled/empty picker and declined Reset do not supersede reads. No new runtime dependencies, geometry claims or physical-fit validation were introduced.

## Verification

- All existing Node suites and the new 11-group import suite pass; the retained repair suite covers eight capacity groups.
- Existing rendered inspection, correction, navigation, remove/Undo, empty-test and capacity suites pass.
- Delayed synthetic browser reads pass at 1280, 390 and 320 CSS pixels, including repeated resets, dirty replacement decisions, stale errors/status, input ownership, empty/cancel events, same-file handler repetition, keyboard inspection, reduced motion and downloaded JSON preservation.
- Read-only independent code review found no blocking source defects and separately ran all Node suites.
- The 320px rendered review exposed existing grid overflow. Mobile editor columns now fit their container; fixed table layout applies only to dimension editors. Inspection and findings retain their scroll containers.

## Verification limits

The browser harness uses synthetic File objects and controlled reads. Native file-chooser acceptance remains unverified. These tests do not establish native chooser behavior.

Physical devices, screen readers and physical fit remain unverified. Browser evidence is synthetic. Export tests inspect downloaded JSON from the automated test browser; they do not establish that the owner saved a native-browser download.
