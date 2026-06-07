# Jelly Cursor

Jelly Cursor adds a jelly-like animated cursor to VS Code. The cursor follows Monaco's native cursor position, deforms while moving, supports movement glow, and mirrors the native cursor shape used by modes such as Vim block and line cursors.

## Features

- Smooth cursor motion
- Jelly deformation based on movement direction
- Optional movement glow
- Custom cursor and glow colors
- Tunable corner speed, deformation, alpha, and glow settings
- Native cursor shape mirroring for line and block cursor modes

## Important

Jelly Cursor uses an experimental DOM patch. VS Code extensions cannot normally access Monaco editor DOM from the stable extension API, so the install command patches VS Code's `workbench.html` and injects a small script.

Because of that:

- VS Code may show an "installation appears to be corrupt" warning.
- VS Code updates may remove the patch.
- Re-run the install command after VS Code updates.
- Use the uninstall command before reinstalling VS Code or if you want to remove the patch cleanly.

## Install The Patch

Open the command palette and run:

```text
Jelly Cursor: Install DOM Patch
```

Then fully restart VS Code.

## Uninstall The Patch

Open the command palette and run:

```text
Jelly Cursor: Uninstall DOM Patch
```

Then fully restart VS Code.

## Settings

Settings are read when the DOM patch is installed. After changing settings, run `Jelly Cursor: Install DOM Patch` again and restart VS Code.

```json
{
  "newNeovideCursor.cursorColor": "#ffffff",
  "newNeovideCursor.glowColor": "#ffffff",
  "newNeovideCursor.glowEnabled": true,
  "newNeovideCursor.glowOpacity": 0.9,
  "newNeovideCursor.glowIntensity": 1.8,
  "newNeovideCursor.glowSize": 18,
  "newNeovideCursor.fastSpeed": 0.42,
  "newNeovideCursor.midSpeed": 0.24,
  "newNeovideCursor.slowSpeed": 0.1,
  "newNeovideCursor.axisBias": 0.45,
  "newNeovideCursor.topEdgeBoost": 0.16,
  "newNeovideCursor.minAlpha": 0.03
}
```

### Motion Settings

- `newNeovideCursor.fastSpeed`: Speed for the corner closest to the movement direction.
- `newNeovideCursor.midSpeed`: Reserved side-corner tuning value for future refinements.
- `newNeovideCursor.slowSpeed`: Speed for the corner opposite the movement direction.
- `newNeovideCursor.axisBias`: Controls whether speed selection favors axis movement or diagonal movement.
- `newNeovideCursor.topEdgeBoost`: Adds extra speed to the top edge during mostly horizontal movement.
- `newNeovideCursor.minAlpha`: Minimum alpha while the native cursor is blinking.

### Glow Settings

- `newNeovideCursor.glowEnabled`: Enables or disables movement glow.
- `newNeovideCursor.glowColor`: Glow color. Use an empty string to follow the cursor color.
- `newNeovideCursor.glowOpacity`: Maximum glow opacity while moving.
- `newNeovideCursor.glowIntensity`: Brightness multiplier.
- `newNeovideCursor.glowSize`: Glow radius in pixels.

## Known Limitations

- This is not a stable VS Code API implementation.
- The patch is tied to VS Code's current workbench file layout.
- Multi-cursor rendering currently follows the visible Monaco cursor nodes but is optimized for the primary editing cursor.
- Settings are not live-reloaded inside the injected script.

## Development

```powershell
npm install
npm run compile
```

Run the extension in an Extension Development Host, execute the install command, and restart VS Code to test the injected cursor.
