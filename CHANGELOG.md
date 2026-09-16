# Changelog

All notable changes to the "Universal IDE RTL Support" extension will be documented in this file.

## [1.4.0] - 2026-09-16

### Fixed
- **Claude Code Activation Fix**: Isolated Claude Code patching strictly to `webview/index.css` and `webview/index.js`. Completely avoided touching `extension.js`, ensuring Claude Code activates cleanly and `claude-vscode.editor.openLast` is always registered.
- **Claude Code User Bubble Alignment**: Fixed Right-to-Left alignment for `.userMessageContainer_...` using `align-self: flex-end !important`, `margin-left: auto !important`, and `text-align: right !important`, properly supporting nested `<div class="userMessage_..."><div class="content_..."><span dir="auto">` structures and repositioning the action button to avoid text collision.
- **Antigravity Checksums Verification**: Verified 100% integrity of all 11 files in Antigravity's `product.json` to guarantee safe and stable operation.

## [1.3.9] - 2026-09-16

### Added
- **Claude Code RTL & BiDi Support**: Added comprehensive Right-to-Left text support for the official "Claude Code for VS Code" (`anthropic.claude-code`) extension across all supported IDEs (VS Code, Cursor, Antigravity, Kiro)!
  - Smart auto-detection of Hebrew, Arabic, and Persian natural language text in both user prompts and assistant replies.
  - Strict Left-to-Right (LTR) protection for code blocks, diffs, terminal outputs, thinking containers, and tools.
  - Dedicated interactive `⇄` toggle button embedded directly into Claude Code's chat interface.
  - Support for Claude Code Plan Preview webview RTL alignment.
  - New dedicated commands: `RTL: Patch Claude Code Extension`, `RTL: Unpatch Claude Code Extension`, `RTL: Check Claude Code RTL Status`.
- **100% Backwards Compatibility & Safety**: All existing IDE architectures (Antigravity, Cursor, Windsurf, Kiro, VS Code) remain completely untouched and preserved.

## [1.3.8] - 2026-09-16

### Added
- **Viral Growth & Review Promoter**: Intelligent, non-intrusive prompter after active sessions to encourage 5-star Open VSX reviews and community sharing.
- **One-Click Share Command**: Added `universal-rtl.share` command (`RTL: Share Universal IDE RTL Extension`) that formats and copies a quick recommendation link to clipboard.
- **Open VSX Store Search & SEO Enhancement**: Fixed keyword encoding issues in extension tags and enriched indexing keywords (`ivrit`, `arabi`, `farsi`, `persian`, `bidi`, `hebrew-rtl`, `arabic-rtl`, `programming-languages`).
- **Real-Time Growth & Analytics Suite**: Added automated CLI analytics tracker (`npm run growth:stats`) and automated GitHub Actions workflow to monitor download velocity and rating milestones.

## [1.3.7] - 2026-09-15

### Added
- **1-Click Onboarding Welcome Notification**: Added quick-activation welcome prompt on installation with instant `Enable & Reload` action to eliminate onboarding friction.
- **Git Commit & Source Control RTL Support**: Added automatic Right-to-Left alignment for Hebrew and Arabic text in the Source Control (SCM) commit message box (`.scm-editor`, `.scm-view`, etc.).
- **Arabic Language Support & Localization**: Added full Arabic keywords to `package.json` and a dedicated Arabic quick-start section in `README.md`.
- **Before / After Visual Demo**: Added crisp Dark Mode comparison graphic (`media/before-after.png`) to showcase the RTL transformation in `README.md`.
- **Open VSX Review Command & Badges**: Added `universal-rtl.openReview` command to easily rate & review the extension on Open VSX, along with live download and rating badges.

### Fixed
- **Antigravity User Message Bubbles**: Fixed alignment bug in Antigravity where user input prompts (`.whitespace-pre-wrap` in `[class*="user-input-step"]` and `.bg-card`) were rendered left-aligned with reversed punctuation when mixing Hebrew and English text.
- Enhanced `shouldAlwaysEnableRtl` and `targetSelectors` to cover `.whitespace-pre-wrap` and SCM containers.

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
