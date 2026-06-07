# Change Log

All notable changes to Jelly Cursor are documented here.

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
