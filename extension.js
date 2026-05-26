const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { IDE_CONFIGS } = require('./ide-configs');

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
	// Fallback: try generic VS Code-based detection
	return null;
}

// ============================================================
// CSS PATCH METHOD (for webview-based chats like Kiro)
// ============================================================

function getCssFilePath(config) {
	const appRoot = vscode.env.appRoot;

	// Try relative to appRoot
	const cssPath = path.join(path.dirname(appRoot), config.cssPath);
	if (fs.existsSync(cssPath)) return cssPath;

	// Try via LOCALAPPDATA
	if (config.altCssPath) {
		const localAppData = process.env.LOCALAPPDATA || '';
		const altPath = path.join(localAppData, config.altCssPath);
		if (fs.existsSync(altPath)) return altPath;
	}

	return null;
}

function isCssPatched(config) {
	const cssPath = getCssFilePath(config);
	if (!cssPath) return false;
	try {
		const content = fs.readFileSync(cssPath, 'utf8');
		return content.includes(config.marker);
	} catch { return false; }
}

function enableCssPatch(config) {
	const cssPath = getCssFilePath(config);
	if (!cssPath) {
		vscode.window.showErrorMessage(`RTL: ${config.name} CSS file not found.`);
		return false;
	}

	try {
		// Backup
		const backupPath = cssPath + '.rtl-backup';
		if (!fs.existsSync(backupPath)) {
			fs.copyFileSync(cssPath, backupPath);
		}

		let content = fs.readFileSync(cssPath, 'utf8');

		// Remove old patch if exists
		if (content.includes(config.marker)) {
			const markerEnd = config.marker.replace('START', 'END');
			const startTag = `/* ===== ${config.marker} ===== */`;
			const endTag = `/* ===== ${markerEnd} ===== */`;
			const startIdx = content.indexOf(startTag);
			const endIdx = content.indexOf(endTag) + endTag.length;
			if (startIdx >= 0 && endIdx > startIdx) {
				content = content.substring(0, startIdx) + content.substring(endIdx);
			}
		}

		// Append new patch
		const startTag = `/* ===== ${config.marker} ===== */`;
		const endTag = `/* ===== ${config.marker.replace('START', 'END')} ===== */`;
		const patch = `\n${startTag}\n${config.css}\n${endTag}\n`;
		content += patch;

		fs.writeFileSync(cssPath, content, 'utf8');
		return true;
	} catch (err) {
		vscode.window.showErrorMessage(`RTL: Failed - ${err.message}`);
		return false;
	}
}

function disableCssPatch(config) {
	const cssPath = getCssFilePath(config);
	if (!cssPath) return false;

	try {
		const backupPath = cssPath + '.rtl-backup';
		if (fs.existsSync(backupPath)) {
			fs.copyFileSync(backupPath, cssPath);
		} else {
			let content = fs.readFileSync(cssPath, 'utf8');
			const markerEnd = config.marker.replace('START', 'END');
			const startTag = `/* ===== ${config.marker} ===== */`;
			const endTag = `/* ===== ${markerEnd} ===== */`;
			const startIdx = content.indexOf(startTag);
			const endIdx = content.indexOf(endTag) + endTag.length;
			if (startIdx >= 0 && endIdx > startIdx) {
				content = content.substring(0, startIdx) + content.substring(endIdx);
				fs.writeFileSync(cssPath, content, 'utf8');
			}
		}
		return true;
	} catch (err) {
		vscode.window.showErrorMessage(`RTL: Failed - ${err.message}`);
		return false;
	}
}

// ============================================================
// JS INJECT METHOD (for workbench-based chats like Antigravity)
// ============================================================

function getWorkbenchJsPath() {
	const appRoot = vscode.env.appRoot;
	return path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
}

function isJsPatched(config) {
	try {
		const content = fs.readFileSync(getWorkbenchJsPath(), 'utf8');
		return content.includes(config.marker);
	} catch { return false; }
}

function enableJsInject(config) {
	const jsPath = getWorkbenchJsPath();
	try {
		let content = fs.readFileSync(jsPath, 'utf8');

		// Remove old patch if exists
		if (content.includes(config.marker)) {
			const regex = new RegExp(`\\/\\* ===== ${config.marker} ===== \\*\\/[\\s\\S]*?\\/\\* ===== ${config.marker.replace('START', 'END')} ===== \\*\\/`);
			content = content.replace(regex, '');
		}

		// Append new patch
		const startTag = `/* ===== ${config.marker} ===== */`;
		const endTag = `/* ===== ${config.marker.replace('START', 'END')} ===== */`;
		const patch = `\n${startTag}\n${config.script}\n${endTag}\n`;
		fs.writeFileSync(jsPath, content + patch, 'utf8');
		return true;
	} catch (err) {
		vscode.window.showErrorMessage(`RTL: Failed - ${err.message}`);
		return false;
	}
}

function disableJsInject(config) {
	const jsPath = getWorkbenchJsPath();
	try {
		let content = fs.readFileSync(jsPath, 'utf8');
		const regex = new RegExp(`\\/\\* ===== ${config.marker} ===== \\*\\/[\\s\\S]*?\\/\\* ===== ${config.marker.replace('START', 'END')} ===== \\*\\/`);
		content = content.replace(regex, '');
		fs.writeFileSync(jsPath, content.trim(), 'utf8');
		return true;
	} catch (err) {
		vscode.window.showErrorMessage(`RTL: Failed - ${err.message}`);
		return false;
	}
}

// ============================================================
// UNIFIED TOGGLE LOGIC
// ============================================================

function checkIsEnabled(ide) {
	if (!ide) return false;
	if (ide.method === 'css-patch') return isCssPatched(ide);
	if (ide.method === 'js-inject') return isJsPatched(ide);
	return false;
}

function toggleRtl() {
	const ide = detectIDE();
	if (!ide) {
		vscode.window.showErrorMessage('RTL: Unknown IDE. Cannot detect environment.');
		return;
	}

	const isEnabled = checkIsEnabled(ide);
	let success = false;

	if (isEnabled) {
		if (ide.method === 'css-patch') success = disableCssPatch(ide);
		else if (ide.method === 'js-inject') success = disableJsInject(ide);

		if (success) {
			updateStatusBar(false, ide.name);
			promptRestart(`${ide.name} RTL Support Disabled.`);
		}
	} else {
		if (ide.method === 'css-patch') success = enableCssPatch(ide);
		else if (ide.method === 'js-inject') success = enableJsInject(ide);

		if (success) {
			updateStatusBar(true, ide.name);
			promptRestart(`${ide.name} RTL Support Enabled!`);
		}
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

// ============================================================
// ACTIVATION
// ============================================================

function activate(context) {
	let toggleCmd = vscode.commands.registerCommand('universal-rtl.toggle', toggleRtl);

	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = 'universal-rtl.toggle';

	const ide = detectIDE();
	const currentState = checkIsEnabled(ide);
	updateStatusBar(currentState, ide?.name);

	context.subscriptions.push(toggleCmd, myStatusBarItem);
}

function deactivate() { }

module.exports = { activate, deactivate };
