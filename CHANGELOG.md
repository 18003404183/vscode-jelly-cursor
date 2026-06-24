# Change Log

All notable changes to Jelly Cursor are documented here.

## [0.0.6] - 2026-06-24

- Preserve the last visible cursor shape as the animation origin when jumping to lines outside the rendered viewport.
- Improved horizontal and vertical jelly motion with stronger diagonal twist so all four corners can move at distinct speeds.
- Kept convex shape protection while tuning the full-direction corner speed model to avoid self-crossing cursor polygons.

## [0.0.5] - 2026-06-08

- Reworked jelly deformation to behave consistently in every movement direction.
- Replaced the one-sided `topEdgeBoost` tuning with directional `twistBoost`.
- Added convex shape protection to prevent the cursor polygon from crossing into a funnel-like shape.
- Kept compatibility with the legacy `topEdgeBoost` setting when reading configuration.

## [0.0.4] - 2026-06-07

- Moved cursor rendering to a global overlay so the primary cursor can animate across split editor panes.
- Improved active-editor cursor ordering for smoother transitions between editor groups.
- Kept multi-cursor rendering while allowing cross-pane primary cursor movement.

## [0.0.3] - 2026-06-07

- Improved multi-cursor rendering by maintaining separate jelly cursor shapes per Monaco cursor.
- Improved split editor behavior by isolating cursor state per editor instance.
- Hide stale cursor shapes when editors are hidden, switched, or cursor nodes disappear.

## [0.0.2] - 2026-06-07

- Renamed settings from `newNeovideCursor.*` to `jellyCursor.*`.
- Renamed command IDs to `jellyCursor.installDomPatch` and `jellyCursor.uninstallDomPatch`.
- Added compatibility reads for legacy `newNeovideCursor.*` settings.
- Added first-install backup for `workbench.html`.
- Updated the injected script name and DOM patch markers to Jelly Cursor branding.
- Added Chinese documentation.

## [0.0.1] - 2026-06-07

- Initial experimental release.
- Added DOM patch installer and uninstaller commands.
- Added jelly-like cursor deformation based on movement direction.
- Added movement glow with configurable color, size, opacity, and intensity.
- Added cursor color configuration.
- Added native cursor shape mirroring for line and block cursor modes.
