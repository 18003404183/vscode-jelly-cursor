# Releases

This folder stores locally packaged VSIX files for Jelly Cursor releases.

Marketplace uploads use files named like:

```text
jelly-cursor-0.0.2.vsix
```

To create a new package:

```powershell
npx @vscode/vsce package --out releases/jelly-cursor-<version>.vsix
```

VSIX files are ignored by git by default. Upload them to the VS Code Marketplace or attach them to GitHub Releases when needed.
