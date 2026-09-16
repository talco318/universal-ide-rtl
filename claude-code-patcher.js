const fs = require('fs');
const path = require('path');
const os = require('os');

const RTL_START_MARKER = '/* ===== START-UNIVERSAL-RTL-CLAUDE-CODE-CSS ===== */';
const RTL_END_MARKER = '/* ===== END-UNIVERSAL-RTL-CLAUDE-CODE-CSS ===== */';
const JS_START_MARKER = '/* ===== START-UNIVERSAL-RTL-CLAUDE-CODE-JS ===== */';
const JS_END_MARKER = '/* ===== END-UNIVERSAL-RTL-CLAUDE-CODE-JS ===== */';
const PLAN_CSS_START = '/* ===== START-UNIVERSAL-RTL-CLAUDE-PLAN-CSS ===== */';
const PLAN_CSS_END = '/* ===== END-UNIVERSAL-RTL-CLAUDE-PLAN-CSS ===== */';
const PLAN_JS_START = '/* ===== START-UNIVERSAL-RTL-CLAUDE-PLAN-JS ===== */';
const PLAN_JS_END = '/* ===== END-UNIVERSAL-RTL-CLAUDE-PLAN-JS ===== */';

const RTL_CLASS = 'universal-claude-rtl';

/**
 * High-performance, comprehensive CSS rules for Claude Code Webview.
 * Provides smart RTL alignment for Hebrew, Arabic & Persian while strictly
 * preserving Left-to-Right for code blocks, terminal outputs, thinking blocks, tools, and UI.
 */
const CLAUDE_CODE_CSS = `
${RTL_START_MARKER}
/* ==========================================================================
   Universal IDE RTL Support — Claude Code Webview Styling
   ========================================================================== */

/* Toggle Button in Claude Code header */
#universal-rtl-claude-btn {
    font-size: 14px;
    font-weight: bold;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
    color: var(--vscode-foreground, #cccccc);
    opacity: 0.6;
    transition: opacity 0.2s, background 0.2s;
    flex-shrink: 0;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

#universal-rtl-claude-btn:hover {
    opacity: 1;
    background: var(--vscode-toolbar-hoverBackground, rgba(128, 128, 128, 0.2));
}

#universal-rtl-claude-btn.active {
    opacity: 1;
    background: var(--vscode-button-background, #0e639c);
    color: var(--vscode-button-foreground, #ffffff);
}

/* User Messages */
.${RTL_CLASS}[class*="userMessage_"],
.${RTL_CLASS}[class*="userMessageContainer_"],
.${RTL_CLASS} [class*="userMessage_"],
.${RTL_CLASS} [class*="userMessageContainer_"] {
    direction: rtl !important;
    unicode-bidi: plaintext !important;
    text-align: right !important;
    align-items: flex-end !important;
    margin-left: auto !important;
    margin-right: 0 !important;
}

/* Claude Markdown Responses (Excluding Thinking Blocks) */
.${RTL_CLASS}[class*="root_"]:not([class*="thinkingContent_"] [class*="root_"]),
.${RTL_CLASS} [class*="root_"]:not([class*="thinkingContent_"] [class*="root_"]) {
    direction: rtl !important;
    unicode-bidi: plaintext !important;
    text-align: right !important;
}

.${RTL_CLASS} [class*="root_"]:not([class*="thinkingContent_"] [class*="root_"]) > :is(p, ul, ol, h1, h2, h3, h4, h5, h6, blockquote),
.${RTL_CLASS} [class*="root_"]:not([class*="thinkingContent_"] [class*="root_"]) > :is(ul, ol) li {
    text-align: right !important;
}

/* Lists and Blockquotes formatting in RTL */
.${RTL_CLASS} blockquote {
    border-left: none !important;
    border-right: 3px solid var(--vscode-textBlockQuote-border, #007acc) !important;
    padding-left: 0 !important;
    padding-right: 12px !important;
}

.${RTL_CLASS} ul,
.${RTL_CLASS} ol {
    padding-left: 0 !important;
    padding-right: 24px !important;
}

.${RTL_CLASS} th,
.${RTL_CLASS} td {
    text-align: right !important;
}

/* Prompt Input auto-detection */
[class*="messageInputContainer_"] > *,
[class*="otherInput_"] [contenteditable] {
    unicode-bidi: plaintext !important;
    text-align: start !important;
}

/* Question and Options blocks */
.${RTL_CLASS} [class*="questionBlock_"],
.${RTL_CLASS} [class*="questionHeader_"],
.${RTL_CLASS} [class*="answerText_"],
.${RTL_CLASS} [class*="optionText_"],
.${RTL_CLASS} [class*="optionContent_"] {
    direction: rtl !important;
    unicode-bidi: plaintext !important;
    text-align: right !important;
}

/* ==========================================================================
   STRICT LTR PROTECTION — Code Blocks, Terminal, Diff, Tools, UI
   ========================================================================== */

.${RTL_CLASS} pre,
.${RTL_CLASS} code,
.${RTL_CLASS} [class*="codeBlockWrapper_"],
.${RTL_CLASS} [class*="diffEditorWrapper_"],
pre,
code {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

/* Tool Execution Containers */
.${RTL_CLASS} [class*="toolUse_"],
.${RTL_CLASS} [class*="toolSummary_"],
.${RTL_CLASS} [class*="toolBody_"],
.${RTL_CLASS} [class*="toolResult_"],
.${RTL_CLASS} [class*="toolNameText_"],
.${RTL_CLASS} [class*="toolReference_"] {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

/* Claude Thinking Blocks */
.${RTL_CLASS} [class*="thinking_"],
.${RTL_CLASS} [class*="thinkingContent_"],
.${RTL_CLASS} [class*="thinkingContainer_"],
.${RTL_CLASS} [class*="thinkingHeader_"] {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

/* Buttons, Slash Commands, and System Badges */
.${RTL_CLASS} [class*="slashCommandMessage_"],
.${RTL_CLASS} [class*="slashCommandResultMessage_"],
.${RTL_CLASS} [class*="buttonContainer_"],
.${RTL_CLASS} [class*="keyboardHints_"],
.${RTL_CLASS} [class*="iconButton_"],
.${RTL_CLASS} [class*="copyButton_"],
.${RTL_CLASS} [class*="actionButton_"],
.${RTL_CLASS} [class*="dotSuccess_"],
.${RTL_CLASS} [class*="dotFailure_"],
.${RTL_CLASS} [class*="dotProgress_"] {
    direction: ltr !important;
}
${RTL_END_MARKER}
`;

/**
 * JavaScript injected into Claude Code webview.
 * Handles auto-detection of Hebrew/Arabic/Persian text and inserts manual toggle button.
 */
const CLAUDE_CODE_JS = `
${JS_START_MARKER}
(function() {
    var RTL_REGEX = /[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFE]/;
    var CLS = '${RTL_CLASS}';
    var BTN_ID = 'universal-rtl-claude-btn';
    var BUBBLE_SEL = '[class*="timelineMessage_"], [class*="userMessageContainer_"], [class*="userMessage_"]';

    function isRtlText(text) {
        return RTL_REGEX.test(text || '');
    }

    function processBubble(el) {
        if (!el || el.nodeType !== 1) return;
        if (el.classList.contains(CLS)) return;

        if (isRtlText(el.textContent)) {
            el.classList.add(CLS);
            return;
        }

        // Observe streaming responses inside bubble
        var obs = new MutationObserver(function() {
            if (isRtlText(el.textContent)) {
                el.classList.add(CLS);
                obs.disconnect();
            }
        });
        obs.observe(el, { childList: true, subtree: true, characterData: true });
    }

    function scanAllBubbles() {
        var bubbles = document.querySelectorAll(BUBBLE_SEL);
        for (var i = 0; i < bubbles.length; i++) {
            processBubble(bubbles[i]);
        }
    }

    function createToggleButton() {
        var btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.textContent = '\\u21C4';
        btn.title = 'Universal RTL: Toggle Claude Code RTL';

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var root = document.getElementById('root') || document.body;
            var isForced = root.classList.toggle('universal-rtl-forced');
            btn.classList.toggle('active', isForced);

            var bubbles = document.querySelectorAll(BUBBLE_SEL);
            bubbles.forEach(function(b) {
                if (isForced) {
                    b.classList.add(CLS);
                } else if (!isRtlText(b.textContent)) {
                    b.classList.remove(CLS);
                }
            });
        });

        return btn;
    }

    function insertToggleButton() {
        if (document.getElementById(BTN_ID)) return;

        var header = document.querySelector('[class*="header_"]');
        if (header) {
            header.appendChild(createToggleButton());
            return;
        }

        var input = document.querySelector('[class*="inputContainer_"]');
        if (input && input.parentNode) {
            var wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.justifyContent = 'flex-end';
            wrap.style.padding = '0 8px 4px 8px';
            wrap.appendChild(createToggleButton());
            input.parentNode.insertBefore(wrap, input);
        }
    }

    function init() {
        scanAllBubbles();
        insertToggleButton();

        var bodyObs = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var node = added[j];
                    if (node.nodeType !== 1) continue;
                    if (node.matches && node.matches(BUBBLE_SEL)) {
                        processBubble(node);
                    }
                    if (node.querySelectorAll) {
                        var children = node.querySelectorAll(BUBBLE_SEL);
                        for (var k = 0; k < children.length; k++) {
                            processBubble(children[k]);
                        }
                    }
                }
            }
            insertToggleButton();
        });

        bodyObs.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
${JS_END_MARKER}
`;

/** Plan Preview CSS injection for Claude Code extension.js */
const PLAN_PREVIEW_CSS = `
${PLAN_CSS_START}
#content.universal-claude-rtl {
    direction: rtl !important;
    text-align: right !important;
}
#content.universal-claude-rtl blockquote {
    border-left: none !important;
    border-right: 3px solid var(--vscode-textBlockQuote-border, #007acc) !important;
    padding-left: 0 !important;
    padding-right: 12px !important;
}
#content.universal-claude-rtl ul, #content.universal-claude-rtl ol {
    padding-left: 0 !important;
    padding-right: 32px !important;
}
#content.universal-claude-rtl th, #content.universal-claude-rtl td {
    text-align: right !important;
}
#content.universal-claude-rtl pre, #content.universal-claude-rtl code {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}
${PLAN_CSS_END}
`;

/**
 * Returns all potential directory paths where VS Code extensions are installed.
 */
function getExtensionSearchDirectories() {
    const searchDirs = [];
    const home = process.env.USERPROFILE || process.env.HOME || os.homedir();

    const ideFolders = [
        '.vscode',
        '.vscode-server',
        '.cursor',
        '.cursor-server',
        '.antigravity-ide',
        '.antigravity-ide-server',
        '.antigravity',
        '.antigravity-server',
        '.kiro',
        '.kiro-server'
    ];

    ideFolders.forEach(folder => {
        const extDir = path.join(home, folder, 'extensions');
        if (fs.existsSync(extDir)) {
            searchDirs.push(extDir);
        }
    });

    return searchDirs;
}

/**
 * Discovers all installed Claude Code extensions across all IDEs.
 */
function findClaudeCodeInstallations() {
    const installations = [];
    const searchDirs = getExtensionSearchDirectories();

    searchDirs.forEach(extDir => {
        try {
            const entries = fs.readdirSync(extDir);
            entries.forEach(entry => {
                if (entry.toLowerCase().startsWith('anthropic.claude-code')) {
                    const fullDirPath = path.join(extDir, entry);
                    const cssPath = path.join(fullDirPath, 'webview', 'index.css');
                    const jsPath = path.join(fullDirPath, 'webview', 'index.js');
                    const extJsPath = path.join(fullDirPath, 'extension.js');

                    if (fs.existsSync(cssPath)) {
                        installations.push({
                            dir: fullDirPath,
                            name: entry,
                            cssPath: cssPath,
                            jsPath: fs.existsSync(jsPath) ? jsPath : null,
                            extensionJsPath: fs.existsSync(extJsPath) ? extJsPath : null
                        });
                    }
                }
            });
        } catch (e) {
            // Ignore inaccessible directories
        }
    });

    return installations;
}

/**
 * Checks if a specific file contains the RTL patch.
 */
function isFilePatched(filePath, marker) {
    if (!filePath || !fs.existsSync(filePath)) return false;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes(marker);
    } catch {
        return false;
    }
}

/**
 * Checks overall status of Claude Code RTL patches.
 */
function checkStatus() {
    const installations = findClaudeCodeInstallations();
    const details = installations.map(inst => {
        return {
            name: inst.name,
            dir: inst.dir,
            cssPatched: isFilePatched(inst.cssPath, RTL_START_MARKER),
            jsPatched: inst.jsPath ? isFilePatched(inst.jsPath, JS_START_MARKER) : false
        };
    });

    const isFullyPatched = details.length > 0 && details.every(d => d.cssPatched);
    return {
        found: installations.length,
        isPatched: isFullyPatched,
        details: details
    };
}

/**
 * Safely writes content with backup.
 */
function injectIntoFile(filePath, contentToInject, startMarker, endMarker) {
    if (!filePath || !fs.existsSync(filePath)) return false;

    try {
        const backupPath = filePath + '.rtl-backup';
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(filePath, backupPath);
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Clean existing patch if present
        if (content.includes(startMarker)) {
            const startIdx = content.indexOf(startMarker);
            const endIdx = content.indexOf(endMarker) + endMarker.length;
            if (startIdx >= 0 && endIdx > startIdx) {
                content = content.substring(0, startIdx) + content.substring(endIdx);
            }
        }

        content += '\n' + contentToInject + '\n';
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (err) {
        console.error(`[Universal RTL] Failed to patch ${filePath}:`, err);
        return false;
    }
}

/**
 * Removes injected block and restores backup if possible.
 */
function removeFromFile(filePath, startMarker, endMarker) {
    if (!filePath || !fs.existsSync(filePath)) return false;

    const backupPath = filePath + '.rtl-backup';
    try {
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, filePath);
            fs.unlinkSync(backupPath);
            return true;
        }

        // Fallback: strip markers
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(startMarker)) {
            const startIdx = content.indexOf(startMarker);
            const endIdx = content.indexOf(endMarker) + endMarker.length;
            if (startIdx >= 0 && endIdx > startIdx) {
                content = content.substring(0, startIdx) + content.substring(endIdx);
                fs.writeFileSync(filePath, content, 'utf8');
                return true;
            }
        }
        return false;
    } catch (err) {
        console.error(`[Universal RTL] Failed to remove patch from ${filePath}:`, err);
        return false;
    }
}

/**
 * Patches all discovered Claude Code installations.
 */
function patchAll() {
    const installations = findClaudeCodeInstallations();
    if (installations.length === 0) {
        return { success: true, count: 0, message: 'No Claude Code extension installations found.' };
    }

    let patchedCount = 0;
    installations.forEach(inst => {
        let ok = injectIntoFile(inst.cssPath, CLAUDE_CODE_CSS, RTL_START_MARKER, RTL_END_MARKER);
        if (inst.jsPath) {
            injectIntoFile(inst.jsPath, CLAUDE_CODE_JS, JS_START_MARKER, JS_END_MARKER);
        }
        if (inst.extensionJsPath) {
            injectIntoFile(inst.extensionJsPath, PLAN_PREVIEW_CSS, PLAN_CSS_START, PLAN_CSS_END);
        }
        if (ok) patchedCount++;
    });

    return {
        success: patchedCount > 0,
        count: patchedCount,
        total: installations.length,
        message: `Successfully enabled RTL for ${patchedCount} Claude Code installation(s).`
    };
}

/**
 * Unpatches all discovered Claude Code installations.
 */
function unpatchAll() {
    const installations = findClaudeCodeInstallations();
    if (installations.length === 0) {
        return { success: true, count: 0, message: 'No Claude Code installations found.' };
    }

    let unpatchedCount = 0;
    installations.forEach(inst => {
        let ok = removeFromFile(inst.cssPath, RTL_START_MARKER, RTL_END_MARKER);
        if (inst.jsPath) {
            removeFromFile(inst.jsPath, JS_START_MARKER, JS_END_MARKER);
        }
        if (inst.extensionJsPath) {
            removeFromFile(inst.extensionJsPath, PLAN_CSS_START, PLAN_CSS_END);
        }
        if (ok) unpatchedCount++;
    });

    return {
        success: true,
        count: unpatchedCount,
        message: `Restored ${unpatchedCount} Claude Code installation(s) to original state.`
    };
}

module.exports = {
    findClaudeCodeInstallations,
    checkStatus,
    patchAll,
    unpatchAll
};
