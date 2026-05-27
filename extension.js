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

function toggleRtl(extensionPath) {
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
				updateStatusBar(false, ide.name);
				promptRestart(`${ide.name} RTL Support Disabled.`);
			}
		} else {
			success = patcher.patch(ide, extensionPath);
			if (success) {
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
		toggleRtl(context.extensionPath);
	});

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = 'universal-rtl.toggle';

	const ide = detectIDE();
	const currentState = checkIsEnabled(ide);
	updateStatusBar(currentState, ide?.name);

	context.subscriptions.push(toggleCmd, myStatusBarItem);
}

function deactivate() { }

module.exports = { activate, deactivate };
