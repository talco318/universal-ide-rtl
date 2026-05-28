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
	let success = false;

	try {
		if (isEnabled) {
			success = patcher.unpatch(ide);
			if (success) {
				context.globalState.update('rtlEnabled', false);
				updateStatusBar(false, ide.name);
				promptRestart(`${ide.name} RTL Support Disabled.`);
			}
		} else {
			success = patcher.patch(ide, extensionPath);
			if (success) {
				context.globalState.update('rtlEnabled', true);
				updateStatusBar(true, ide.name);
				promptRestart(`${ide.name} RTL Support Enabled!`);
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

	// Auto-repair logic: if state is enabled but files are not patched (e.g. after an IDE update)
	if (ide && !currentState) {
		const shouldBeEnabled = context.globalState.get('rtlEnabled', false);
		if (shouldBeEnabled) {
			console.log('[Universal RTL] Auto-repair: Patch was missing but state is enabled. Re-applying patch...');
			try {
				const success = patcher.patch(ide, context.extensionPath);
				if (success) {
					currentState = true;
					promptRestart('Universal RTL Support was automatically restored after update.');
				}
			} catch (err) {
				console.error('[Universal RTL] Auto-repair failed:', err);
			}
		}
	}

	updateStatusBar(currentState, ide?.name);

	let clearCmd = vscode.commands.registerCommand('universal-rtl.clearAllEditorRtl', () => {
		activeRtlFiles.clear();
		context.workspaceState.update('activeRtlFiles', []);
		updateEditorState();
		vscode.commands.executeCommand('markdown.preview.refresh');
		vscode.window.showInformationMessage('RTL: Cleared all stored editor/preview files.');
	});

	context.subscriptions.push(
		toggleCmd,
		toggleEditorCmd,
		clearCmd,
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
