# Changelog

All notable changes to the "Universal IDE RTL Support" extension will be documented in this file.

## [1.3.6] - 2026-09-14

### Fixed
- Fixed Kiro RTL support regression from v1.3.5 where CSS selectors were removed.
- Restored essential RTL CSS selectors for Kiro chat elements:
  - `.session-view-content` p/li/h1-h6 selectors
  - `.session-manager-content` selectors
  - `#root` fallback selectors
  - `.user-message-body` and `.agent-message` selectors
  - `.space-y-4` and `.kiro-streaming-text` selectors
  - Legacy `.kiro-chat-message-markdown` selectors
- Restored proper list padding, table alignment, and code block LTR protection.
- Restored system UI element protection (buttons, agent outcomes, etc.).

## [1.3.5] - 2026-09-08

### Added
- Full RTL support for **Kiro IDE** chat interface with new selectors:
  - `.user-message-body`, `.user-message-text` (user messages)
  - `.agent-message`, `.kiro-streaming-text` (agent responses)
  - `.space-y-4`, `.session-view-content` (content containers)
  - `li.py-1`, `span.font-semibold` (list items and bold text)
- Full RTL support for **Antigravity's latest version** chat interface.
- Added selectors for Antigravity-specific elements: `.leading-relaxed`, `.select-text`, `.flex.flex-col`, and padding-based containers.
- RTL support for blockquotes (border moved to right side for Hebrew/Arabic text).
- RTL support for headings (h1-h6) in both Kiro and Antigravity.

### Changed
- Renamed `kiro-rtl.css` to `chat-rtl.css` for better generic naming.
- Reorganized targetSelectors in JS with clear sections: Kiro, Cursor, VS Code, Antigravity.

### Fixed
- Fixed alignment issues in Kiro and Antigravity chat where Hebrew/Arabic text was not properly right-aligned.
- Fixed list padding direction in RTL lists.
- Ensured code blocks and inline code remain LTR inside chat bubbles.

## [1.3.3] - 2026-05-29

### Added
- Updated `README.md` to fully document the Markdown Editor and Preview RTL toggle button and usage instructions.

### Fixed
- Fixed `Ctrl+A` / `Cmd+A` keyboard shortcut inside rich text editors (like Lexical inside Antigravity's chat panel) which previously triggered VS Code's global "Select All" in the active main text editor instead of selecting the chat message.

## [1.3.2] - 2026-05-29

### Fixed
- Fixed browser caret (cursor) misalignment and jump issues inside rich contenteditable text inputs (such as the Lexical-based input box in Antigravity) when typing RTL text and trailing spaces.
- Resolved layout and symbol rendering bugs inside inline code elements (`code` and `pre` tags) inside chat bubbles by enforcing LTR formatting and isolation.

## [1.3.0] - 2026-05-28

### Added
- Added full RTL and cursor positioning support inside the **Cursor AI Chat Panel** (including composer, markdown responses, and typed human messages).
- Added RTL support for the **Cursor Workspace Sidebar** chat/agent titles.
- Introduced explicit LTR styling overrides (`direction: ltr !important`) for English/neutral text to prevent inheriting RTL direction from parent containers.

### Changed
- Implemented asynchronous execution debouncing using `requestAnimationFrame` inside the injection client to completely resolve UI lag and infinite layout loop freezes.

## [1.2.9] - 2026-05-28

### Added
- Added prominent manual activation warnings and instructions to `README.md` to guide users to toggle RTL ON and reload window after initial install.

## [1.2.8] - 2026-05-28

### Fixed
- Fixed Monaco Editor RTL cursor positioning inside the Antigravity chat input by using `activeElement` selector fallback and wrapping cursor adjustments in a `setTimeout` tick.
- Decoupled Monaco editor `.view-line` styling from the global editor active state class to allow independent RTL formatting inside sub-panels.

## [1.2.7] - 2026-05-28

### Fixed
- Fixed Monaco Editor caret (cursor) jumping/misalignment when pressing space in RTL text by dynamically recalculating caret visual offset based on the text bounding rect.

## [1.2.6] - 2026-05-28

### Fixed
- Fixed rightmost word truncation/cutoff under the minimap boundary by adding `box-sizing: border-box !important` to the view-lines stylesheet and increasing the minimap padding-right offset to `25px`.

## [1.2.5] - 2026-05-28

### Fixed
- Fixed right-aligned text being hidden/covered by the editor Minimap on the right by dynamically detecting minimap presence/width and applying padding-right to RTL `.view-line` elements.

## [1.2.4] - 2026-05-28

### Added
- Added `RTL: Clear All RTL Editor/Preview Files` command (`universal-rtl.clearAllEditorRtl`) to reset/clear all stored RTL files from workspaceState.

## [1.2.3] - 2026-05-28

### Fixed
- Fixed `Ctrl+A` / `Cmd+A` ("Select All") keyboard shortcut being swallowed inside chat inputs by adding a capturing-phase keyboard listener to manual trigger selection.

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
