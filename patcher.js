const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getProductJsonPath() {
	const appRoot = vscode.env.appRoot;
	return path.join(appRoot, 'product.json');
}

function updateChecksum(filePathInProduct, targetFilePath) {
	const productJsonPath = getProductJsonPath();
	if (!fs.existsSync(productJsonPath)) {
		console.warn(`[Universal RTL Patcher] product.json not found at ${productJsonPath}. Skipping checksum update.`);
		return;
	}

	try {
		const backupPath = productJsonPath + '.rtl-backup';
		if (!fs.existsSync(backupPath)) {
			fs.copyFileSync(productJsonPath, backupPath);
			console.log(`[Universal RTL Patcher] Created backup of product.json at ${backupPath}`);
		}

		const fileContent = fs.readFileSync(targetFilePath);
		const hash = crypto.createHash('sha256')
			.update(fileContent)
			.digest('base64')
			.replace(/=+$/, '');

		const productJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
		if (productJson.checksums) {
			productJson.checksums[filePathInProduct] = hash;
			fs.writeFileSync(productJsonPath, JSON.stringify(productJson, null, '\t'), 'utf8');
			console.log(`[Universal RTL Patcher] Updated product.json checksum for '${filePathInProduct}' to: ${hash}`);
		} else {
			console.warn('[Universal RTL Patcher] No checksums object found in product.json.');
		}
	} catch (err) {
		console.error('[Universal RTL Patcher] Failed to update checksum:', err);
	}
}

function restoreProductJson() {
	const productJsonPath = getProductJsonPath();
	const backupPath = productJsonPath + '.rtl-backup';
	if (fs.existsSync(backupPath)) {
		try {
			fs.copyFileSync(backupPath, productJsonPath);
			fs.unlinkSync(backupPath);
			console.log('[Universal RTL Patcher] Restored product.json from backup and removed backup file.');
		} catch (err) {
			console.error('[Universal RTL Patcher] Failed to restore product.json backup:', err);
		}
	} else {
		console.log('[Universal RTL Patcher] No product.json backup found to restore.');
	}
}

function getWorkbenchJsPath() {
	const appRoot = vscode.env.appRoot;
	return path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
}

function getCssFilePath(config) {
	const appRoot = vscode.env.appRoot;
	const cssPath = path.join(path.dirname(appRoot), config.cssPath);
	if (fs.existsSync(cssPath)) return cssPath;

	if (config.altCssPath) {
		const localAppData = process.env.LOCALAPPDATA || '';
		const altPath = path.join(localAppData, config.altCssPath);
		if (fs.existsSync(altPath)) return altPath;
	}
	return null;
}

function isPatched(config) {
	if (config.method === 'css-patch') {
		const cssPath = getCssFilePath(config);
		if (!cssPath) return false;
		try {
			const content = fs.readFileSync(cssPath, 'utf8');
			return content.includes(config.marker);
		} catch { return false; }
	} else if (config.method === 'js-inject') {
		try {
			const content = fs.readFileSync(getWorkbenchJsPath(), 'utf8');
			return content.includes(config.marker);
		} catch { return false; }
	}
	return false;
}

function patch(config, extensionPath) {
	console.log(`[Universal RTL Patcher] Applying patch for IDE: ${config.name} (${config.method})`);
	
	if (config.method === 'css-patch') {
		const cssPath = getCssFilePath(config);
		if (!cssPath) {
			throw new Error(`CSS file not found for ${config.name}`);
		}

		// Create backup
		const backupPath = cssPath + '.rtl-backup';
		if (!fs.existsSync(backupPath)) {
			fs.copyFileSync(cssPath, backupPath);
			console.log(`[Universal RTL Patcher] Created backup of CSS file at ${backupPath}`);
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

		// Read new CSS patch file
		const cssPatchPath = path.join(extensionPath, 'inject', 'kiro-rtl.css');
		const cssPatch = fs.readFileSync(cssPatchPath, 'utf8');

		// Append new patch
		const startTag = `/* ===== ${config.marker} ===== */`;
		const endTag = `/* ===== ${config.marker.replace('START', 'END')} ===== */`;
		const patchData = `\n${startTag}\n${cssPatch}\n${endTag}\n`;
		content += patchData;

		fs.writeFileSync(cssPath, content, 'utf8');
		console.log(`[Universal RTL Patcher] Successfully patched CSS file at ${cssPath}`);
		return true;

	} else if (config.method === 'js-inject') {
		const jsPath = getWorkbenchJsPath();
		let content = fs.readFileSync(jsPath, 'utf8');

		// Remove old patch if exists
		if (content.includes(config.marker)) {
			const regex = new RegExp(`\\/\\* ===== ${config.marker} ===== \\*\\/[\\s\\S]*?\\/\\* ===== ${config.marker.replace('START', 'END')} ===== \\*\\/`);
			content = content.replace(regex, '');
			console.log('[Universal RTL Patcher] Removed old JS patch from workbench.desktop.main.js');
		}

		// Read new JS patch file
		const jsPatchPath = path.join(extensionPath, 'inject', 'workbench-rtl.js');
		const jsPatch = fs.readFileSync(jsPatchPath, 'utf8');

		// Append new patch
		const startTag = `/* ===== ${config.marker} ===== */`;
		const endTag = `/* ===== ${config.marker.replace('START', 'END')} ===== */`;
		const patchData = `\n${startTag}\n${jsPatch}\n${endTag}\n`;
		
		fs.writeFileSync(jsPath, content + patchData, 'utf8');
		console.log(`[Universal RTL Patcher] Appended JS patch to ${jsPath}`);

		// Update product.json checksum for the modified JS file
		updateChecksum('vs/workbench/workbench.desktop.main.js', jsPath);
		return true;
	}
	return false;
}

function unpatch(config) {
	console.log(`[Universal RTL Patcher] Removing patch for IDE: ${config.name} (${config.method})`);

	if (config.method === 'css-patch') {
		const cssPath = getCssFilePath(config);
		if (!cssPath) return false;

		const backupPath = cssPath + '.rtl-backup';
		if (fs.existsSync(backupPath)) {
			fs.copyFileSync(backupPath, cssPath);
			fs.unlinkSync(backupPath);
			console.log(`[Universal RTL Patcher] Restored original CSS file from backup.`);
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
				console.log(`[Universal RTL Patcher] Removed CSS patch from ${cssPath}`);
			}
		}
		return true;

	} else if (config.method === 'js-inject') {
		const jsPath = getWorkbenchJsPath();
		let content = fs.readFileSync(jsPath, 'utf8');
		const regex = new RegExp(`\\/\\* ===== ${config.marker} ===== \\*\\/[\\s\\S]*?\\/\\* ===== ${config.marker.replace('START', 'END')} ===== \\*\\/`);
		content = content.replace(regex, '');
		fs.writeFileSync(jsPath, content.trim(), 'utf8');
		console.log(`[Universal RTL Patcher] Removed JS patch from ${jsPath}`);

		// Restore product.json from backup
		restoreProductJson();
		return true;
	}
	return false;
}

module.exports = {
	isPatched,
	patch,
	unpatch
};
