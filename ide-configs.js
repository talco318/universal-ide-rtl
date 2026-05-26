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
    marker: 'START-UNIVERSAL-RTL',
    css: `
/* 1. Apply RTL to free text content only */
.kiro-chat-message-body > div:not([class*="agent-"]),
.kiro-chat-message-markdown p,
.kiro-chat-message-markdown ul,
.kiro-chat-message-markdown ol,
.kiro-chat-message-markdown h1,
.kiro-chat-message-markdown h2,
.kiro-chat-message-markdown h3,
.kiro-chat-message-markdown h4,
.kiro-chat-message-markdown h5,
.kiro-chat-message-markdown h6,
.kiro-focus-area {
  direction: rtl !important;
  text-align: right !important;
  unicode-bidi: plaintext !important;
}

/* 2. Fix code blocks - keep LTR */
.kiro-chat-message pre,
.kiro-chat-message code,
.kiro-code-preview,
pre code {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: plaintext !important;
  min-height: unset !important;
  display: block;
}

/* 3. Protect system UI elements - always LTR */
.agent-outcome-summary,
[class*="agent-outcome"],
[class*="step-container"],
.kiro-chat-message-body button {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: normal !important;
}

/* 4. Fix Hebrew lists padding */
.kiro-chat-message-markdown ul,
.kiro-chat-message-markdown ol {
  padding-right: 1.5em !important;
  padding-left: 0 !important;
}

/* 5. Inline code within sentences */
.kiro-chat-message-markdown p code,
.kiro-chat-message-markdown li code {
  direction: ltr !important;
  display: inline-block !important;
  min-height: unset !important;
  padding: 0 4px !important;
  unicode-bidi: plaintext !important;
}
`
  },

  antigravity: {
    name: 'Antigravity',
    method: 'js-inject',
    detect: (appRoot) => appRoot.toLowerCase().includes('antigravity'),
    marker: 'START-UNIVERSAL-RTL-JS',
    script: `
setTimeout(function() {
    function enforceRTL() {
        const textElements = document.querySelectorAll('#conversation p, #conversation li, #conversation span, .whitespace-pre-wrap');
        const rtlRegex = /[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;

        textElements.forEach(el => {
            if (rtlRegex.test(el.textContent) && !el.closest('pre') && !el.closest('code') && !el.closest('button')) {
                el.style.setProperty('direction', 'rtl', 'important');
                el.style.setProperty('text-align', 'right', 'important');
                el.style.setProperty('unicode-bidi', 'plaintext', 'important');
            }
        });

        document.querySelectorAll('#conversation ul, #conversation ol').forEach(list => {
            if (rtlRegex.test(list.textContent)) {
                list.style.setProperty('padding-right', '1.5em', 'important');
                list.style.setProperty('padding-left', '0', 'important');
            }
        });
    }

    enforceRTL();
    const observer = new MutationObserver(() => enforceRTL());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}, 3000);
`
  },

  cursor: {
    name: 'Cursor',
    method: 'js-inject',
    detect: (appRoot) => appRoot.toLowerCase().includes('cursor'),
    marker: 'START-UNIVERSAL-RTL-JS',
    script: `
setTimeout(function() {
    function enforceRTL() {
        const textElements = document.querySelectorAll('.chat-message p, .chat-message li, .chat-message span');
        const rtlRegex = /[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;

        textElements.forEach(el => {
            if (rtlRegex.test(el.textContent) && !el.closest('pre') && !el.closest('code') && !el.closest('button')) {
                el.style.setProperty('direction', 'rtl', 'important');
                el.style.setProperty('text-align', 'right', 'important');
                el.style.setProperty('unicode-bidi', 'plaintext', 'important');
            }
        });
    }

    enforceRTL();
    const observer = new MutationObserver(() => enforceRTL());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}, 3000);
`
  },

  windsurf: {
    name: 'Windsurf',
    method: 'js-inject',
    detect: (appRoot) => appRoot.toLowerCase().includes('windsurf'),
    marker: 'START-UNIVERSAL-RTL-JS',
    script: `
setTimeout(function() {
    function enforceRTL() {
        const textElements = document.querySelectorAll('.message-content p, .message-content li, .message-content span');
        const rtlRegex = /[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;

        textElements.forEach(el => {
            if (rtlRegex.test(el.textContent) && !el.closest('pre') && !el.closest('code') && !el.closest('button')) {
                el.style.setProperty('direction', 'rtl', 'important');
                el.style.setProperty('text-align', 'right', 'important');
                el.style.setProperty('unicode-bidi', 'plaintext', 'important');
            }
        });
    }

    enforceRTL();
    const observer = new MutationObserver(() => enforceRTL());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}, 3000);
`
  }
};

module.exports = { IDE_CONFIGS };
