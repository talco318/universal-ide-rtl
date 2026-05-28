# Changelog

All notable changes to the "Universal IDE RTL Support" extension will be documented in this file.

## [1.2.2] - 2026-05-28

### Added
- Dynamic RTL support for the **Monaco Text Editor** (the Markdown editor itself) using status-bar state sharing with the injected workbench script.
- Automatic alignment (`dir="rtl"`) for active editor text lines (`.view-line`) containing Hebrew/Arabic.
- Added detailed console logging under `[Universal RTL]` to trace Host and Client communication.

### Fixed
- Fixed URL encoding percent-encoding mismatch (`%3A` vs `:`) by normalizing active file detection via canonical `fsPath` comparison.
- Resolved Markdown Preview Content Security Policy (CSP) blocking by replacing inline `<style>` and `<script>` tags with a clean wrapper `<div class="universal-markdown-body">` and contributing styles via `markdown.previewStyles`.
- Fixed command icon contribution in `package.json` to correctly map light/dark SVG files instead of invalid codicon syntax.
- Enabled toolbar button visibility on both the Markdown source editor and Markdown Preview tabs (`activeEditor == 'vscode.markdown.preview.editor'`).

## [1.1.4] - 2026-05-28

### Added
- Dynamic RTL/LTR language detection for chat bubbles.
- Support for table RTL alignment.
- Added keyboard shortcuts for quick toggling.
- Modular architecture with clean injection scripts.

## [1.1.2] - 2026-05-28

### Added
- Auto-Repair mechanism to automatically restore the RTL patch after IDE updates.
- Global keyboard shortcuts support.
