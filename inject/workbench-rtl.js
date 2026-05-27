(function() {
    console.log('[Universal RTL] Workbench JS injection activated successfully.');

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
        const highLevelContainers = ['.interactive-session', '.chat-widget', '#workbench\\.panel\\.chat'];
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
        let styledCount = 0;
        let ltrCount = 0;

        textElements.forEach(el => {
            // Avoid changing inside code blocks, pre, buttons, or outcome summaries
            if (el.closest('pre') || el.closest('code') || el.closest('button') || el.closest('.agent-outcome-summary')) {
                return;
            }

            const isInput = el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true' || el.classList.contains('view-line');
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
                if (el.style.direction !== 'ltr') {
                    el.style.setProperty('direction', 'ltr', 'important');
                    el.style.setProperty('text-align', 'left', 'important');
                    if (el.tagName === 'TABLE') {
                        el.style.setProperty('margin-right', 'auto', 'important');
                        el.style.setProperty('margin-left', '0', 'important');
                    }
                    if (!isInput) {
                        el.style.setProperty('unicode-bidi', 'plaintext', 'important');
                    }
                    ltrCount++;
                }
            }
        });

        if (styledCount > 0 || ltrCount > 0) {
            console.log('[Universal RTL] Enforced text directions. RTL styled: ' + styledCount + ', LTR styled: ' + ltrCount);
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
                if (currentDir !== 'ltr') {
                    inputPart.style.setProperty('direction', 'ltr', 'important');
                    inputPart.style.setProperty('text-align', 'left', 'important');
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
                if (list.style.paddingLeft !== '1.5em') {
                    list.style.setProperty('padding-left', '1.5em', 'important');
                    list.style.setProperty('padding-right', '0', 'important');
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
        }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    // Also listen to input events on textareas/contenteditables for real-time RTL toggle while typing
    document.body.addEventListener('input', (e) => {
        if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.getAttribute('contenteditable') === 'true')) {
            enforceRTL();
        }
    });
})();
