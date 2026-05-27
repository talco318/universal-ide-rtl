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

function activate(context) {
	console.log('[Universal RTL] Extension activated.');
	
	let toggleCmd = vscode.commands.registerCommand('universal-rtl.toggle', () => {
		toggleRtl(context.extensionPath, context);
	});

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = 'universal-rtl.toggle';

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

	context.subscriptions.push(toggleCmd, myStatusBarItem);
}

function deactivate() { }

module.exports = { activate, deactivate };
