# Universal IDE RTL Support 🌐

[![License](https://img.shields.io/github/license/talco318/universal-ide-rtl?style=flat-square&color=green)](LICENSE)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black?style=flat-square&logo=github)](https://github.com/talco318/universal-ide-rtl)

A unified extension that adds Right-to-Left (RTL) text support for **Hebrew** and **Arabic** across multiple AI-powered IDEs.

One extension. All IDEs. Zero hassle.


> [!IMPORTANT]
> **⚠️ Action Required After Installation / חובה לבצע לאחר ההתקנה! ⚠️**
>
> **English:** 
> After installing, the RTL support is **disabled by default**. You **must** manually activate it:
> 1. Click on **`RTL: OFF`** in the status bar (bottom-right corner) OR press **`Ctrl+Alt+R`** (Mac: `Cmd+Alt+R`) to toggle it.
> 2. Click **Restart Now** when prompted to reload the window.
>
> **עברית:**
> לאחר התקנת התוסף, התמיכה ב-RTL **כבויה כברירת מחדל**. **חובה** להפעיל אותה באופן ידני כדי שהיישור לימין יעבוד:
> 1. לחץ על כפתור **`RTL: OFF`** בשורת הסטטוס למטה מימין, או לחץ על קיצור המקלדת **`Ctrl+Alt+R`** כדי להפעיל.
> 2. לחץ על כפתור **Restart Now** בהודעה שתקפוץ כדי לטעון מחדש את חלון העורך ולהחיל את היישור!

---

## Supported IDEs

| IDE | Method | Status |
|-----|--------|--------|
| **Kiro** | CSS Patch (webview) | ✅ Tested |
| **Antigravity** | JS Injection (workbench) | ✅ Tested |
| **VS Code (Copilot Chat)** | JS Injection (workbench) | ✅ Tested |
| **Cursor** | JS Injection (workbench) | ✅ Tested |
| **Windsurf** | JS Injection (workbench) | 🧪 Experimental |

---

## Key Features

- 🌐 **Auto-Detection:** Automatically detects which IDE is running and applies the correct patching method.
- 🧠 **Smart Formatting:** RTL for Hebrew/Arabic text, LTR preserved for code blocks, buttons, and system UI.
- ⚡ **One-Click Toggle:** Enable/disable via Status Bar or Command Palette.
- 🔌 **Extensible:** Add new IDEs by simply adding an entry to `ide-configs.js`.
- 💾 **Safe:** Creates backups before patching, clean removal on disable.

---

## Usage

1. Install the extension in your IDE.
2. Click **RTL: OFF** in the Status Bar (bottom right) to enable.
3. Or use Command Palette: `RTL: Toggle Status`
4. Click **Restart Now** when prompted.

---

## Architecture

```
universal-rtl-extension/
├── extension.js      # Core engine - unified toggle logic
├── ide-configs.js    # IDE configuration registry (selectors, methods, paths)
├── package.json      # Extension manifest
└── README.md
```

### Adding a New IDE

Edit `ide-configs.js` and add a new entry:

```javascript
newIde: {
  name: 'New IDE',
  method: 'js-inject',  // or 'css-patch'
  detect: (appRoot) => appRoot.toLowerCase().includes('newide'),
  marker: 'START-UNIVERSAL-RTL-JS',
  script: `... your JS injection code ...`
}
```

---

## How It Works

The extension uses two patching strategies depending on the IDE architecture:

1. **CSS Patch** (Kiro): The chat runs in a separate webview with its own CSS file. The extension appends RTL rules directly to that CSS file.

2. **JS Injection** (Antigravity, Cursor, Windsurf): The chat is part of the main workbench DOM. The extension injects a MutationObserver script into `workbench.desktop.main.js` that dynamically detects RTL text and applies styles.

---

## Technical Notes

> [!WARNING]
> IDE updates may overwrite patched files. Simply run the toggle command again after an update.

- Kiro: Patches `extensions/kiro.kiro-agent/packages/continuedev/gui/dist/assets/index.css`
- Antigravity/Cursor/Windsurf: Patches `out/vs/workbench/workbench.desktop.main.js`

---

## License

MIT License - see [LICENSE](LICENSE) for details.

Developed with ❤️ by **talco**.
