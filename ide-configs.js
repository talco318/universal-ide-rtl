/**
 * Universal IDE RTL Configuration Registry
 * 
 * Each IDE has a different chat architecture:
 * - "css-patch": Chat runs in a separate webview with its own CSS file (e.g., Kiro)
 * - "js-inject": Chat is part of the main workbench DOM (e.g., Antigravity)
 * 
 * To add a new IDE, simply add a new entry to IDE_CONFIGS.
 */

const IDE_CONFIGS = {

  kiro: {
    name: 'Kiro',
    method: 'css-patch',
    detect: (appRoot) => appRoot.toLowerCase().includes('kiro'),
    // Path to the chat webview CSS file (relative to app root's parent)
    cssPath: 'app/extensions/kiro.kiro-agent/packages/continuedev/gui/dist/assets/index.css',
    // Alternative path via LOCALAPPDATA
    altCssPath: 'Programs/Kiro/resources/app/extensions/kiro.kiro-agent/packages/continuedev/gui/dist/assets/index.css',
    marker: 'START-UNIVERSAL-RTL'
  },

  antigravity: {
    name: 'Antigravity',
    method: 'js-inject',
    detect: (appRoot) => appRoot.toLowerCase().includes('antigravity'),
    marker: 'START-UNIVERSAL-RTL-JS'
  },

  cursor: {
    name: 'Cursor',
    method: 'js-inject',
    detect: (appRoot) => appRoot.toLowerCase().includes('cursor'),
    marker: 'START-UNIVERSAL-RTL-JS'
  },

  windsurf: {
    name: 'Windsurf',
    method: 'js-inject',
    detect: (appRoot) => appRoot.toLowerCase().includes('windsurf'),
    marker: 'START-UNIVERSAL-RTL-JS'
  },

  // VS Code with GitHub Copilot Chat (uses workbench.html injection like copilot-chat-rtl)
  vscode: {
    name: 'VS Code (Copilot Chat)',
    method: 'js-inject',
    detect: (appRoot) => {
      const lower = appRoot.toLowerCase();
      // VS Code but not Kiro/Antigravity/Cursor/Windsurf
      return (lower.includes('microsoft vs code') || lower.includes('code')) &&
             !lower.includes('kiro') &&
             !lower.includes('antigravity') &&
             !lower.includes('cursor') &&
             !lower.includes('windsurf');
    },
    marker: 'START-UNIVERSAL-RTL-JS'
  }
};

module.exports = { IDE_CONFIGS };
