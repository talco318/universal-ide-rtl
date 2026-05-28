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
    `;
    document.head.appendChild(styleEl);

    function shouldAlwaysEnableRtl(line) {
        if (!line) return false;

        // Check if inside chat/panel inputs or panels
        if (line.closest('.interactive-session') ||
            line.closest('.chat-widget') ||
            line.closest('#workbench\\.panel\\.chat') ||
            line.closest('.interactive-input-part') ||
            line.closest('.chat-input') ||
            line.closest('.chat-input-container') ||
            line.closest('.inline-chat') ||
            line.closest('.interactive-editor') ||
            line.closest('.quick-input-widget')) {
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

    function enforceRTL() {
        checkEditorRtlState();
        const highLevelContainers = ['.interactive-session', '.chat-widget', '#workbench\\.panel\\.chat'];
        const lowLevelContainers = ['#conversation', '.chat-message', '.message-content'];
        
        const highLevelTags = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'textarea', '[contenteditable="true"]', 'table'];
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
        let styledCount = 0;
        let ltrCount = 0;

        textElements.forEach(el => {
            // Avoid changing inside code blocks, pre, buttons, or outcome summaries
            if (el.closest('pre') || el.closest('code') || el.closest('button') || el.closest('.agent-outcome-summary')) {
                return;
            }

            const isInput = el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true';
            const text = el.tagName === 'TEXTAREA' ? el.value : el.textContent;

            if (isRtlText(text)) {
                if (el.style.direction !== 'rtl') {
                    el.style.setProperty('direction', 'rtl', 'important');
                    el.style.setProperty('text-align', 'right', 'important');
                    if (el.tagName === 'TABLE') {
                        el.style.setProperty('margin-left', 'auto', 'important');
                        el.style.setProperty('margin-right', '0', 'important');
                    }
                    if (!isInput) {
                        el.style.setProperty('unicode-bidi', 'plaintext', 'important');
                    }
                    styledCount++;
                }
            } else {
                if (el.style.direction === 'rtl') {
                    el.style.removeProperty('direction');
                    el.style.removeProperty('text-align');
                    if (el.tagName === 'TABLE') {
                        el.style.removeProperty('margin-left');
                        el.style.removeProperty('margin-right');
                    }
                    if (!isInput) {
                        el.style.removeProperty('unicode-bidi');
                    }
                    ltrCount++;
                }
            }
        });

        if (styledCount > 0 || ltrCount > 0) {
            console.log('[Universal RTL] Enforced text directions. RTL styled: ' + styledCount + ', LTR cleaned: ' + ltrCount);
        }

        // 2. Dynamically toggle RTL on input containers to keep cursor/layout aligned
        const inputParts = document.querySelectorAll(inputContainers.join(', '));
        inputParts.forEach(inputPart => {
            const text = inputPart.textContent || '';
            const isRtl = isRtlText(text);
            const currentDir = inputPart.style.direction;
            
            if (isRtl) {
                if (currentDir !== 'rtl') {
                    inputPart.style.setProperty('direction', 'rtl', 'important');
                    inputPart.style.setProperty('text-align', 'right', 'important');
                    console.log('[Universal RTL] Chat input container set to RTL:', inputPart);
                }
            } else {
                if (currentDir === 'rtl') {
                    inputPart.style.removeProperty('direction');
                    inputPart.style.removeProperty('text-align');
                    console.log('[Universal RTL] Chat input container set to LTR:', inputPart);
                }
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
                if (list.style.paddingRight !== '1.5em') {
                    list.style.setProperty('padding-right', '1.5em', 'important');
                    list.style.setProperty('padding-left', '0', 'important');
                    console.log('[Universal RTL] List padded to right for RTL:', list);
                }
            } else {
                if (list.style.paddingRight === '1.5em') {
                    list.style.removeProperty('padding-right');
                    list.style.removeProperty('padding-left');
                    console.log('[Universal RTL] List padded to left for LTR:', list);
                }
            }
        });
    }

    enforceRTL();
    const observer = new MutationObserver((mutations) => {
        let isRelevantMutation = false;
        for (let i = 0; i < mutations.length; i++) {
            if (mutations[i].addedNodes.length > 0 || mutations[i].type === 'characterData') {
                isRelevantMutation = true;
                break;
            }
        }
        if (isRelevantMutation) {
            enforceRTL();
            fixCursor();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    // Also listen to input events on textareas/contenteditables for real-time RTL toggle while typing
    document.body.addEventListener('input', (e) => {
        if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.getAttribute('contenteditable') === 'true')) {
            enforceRTL();
            fixCursor();
        }
    });

    // Fix Ctrl+A / Cmd+A selection inside chat input window when focus is captured
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
            const activeEl = document.activeElement;
            if (activeEl) {
                const isChatInput = activeEl.tagName === 'TEXTAREA' || 
                                    activeEl.getAttribute('contenteditable') === 'true' || 
                                    activeEl.closest('.interactive-input-part') || 
                                    activeEl.closest('.chat-input') || 
                                    activeEl.closest('.chat-input-container') ||
                                    activeEl.closest('.interactive-session');
                
                if (isChatInput) {
                    e.preventDefault();
                    if (typeof activeEl.select === 'function') {
                        activeEl.select();
                    } else {
                        const range = document.createRange();
                        range.selectNodeContents(activeEl);
                        const selection = window.getSelection();
                        if (selection) {
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            }
        }
    }, true);

    // Track caret movement and selection changes to instantly align Monaco caret position in RTL lines
    document.addEventListener('selectionchange', fixCursor);
})();
