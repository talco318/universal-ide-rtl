const vscode = require('vscode');
const { IDE_CONFIGS } = require('./ide-configs');
const patcher = require('./patcher');

let myStatusBarItem;

/**
 * Detects which IDE is currently running based on appRoot path.
 * @returns {object|null} The IDE config object or null if unknown
 */
function detectIDE() {
	const appRoot = vscode.env.appRoot;
	for (const [key, config] of Object.entries(IDE_CONFIGS)) {
		if (config.detect(appRoot)) {
			return { id: key, ...config };
		}
	}
	return null;
}

function checkIsEnabled(ide) {
	if (!ide) return false;
	return patcher.isPatched(ide);
}

function toggleRtl(extensionPath, context) {
	const ide = detectIDE();
	if (!ide) {
		vscode.window.showErrorMessage('RTL: Unknown IDE. Cannot detect environment.');
		return;
	}

	const isEnabled = checkIsEnabled(ide);
	let result = false;

	try {
		if (isEnabled) {
			result = patcher.unpatch(ide);
			if (result) {
				context.globalState.update('rtlEnabled', false);
				updateStatusBar(false, ide.name);
				const checksumInfo = result.checksumResult ? ` (Checksums: ${result.checksumResult.message})` : '';
				promptRestart(`${ide.name} RTL Support Disabled.${checksumInfo}`);
				if (result.checksumResult && !result.checksumResult.success) {
					vscode.window.showWarningMessage(`RTL: Checksum fix issue — ${result.checksumResult.message}. You may see an integrity warning.`);
				}
			}
		} else {
			result = patcher.patch(ide, extensionPath);
			if (result) {
				context.globalState.update('rtlEnabled', true);
				updateStatusBar(true, ide.name);
				const checksumInfo = result.checksumResult ? ` (Checksums: ${result.checksumResult.message})` : '';
				promptRestart(`${ide.name} RTL Support Enabled!${checksumInfo}`);
				if (result.checksumResult && !result.checksumResult.success) {
					vscode.window.showWarningMessage(`RTL: Checksum fix issue — ${result.checksumResult.message}. You may see an integrity warning.`);
				}
			}
		}
	} catch (err) {
		vscode.window.showErrorMessage(`RTL: Failed - ${err.message}`);
	}
}

function updateStatusBar(isEnabled, ideName) {
	if (isEnabled) {
		myStatusBarItem.text = `$(arrow-left) RTL: ON`;
		myStatusBarItem.tooltip = `${ideName || 'IDE'} RTL is Enabled. Click to disable.`;
		myStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
	} else {
		myStatusBarItem.text = `$(arrow-right) RTL: OFF`;
		myStatusBarItem.tooltip = `${ideName || 'IDE'} RTL is Disabled. Click to enable.`;
		myStatusBarItem.backgroundColor = undefined;
	}
	myStatusBarItem.show();
}

function promptRestart(message) {
	vscode.window.showInformationMessage(message + ' Please restart to apply.', 'Restart Now').then(selection => {
		if (selection === 'Restart Now') {
			vscode.commands.executeCommand('workbench.action.reloadWindow');
		}
	});
}

const activeRtlFiles = new Set();
let editorStateStatusBarItem;

function updateEditorState() {
	if (!editorStateStatusBarItem) return;
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const fsPath = activeEditor.document.uri.fsPath;
		const isRtl = activeRtlFiles.has(fsPath);
		editorStateStatusBarItem.text = `RTLSTATE:${isRtl ? 'ACTIVE' : 'INACTIVE'}`;
		console.log(`[Universal RTL Host] Active file: ${fsPath}, isRtl: ${isRtl}. All RTL files: ${JSON.stringify(Array.from(activeRtlFiles))}`);
	} else {
		editorStateStatusBarItem.text = 'RTLSTATE:INACTIVE';
		console.log('[Universal RTL Host] No active editor, setting INACTIVE');
	}
	editorStateStatusBarItem.show();
}

function activate(context) {
	console.log('[Universal RTL] Extension activated.');

	// Load stored RTL files (convert old URI strings to fsPath for backward compatibility)
	const storedFiles = context.workspaceState.get('activeRtlFiles', []);
	storedFiles.forEach(f => {
		if (f.startsWith('file://') || f.startsWith('vscode-')) {
			try {
				activeRtlFiles.add(vscode.Uri.parse(f).fsPath);
			} catch {
				activeRtlFiles.add(f);
			}
		} else {
			activeRtlFiles.add(f);
		}
	});
	
	let toggleCmd = vscode.commands.registerCommand('universal-rtl.toggle', () => {
		toggleRtl(context.extensionPath, context);
	});

	// Register editor toggle command
	let toggleEditorCmd = vscode.commands.registerCommand('universal-rtl.toggleEditorRtl', (uri) => {
		if (!uri) {
			uri = vscode.window.activeTextEditor?.document.uri;
		}
		if (!uri) {
			const activeTab = vscode.window.tabGroups?.activeTabGroup?.activeTab;
			if (activeTab && activeTab.input && activeTab.input.uri) {
				uri = activeTab.input.uri;
			}
		}
		if (!uri) {
			// Find any visible text editor that is a markdown file as a fallback
			const visibleMarkdownEditor = vscode.window.visibleTextEditors.find(
				e => e.document.languageId === 'markdown'
			);
			if (visibleMarkdownEditor) {
				uri = visibleMarkdownEditor.document.uri;
			}
		}

		if (!uri) {
			vscode.window.showWarningMessage('RTL: No active editor file found to toggle.');
			return;
		}

		const fsPath = uri.fsPath;
		if (activeRtlFiles.has(fsPath)) {
			activeRtlFiles.delete(fsPath);
			vscode.window.showInformationMessage('RTL: Disabled for this editor/preview.');
		} else {
			activeRtlFiles.add(fsPath);
			vscode.window.showInformationMessage('RTL: Enabled for this editor/preview.');
		}

		// Save state
		context.workspaceState.update('activeRtlFiles', Array.from(activeRtlFiles));

		// Update state
		updateEditorState();

		// Refresh markdown previews
		vscode.commands.executeCommand('markdown.preview.refresh');
	});

	myStatusBarItem = vscode.window.createStatusBarItem('universal-rtl-status', vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = 'universal-rtl.toggle';

	editorStateStatusBarItem = vscode.window.createStatusBarItem('universal-rtl-editor-state', vscode.StatusBarAlignment.Right, 99);
	editorStateStatusBarItem.tooltip = 'Universal RTL Editor State (Internal)';
	updateEditorState();

	const ide = detectIDE();
	let currentState = checkIsEnabled(ide);

	// Auto-repair and Extension Update logic:
	let repatchedOnUpdate = false;
	const currentVersion = context.extension.packageJSON.version;
	const lastVersion = context.globalState.get('extensionVersion');
	const shouldBeEnabled = context.globalState.get('rtlEnabled', false);

	if (ide && shouldBeEnabled && lastVersion !== currentVersion) {
		console.log(`[Universal RTL] Extension updated from ${lastVersion} to ${currentVersion}. Re-applying patch...`);
		try {
			patcher.unpatch(ide);
			const patchResult = patcher.patch(ide, context.extensionPath);
			if (patchResult) {
				currentState = true;
				repatchedOnUpdate = true;
				context.globalState.update('extensionVersion', currentVersion);
				const checksumMsg = patchResult.checksumResult ? ` ${patchResult.checksumResult.message}` : '';
				promptRestart(`Universal RTL Support was updated to version ${currentVersion}.${checksumMsg}`);
			}
		} catch (err) {
			console.error('[Universal RTL] Auto-repatch on update failed:', err);
		}
	} else {
		context.globalState.update('extensionVersion', currentVersion);
	}

	// If the patch is missing (e.g., after an IDE update) and we didn't just re-patch it due to an extension update
	if (ide && !currentState && !repatchedOnUpdate) {
		if (shouldBeEnabled) {
			console.log('[Universal RTL] Auto-repair: Patch was missing but state is enabled. Re-applying patch...');
			try {
				const patchResult = patcher.patch(ide, context.extensionPath);
				if (patchResult) {
					currentState = true;
					const checksumMsg = patchResult.checksumResult ? ` ${patchResult.checksumResult.message}` : '';
					promptRestart(`Universal RTL Support was automatically restored after update.${checksumMsg}`);
				}
			} catch (err) {
				console.error('[Universal RTL] Auto-repair failed:', err);
			}
		}
	}

	// Proactive checksum fix: always ensure checksums are in sync when RTL is enabled.
	// This catches cases where the patch exists but checksums were never updated
	// (e.g., upgraded from an older extension version that didn't fix checksums).
	if (ide && currentState && !repatchedOnUpdate) {
		try {
			const checksumResult = patcher.fixAllChecksums();
			if (checksumResult.updated > 0) {
				console.log(`[Universal RTL] Proactive checksum fix: ${checksumResult.message}`);
			}
		} catch (err) {
			console.error('[Universal RTL] Proactive checksum fix failed:', err);
		}
	}

	updateStatusBar(currentState, ide?.name);

	// 1-Click Onboarding Welcome Notification:
	// If the extension is freshly installed or RTL is not yet enabled, prompt user once with 1-click Enable & Reload
	const hasPromptedWelcome = context.globalState.get('hasPromptedWelcome', false);
	if (ide && !currentState && !hasPromptedWelcome) {
		context.globalState.update('hasPromptedWelcome', true);
		vscode.window.showInformationMessage(
			`🌐 Universal IDE RTL Support: Welcome! Enable Right-to-Left (Hebrew/Arabic) formatting for AI Chat & Git now?`,
			'Enable & Reload',
			'Later'
		).then(selection => {
			if (selection === 'Enable & Reload') {
				try {
					const patchResult = patcher.patch(ide, context.extensionPath);
					if (patchResult) {
						context.globalState.update('rtlEnabled', true);
						updateStatusBar(true, ide.name);
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				} catch (err) {
					vscode.window.showErrorMessage(`RTL: Failed to enable - ${err.message}`);
				}
			}
		});
	}

	let clearCmd = vscode.commands.registerCommand('universal-rtl.clearAllEditorRtl', () => {
		activeRtlFiles.clear();
		context.workspaceState.update('activeRtlFiles', []);
		updateEditorState();
		vscode.commands.executeCommand('markdown.preview.refresh');
		vscode.window.showInformationMessage('RTL: Cleared all stored editor/preview files.');
	});

	let fixChecksumsCmd = vscode.commands.registerCommand('universal-rtl.fixChecksums', () => {
		try {
			const result = patcher.fixAllChecksums();
			if (result.success) {
				if (result.updated > 0) {
					vscode.window.showInformationMessage(
						`RTL: Fixed ${result.updated} of ${result.total} checksum(s). Please restart to clear the integrity warning.`,
						'Restart Now'
					).then(selection => {
						if (selection === 'Restart Now') {
							vscode.commands.executeCommand('workbench.action.reloadWindow');
						}
					});
				} else {
					vscode.window.showInformationMessage(`RTL: All checksums are already up to date. ${result.message}`);
				}
			} else {
				vscode.window.showErrorMessage(`RTL: Failed to fix checksums — ${result.message}`);
			}
		} catch (err) {
			vscode.window.showErrorMessage(`RTL: Checksum fix error — ${err.message}`);
		}
	});

	let openReviewCmd = vscode.commands.registerCommand('universal-rtl.openReview', () => {
		vscode.env.openExternal(vscode.Uri.parse('https://open-vsx.org/extension/talco/universal-ide-rtl#review-details'));
	});

	context.subscriptions.push(
		toggleCmd,
		toggleEditorCmd,
		clearCmd,
		fixChecksumsCmd,
		openReviewCmd,
		myStatusBarItem,
		editorStateStatusBarItem,
		vscode.window.onDidChangeActiveTextEditor(() => updateEditorState()),
		vscode.workspace.onDidOpenTextDocument(() => updateEditorState())
	);

	// Return markdown-it contribution object with clean CSS wrapper for preview
	return {
		extendMarkdownIt(md) {
			const originalRender = md.renderer.render;
			md.renderer.render = function (tokens, options, env) {
				let html = originalRender.apply(this, arguments);
				const fsPath = (env && env.uri) ? env.uri.fsPath : '';
				const isRtl = fsPath && activeRtlFiles.has(fsPath);
				return `<div class="universal-markdown-body ${isRtl ? 'universal-md-rtl' : ''}">${html}</div>`;
			};
			return md;
		}
	};
}

function deactivate() { }

module.exports = { activate, deactivate };
