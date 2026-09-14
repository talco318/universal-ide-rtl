(function() {
    console.log('[Universal RTL] Workbench JS injection activated successfully.');

    // Inject global editor RTL CSS rules
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .view-line[dir="rtl"] {
            direction: rtl !important;
            text-align: right !important;
            box-sizing: border-box !important;
        }
        .view-line[dir="rtl"] * {
            unicode-bidi: plaintext !important;
        }
        
        /* Force LTR and isolation for code elements inside chat/composer/etc. */
        .interactive-session code, .interactive-session pre,
        .chat-widget code, .chat-widget pre,
        .chat-message code, .chat-message pre,
        .message-content code, .message-content pre,
        .composer-messages-container code, .composer-messages-container pre,
        .composer-bar code, .composer-bar pre,
        .ui-prompt-input-editor code, .ui-prompt-input-editor pre,
        #conversation code, #conversation pre,
        .inline-chat code, .inline-chat pre,
        .interactive-editor code, .interactive-editor pre,
        /* Antigravity code elements */
        .leading-relaxed code, .leading-relaxed pre,
        .select-text code, .select-text pre,
        .flex.flex-col code, .flex.flex-col pre {
            direction: ltr !important;
            text-align: left !important;
            unicode-bidi: isolate !important;
        }
        
        /* Inline code elements within sentences */
        .interactive-session p code, .interactive-session li code,
        .chat-widget p code, .chat-widget li code,
        .chat-message p code, .chat-message li code,
        .message-content p code, .message-content li code,
        .composer-messages-container p code, .composer-messages-container li code,
        #conversation p code, #conversation li code,
        .inline-chat p code, .inline-chat li code,
        .interactive-editor p code, .interactive-editor li code,
        /* Antigravity inline code */
        .leading-relaxed p code, .leading-relaxed li code,
        .select-text p code, .select-text li code {
            display: inline-block !important;
            padding: 0 4px !important;
        }

        /* Ensure multiline pre blocks remain block layout */
        .interactive-session pre, .chat-widget pre, .chat-message pre,
        .message-content pre, .composer-messages-container pre, .composer-bar pre,
        #conversation pre, .inline-chat pre, .interactive-editor pre,
        .leading-relaxed pre, .select-text pre {
            display: block !important;
        }
        
        /* Antigravity RTL blockquotes - border on right side */
        .leading-relaxed blockquote[style*="direction: rtl"],
        .select-text blockquote[style*="direction: rtl"] {
            border-left: none !important;
            border-right: 4px solid var(--vscode-textBlockQuote-border, rgba(128, 128, 128, 0.4)) !important;
        }
        
        /* Antigravity RTL lists padding */
        .leading-relaxed ul[style*="direction: rtl"],
        .leading-relaxed ol[style*="direction: rtl"],
        .select-text ul[style*="direction: rtl"],
        .select-text ol[style*="direction: rtl"] {
            padding-right: 1.5em !important;
            padding-left: 0 !important;
        }
    `;
    document.head.appendChild(styleEl);

    function shouldAlwaysEnableRtl(line) {
        if (!line) return false;

        // Check if inside chat/panel inputs or panels
        if (line.closest('.interactive-session') ||
            line.closest('.chat-widget') ||
            line.closest('#workbench\\.panel\\.chat') ||
            line.closest('[id^="workbench\\.panel\\.aichat"]') || // Cursor Chat Panel
            line.closest('.composer-bar') ||                     // Cursor Composer
            line.closest('.composer-messages-container') ||      // Cursor Messages
            line.closest('.ui-sidebar') ||                       // Cursor Sidebar
            line.closest('.agent-prompt-input-root') ||           // Cursor Input Root
            line.closest('.interactive-input-part') ||
            line.closest('.chat-input') ||
            line.closest('.chat-input-container') ||
            line.closest('.inline-chat') ||
            line.closest('.interactive-editor') ||
            line.closest('.quick-input-widget') ||
            // Kiro-specific containers
            line.closest('.session-view-content') ||
            line.closest('.session-manager-content') ||
            line.closest('.user-message') ||
            line.closest('.agent-message') ||
            line.closest('.kiro-streaming-text') ||
            line.closest('.space-y-4')) {
            return true;
        }

        // If it is NOT inside the main editor area (e.g. sidebar, auxiliary bar, panels)
        if (!line.closest('#workbench\\.parts\\.editor')) {
            return true;
        }

        return false;
    }

    function checkEditorRtlState() {
        const el = document.querySelector('[id*="universal-rtl-editor-state"]') || 
                   Array.from(document.querySelectorAll('.statusbar-item')).find(item => item.textContent.includes('RTLSTATE:'));
        
        let isMainEditorRtlActive = false;
        if (el) {
            const text = el.textContent || '';
            el.style.setProperty('display', 'none', 'important');
            const parent = el.closest('.statusbar-item');
            if (parent) {
                parent.style.setProperty('display', 'none', 'important');
            }
            if (text.includes('RTLSTATE:ACTIVE')) {
                isMainEditorRtlActive = true;
            }
        }

        // Apply/remove body class for debugging or custom styling
        if (isMainEditorRtlActive) {
            if (!document.body.classList.contains('universal-editor-rtl')) {
                document.body.classList.add('universal-editor-rtl');
                console.log('[Universal RTL Client] Editor RTL activated via status bar.');
            }
        } else {
            if (document.body.classList.contains('universal-editor-rtl')) {
                document.body.classList.remove('universal-editor-rtl');
                console.log('[Universal RTL Client] Editor RTL deactivated via status bar.');
            }
        }

        document.querySelectorAll('.view-line').forEach(line => {
            const text = line.textContent || '';
            const hasRtl = isRtlText(text);
            const alwaysEnable = shouldAlwaysEnableRtl(line);
            const applyRtl = hasRtl && (isMainEditorRtlActive || alwaysEnable);

            if (applyRtl) {
                if (line.getAttribute('dir') !== 'rtl') {
                    line.setAttribute('dir', 'rtl');
                }

                // Avoid overlapping with the Minimap on the right
                const overflowGuard = line.closest('.overflow-guard');
                const minimap = overflowGuard ? overflowGuard.querySelector('.minimap') : null;
                const minimapWidth = (minimap && minimap.offsetWidth > 0) ? minimap.offsetWidth : 0;
                const isMinimapOnLeft = minimap && (minimap.style.left === '0px' || minimap.classList.contains('left'));
                
                if (minimapWidth > 0 && !isMinimapOnLeft) {
                    // Offset the right-aligned text by the minimap width + extra margin
                    line.style.setProperty('padding-right', `${minimapWidth + 25}px`, 'important');
                } else {
                    line.style.removeProperty('padding-right');
                }
            } else {
                if (line.getAttribute('dir') === 'rtl') {
                    line.removeAttribute('dir');
                    line.style.removeProperty('padding-right');
                }
            }
        });
    }

    function fixCursor() {
        setTimeout(() => {
            let activeEditor = document.querySelector('.monaco-editor.focused');
            if (!activeEditor && document.activeElement) {
                activeEditor = document.activeElement.closest('.monaco-editor');
            }
            if (!activeEditor) {
                activeEditor = document.querySelector('.monaco-editor');
            }
            if (!activeEditor) return;
            
            const cursor = activeEditor.querySelector('.cursor');
            if (!cursor || cursor.offsetWidth === 0) return;
            
            const cursorTop = cursor.offsetTop;
            const viewLines = activeEditor.querySelectorAll('.view-line[dir="rtl"]');
            let activeLine = null;
            
            for (let i = 0; i < viewLines.length; i++) {
                if (Math.abs(viewLines[i].offsetTop - cursorTop) < 5) {
                    activeLine = viewLines[i];
                    break;
                }
            }
            
            if (!activeLine) return;
            
            const textSpan = activeLine.querySelector('span');
            if (!textSpan) return;
            
            const textRect = textSpan.getBoundingClientRect();
            const linesContent = activeEditor.querySelector('.lines-content');
            if (!linesContent) return;
            const editorRect = linesContent.getBoundingClientRect();
            
            const targetLeft = textRect.left - editorRect.left;
            
            const currentLeft = parseFloat(cursor.style.left);
            if (isNaN(currentLeft) || Math.abs(currentLeft - targetLeft) > 1) {
                cursor.style.setProperty('left', `${targetLeft}px`, 'important');
            }
        }, 0);
    }

    function isRtlText(text) {
        if (!text) return false;
        const ltrRegex = /[a-zA-Z]/;
        const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (rtlRegex.test(char)) return true;
            if (ltrRegex.test(char)) return false;
        }
        return false;
    }

    const targetSelectors = [
        // Rich text contenteditable containers (e.g. Lexical)
        '[contenteditable="true"]',
        '[contenteditable="true"] p',
        '[contenteditable="true"] span',
        
        // ===================
        // KIRO-specific selectors
        // ===================
        '.user-message-body p',
        '.user-message-body li',
        '.user-message-text p',
        '.user-message-text li',
        '.agent-message p',
        '.agent-message li',
        '.agent-message span.font-semibold',
        '.space-y-4 p',
        '.space-y-4 li',
        '.space-y-4 h1',
        '.space-y-4 h2',
        '.space-y-4 h3',
        '.space-y-4 h4',
        '.space-y-4 h5',
        '.space-y-4 h6',
        '.kiro-streaming-text p',
        '.kiro-streaming-text li',
        '.kiro-streaming-text h1',
        '.kiro-streaming-text h2',
        '.kiro-streaming-text h3',
        '.session-view-content p',
        '.session-view-content li',
        // Kiro list items with specific class
        'li.py-1',
        'li[class*="py-"]',
        
        // ===================
        // Cursor Chat elements
        // ===================
        '.composer-messages-container p',
        '.composer-messages-container span',
        '.composer-bar textarea',
        '.composer-bar [contenteditable="true"]',
        '.composer-bar p',
        '.markdown-root p',
        '.markdown-root li',
        '.markdown-root span',
        '.composer-human-message p',
        '.composer-human-message span',
        '.ui-prompt-input-editor [contenteditable="true"]',
        '.ui-prompt-input-editor p',
        '.ui-sidebar-menu-button-label',
        
        // ===================
        // Standard VS Code Chat elements
        // ===================
        '.interactive-session p',
        '.interactive-session li',
        '.interactive-session textarea',
        '.interactive-session [contenteditable="true"]',
        '.chat-widget p',
        '.chat-widget li',
        '.chat-widget textarea',
        '.chat-widget [contenteditable="true"]',
        '.chat-message p',
        '.chat-message li',
        '.chat-message span',
        '.message-content p',
        '.message-content li',
        '.message-content span',
        '#conversation p',
        '#conversation li',
        '#conversation span',
        '.interactive-input-part textarea',
        '.interactive-input-part [contenteditable="true"]',
        '.chat-input textarea',
        '.chat-input [contenteditable="true"]',
        '.chat-input-container textarea',
        '.chat-input-container [contenteditable="true"]',
        
        // ===================
        // Antigravity-specific selectors
        // ===================
        '.leading-relaxed p',
        '.leading-relaxed li',
        '.leading-relaxed h1',
        '.leading-relaxed h2',
        '.leading-relaxed h3',
        '.leading-relaxed h4',
        '.leading-relaxed h5',
        '.leading-relaxed h6',
        '.leading-relaxed blockquote',
        '.leading-relaxed blockquote p',
        '.select-text p',
        '.select-text li',
        '.select-text h1',
        '.select-text h2',
        '.select-text h3',
        '.select-text h4',
        '.select-text h5',
        '.select-text h6',
        '.select-text blockquote',
        '.select-text blockquote p',
        '.flex.flex-col p',
        '.flex.flex-col li',
        '.flex.flex-col h1',
        '.flex.flex-col h2',
        '.flex.flex-col h3',
        '[class*="px-"][class*="py-"] p',
        '[class*="px-"][class*="py-"] li',
        '[class*="px-"][class*="py-"] h1',
        '[class*="px-"][class*="py-"] h2',
        '[class*="px-"][class*="py-"] h3'
    ];

    const inputContainers = [
        '.interactive-input-part', 
        '.chat-input', 
        '.chat-input-container', 
        '.composer-bar',
        '.ui-prompt-input'
    ];

    function enforceRTL() {
        checkEditorRtlState();
        
        // 1. Process Monaco view-lines
        // Handled dynamically inside checkEditorRtlState

        // 2. Chat and text elements
        const textElements = document.querySelectorAll(targetSelectors.join(', '));
        textElements.forEach(el => {
            if (el.closest('pre') || el.closest('code') || el.closest('button') || el.closest('.agent-outcome-summary')) {
                return;
            }

            const isInput = el.tagName === 'TEXTAREA' || 
                            el.getAttribute('contenteditable') === 'true' ||
                            el.closest('[contenteditable="true"]');
            const text = el.tagName === 'TEXTAREA' ? el.value : el.textContent;

            if (isRtlText(text)) {
                const targetBidi = isInput ? 'normal' : 'plaintext';
                const currentDir = el.style.getPropertyValue('direction');
                const currentBidi = el.style.getPropertyValue('unicode-bidi');
                if (currentDir !== 'rtl' || currentBidi !== targetBidi) {
                    el.style.setProperty('direction', 'rtl', 'important');
                    el.style.setProperty('text-align', 'right', 'important');
                    if (el.tagName === 'TABLE') {
                        el.style.setProperty('margin-left', 'auto', 'important');
                        el.style.setProperty('margin-right', '0', 'important');
                    }
                    el.style.setProperty('unicode-bidi', targetBidi, 'important');
                }
            } else {
                // Prevent inheriting RTL from parents - force LTR for English/neutral text
                const targetBidi = isInput ? 'normal' : 'plaintext';
                const currentDir = el.style.getPropertyValue('direction');
                const currentBidi = el.style.getPropertyValue('unicode-bidi');
                if (currentDir !== 'ltr' || currentBidi !== targetBidi) {
                    el.style.setProperty('direction', 'ltr', 'important');
                    el.style.setProperty('text-align', 'left', 'important');
                    if (el.tagName === 'TABLE') {
                        el.style.setProperty('margin-right', 'auto', 'important');
                        el.style.setProperty('margin-left', '0', 'important');
                    }
                    el.style.setProperty('unicode-bidi', targetBidi, 'important');
                }
            }
        });

        // 3. Input containers alignment
        const inputParts = document.querySelectorAll(inputContainers.join(', '));
        inputParts.forEach(inputPart => {
            const text = inputPart.textContent || '';
            const isRtl = isRtlText(text);
            const currentDir = inputPart.style.direction;
            
            if (isRtl) {
                if (currentDir !== 'rtl') {
                    inputPart.style.setProperty('direction', 'rtl', 'important');
                    inputPart.style.setProperty('text-align', 'right', 'important');
                }
            } else {
                // Force LTR for English input container
                if (currentDir !== 'ltr') {
                    inputPart.style.setProperty('direction', 'ltr', 'important');
                    inputPart.style.setProperty('text-align', 'left', 'important');
                }
            }
        });

        // 4. Fix list padding for RTL lists (Kiro, Cursor, Standard, and Antigravity)
        const listSelectors = [];
        const chatContainers = ['.interactive-session', '.chat-widget', '#workbench\\.panel\\.chat', '.composer-messages-container', '.leading-relaxed', '.select-text', '.space-y-4', '.agent-message', '.user-message-body', '.kiro-streaming-text'];
        chatContainers.forEach(container => {
            listSelectors.push(container + ' ul');
            listSelectors.push(container + ' ol');
        });
        
        document.querySelectorAll(listSelectors.join(', ')).forEach(list => {
            if (isRtlText(list.textContent)) {
                if (list.style.paddingRight !== '1.5em') {
                    list.style.setProperty('padding-right', '1.5em', 'important');
                    list.style.setProperty('padding-left', '0', 'important');
                    list.style.setProperty('direction', 'rtl', 'important');
                }
            } else {
                if (list.style.paddingRight === '1.5em') {
                    list.style.removeProperty('padding-right');
                    list.style.removeProperty('padding-left');
                    list.style.removeProperty('direction');
                }
            }
        });

        // 5. Fix blockquotes for RTL (Kiro, Antigravity and others)
        document.querySelectorAll('.leading-relaxed blockquote, .select-text blockquote, .interactive-session blockquote, .chat-widget blockquote, .space-y-4 blockquote, .agent-message blockquote').forEach(bq => {
            if (isRtlText(bq.textContent)) {
                bq.style.setProperty('border-left', 'none', 'important');
                bq.style.setProperty('border-right', '4px solid var(--vscode-textBlockQuote-border, rgba(128, 128, 128, 0.4))', 'important');
                bq.style.setProperty('direction', 'rtl', 'important');
                bq.style.setProperty('text-align', 'right', 'important');
            } else {
                bq.style.removeProperty('border-right');
                bq.style.removeProperty('border-left');
                bq.style.removeProperty('direction');
                bq.style.removeProperty('text-align');
            }
        });

        // 6. Fix headings for RTL (Kiro and Antigravity)
        document.querySelectorAll('.leading-relaxed h1, .leading-relaxed h2, .leading-relaxed h3, .leading-relaxed h4, .leading-relaxed h5, .leading-relaxed h6, .select-text h1, .select-text h2, .select-text h3, .select-text h4, .select-text h5, .select-text h6, .space-y-4 h1, .space-y-4 h2, .space-y-4 h3, .space-y-4 h4, .space-y-4 h5, .space-y-4 h6, .agent-message h1, .agent-message h2, .agent-message h3').forEach(heading => {
            if (isRtlText(heading.textContent)) {
                heading.style.setProperty('direction', 'rtl', 'important');
                heading.style.setProperty('text-align', 'right', 'important');
            } else {
                heading.style.removeProperty('direction');
                heading.style.removeProperty('text-align');
            }
        });
    }

    // Performance scheduler (Debounce via requestAnimationFrame)
    let isPending = false;
    function scheduleRun() {
        if (isPending) return;
        isPending = true;
        requestAnimationFrame(() => {
            enforceRTL();
            fixCursor();
            isPending = false;
        });
    }

    // Run initially
    scheduleRun();

    // Setup Mutation Observer with performance scheduling
    if (window.universalRtlObserver) {
        window.universalRtlObserver.disconnect();
    }
    const observer = new MutationObserver(() => {
        scheduleRun();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.universalRtlObserver = observer;
    
    // Also listen to input events on textareas/contenteditables for real-time RTL toggle while typing
    document.body.addEventListener('input', (e) => {
        if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.getAttribute('contenteditable') === 'true')) {
            scheduleRun();
        }
    });

    // Fix Ctrl+A / Cmd+A selection inside chat input window when focus is captured
    document.addEventListener('keydown', (e) => {
        const isCtrlA = (e.ctrlKey || e.metaKey) && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A' || e.key === 'ש');
        if (isCtrlA) {
            const activeEl = document.activeElement;
            if (activeEl) {
                const isChatInput = activeEl.tagName === 'TEXTAREA' || 
                                    activeEl.tagName === 'INPUT' ||
                                    activeEl.getAttribute('contenteditable') === 'true' || 
                                    activeEl.closest('[contenteditable="true"]') ||
                                    activeEl.closest('.interactive-input-part') || 
                                    activeEl.closest('.chat-input') || 
                                    activeEl.closest('.chat-input-container') ||
                                    activeEl.closest('.interactive-session') ||
                                    activeEl.closest('.composer-bar') ||
                                    activeEl.closest('.ui-prompt-input');
                
                if (isChatInput) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const targetEl = activeEl.closest('[contenteditable="true"]') || activeEl;
                    if (typeof targetEl.select === 'function') {
                        targetEl.select();
                    } else {
                        const selection = window.getSelection();
                        if (selection) {
                            selection.removeAllRanges();
                            
                            const text = targetEl.textContent || '';
                            const isRtl = isRtlText(text);
                            
                            if (isRtl) {
                                selection.setBaseAndExtent(targetEl, 0, targetEl, targetEl.childNodes.length);
                            } else {
                                const range = document.createRange();
                                range.selectNodeContents(targetEl);
                                selection.addRange(range);
                            }
                        }
                    }
                }
            }
        }
    }, true);

    // Track caret movement and selection changes to instantly align Monaco caret position in RTL lines
    document.addEventListener('selectionchange', () => {
        scheduleRun();
    });
})();
