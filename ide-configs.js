/**
 * Universal IDE RTL Configuration Registry
 * 
 * Each IDE has a different chat architecture:
 * - "css-patch": Chat runs in a separate webview with its own CSS file (e.g., Kiro)
 * - "js-inject": Chat is part of the main workbench DOM (e.g., Antigravity)
 * 
 * To add a new IDE, simply add a new entry to IDE_CONFIGS.
 */

const SHARED_JS_INJECTION = `
setTimeout(function() {
    function isRtlText(text) {
        if (!text) return false;
        const ltrRegex = /[a-zA-Z]/;
        const rtlRegex = /[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (rtlRegex.test(char)) return true;
            if (ltrRegex.test(char)) return false;
        }
        return false;
    }

    function enforceRTL() {
        const highLevelContainers = ['.interactive-session', '.chat-widget', '#workbench\\\\.panel\\\\chat'];
        const lowLevelContainers = ['#conversation', '.chat-message', '.message-content'];
        
        const highLevelTags = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'textarea', '[contenteditable="true"]', '.view-line', 'table'];
        const lowLevelTags = ['p', 'li', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'textarea', '[contenteditable="true"]', '.whitespace-pre-wrap', 'table'];
        
        const selectors = [];
        highLevelContainers.forEach(container => {
            highLevelTags.forEach(tag => {
                selectors.push(container + ' ' + tag);
            });
        });
        lowLevelContainers.forEach(container => {
            lowLevelTags.forEach(tag => {
                selectors.push(container + ' ' + tag);
            });
        });
        
        // Also allow matching the input containers themselves
        const inputContainers = ['.interactive-input-part', '.chat-input', '.chat-input-container'];
        inputContainers.forEach(container => {
            selectors.push(container + ' textarea');
            selectors.push(container + ' [contenteditable="true"]');
        });

        const textElements = document.querySelectorAll(selectors.join(', '));

        textElements.forEach(el => {
            // Avoid changing inside code blocks, pre, buttons, or outcome summaries
            if (el.closest('pre') || el.closest('code') || el.closest('button') || el.closest('.agent-outcome-summary')) {
                return;
            }

            const isInput = el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true' || el.classList.contains('view-line');
            const text = el.tagName === 'TEXTAREA' ? el.value : el.textContent;

            if (isRtlText(text)) {
                el.style.setProperty('direction', 'rtl', 'important');
                el.style.setProperty('text-align', 'right', 'important');
                if (el.tagName === 'TABLE') {
                    el.style.setProperty('margin-left', 'auto', 'important');
                    el.style.setProperty('margin-right', '0', 'important');
                }
                if (!isInput) {
                    el.style.setProperty('unicode-bidi', 'plaintext', 'important');
                }
            } else {
                // Explicitly set LTR for English elements to override any inherited RTL from parent containers
                el.style.setProperty('direction', 'ltr', 'important');
                el.style.setProperty('text-align', 'left', 'important');
                if (el.tagName === 'TABLE') {
                    el.style.setProperty('margin-right', 'auto', 'important');
                    el.style.setProperty('margin-left', '0', 'important');
                }
                if (!isInput) {
                    el.style.setProperty('unicode-bidi', 'plaintext', 'important');
                }
            }
        });

        // 2. Dynamically toggle RTL on input containers to keep cursor/layout aligned
        const inputParts = document.querySelectorAll(inputContainers.join(', '));
        inputParts.forEach(inputPart => {
            const text = inputPart.textContent || '';
            if (isRtlText(text)) {
                inputPart.style.setProperty('direction', 'rtl', 'important');
                inputPart.style.setProperty('text-align', 'right', 'important');
            } else {
                inputPart.style.setProperty('direction', 'ltr', 'important');
                inputPart.style.setProperty('text-align', 'left', 'important');
            }
        });

        // 3. Fix list padding for RTL lists
        const listSelectors = [];
        const chatContainers = [...highLevelContainers, ...lowLevelContainers];
        chatContainers.forEach(container => {
            listSelectors.push(container + ' ul');
            listSelectors.push(container + ' ol');
        });
        
        document.querySelectorAll(listSelectors.join(', ')).forEach(list => {
            if (isRtlText(list.textContent)) {
                list.style.setProperty('padding-right', '1.5em', 'important');
                list.style.setProperty('padding-left', '0', 'important');
            } else {
                list.style.setProperty('padding-left', '1.5em', 'important');
                list.style.setProperty('padding-right', '0', 'important');
            }
        });
    }

    enforceRTL();
    const observer = new MutationObserver(() => enforceRTL());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    // Also listen to input events on textareas/contenteditables for real-time RTL toggle while typing
    document.body.addEventListener('input', (e) => {
        if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.getAttribute('contenteditable') === 'true')) {
            enforceRTL();
        }
    });
}, 3000);
`;

const IDE_CONFIGS = {

  kiro: {
    name: 'Kiro',
    method: 'css-patch',
    detect: (appRoot) => appRoot.toLowerCase().includes('kiro'),
    // Path to the chat webview CSS file (relative to app root's parent)
    cssPath: 'app/extensions/kiro.kiro-agent/packages/kiro-ui-agent-chat/dist/style.css',
    // Alternative path via LOCALAPPDATA
    altCssPath: 'Programs/Kiro/resources/app/extensions/kiro.kiro-agent/packages/kiro-ui-agent-chat/dist/style.css',
    // Legacy paths for older Kiro versions
    legacyCssPaths: [
      'app/extensions/kiro.kiro-agent/packages/continuedev/gui/dist/assets/index.css',
      'Programs/Kiro/resources/app/extensions/kiro.kiro-agent/packages/continuedev/gui/dist/assets/index.css'
    ],
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
