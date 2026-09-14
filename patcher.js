const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getProductJsonPath() {
	const appRoot = vscode.env.appRoot;
	return path.join(appRoot, 'product.json');
}

/**
 * Compute SHA-256 hash of a file in the format VS Code expects.
 * @param {string} filePath - absolute path to the file
 * @returns {string} base64-encoded SHA-256 hash (trailing '=' stripped)
 */
function computeFileHash(filePath) {
	const fileContent = fs.readFileSync(filePath);
	return crypto.createHash('sha256')
		.update(fileContent)
		.digest('base64')
		.replace(/=+$/, '');
}

/**
 * Backup product.json if no backup exists yet.
 * @param {string} productJsonPath
 * @returns {boolean} true if backup exists (created or pre-existing)
 */
function ensureProductJsonBackup(productJsonPath) {
	const backupPath = productJsonPath + '.rtl-backup';
	try {
		if (!fs.existsSync(backupPath)) {
			fs.copyFileSync(productJsonPath, backupPath);
			console.log(`[Universal RTL Patcher] Created backup of product.json at ${backupPath}`);
		}
		return true;
	} catch (err) {
		console.error('[Universal RTL Patcher] Failed to create product.json backup:', err);
		return false;
	}
}

/**
 * Recompute and update ALL checksums in product.json so the IDE
 * integrity check passes after we patched workbench files.
 * @returns {{ success: boolean, updated: number, total: number, message: string }}
 */
function fixAllChecksums() {
	const productJsonPath = getProductJsonPath();

	if (!fs.existsSync(productJsonPath)) {
		return { success: false, updated: 0, total: 0, message: `product.json not found at ${productJsonPath}` };
	}

	try {
		const appRoot = vscode.env.appRoot;
		const productJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));

		if (!productJson.checksums || Object.keys(productJson.checksums).length === 0) {
			return { success: true, updated: 0, total: 0, message: 'No checksums found in product.json — IDE does not use checksum verification.' };
		}

		ensureProductJsonBackup(productJsonPath);

		const entries = Object.keys(productJson.checksums);
		let updated = 0;

		for (const fileKey of entries) {
			// VS Code stores keys like "vs/workbench/workbench.desktop.main.js"
			// The actual file is at <appRoot>/out/<fileKey>
			const filePath = path.join(appRoot, 'out', fileKey);
			if (!fs.existsSync(filePath)) {
				console.warn(`[Universal RTL Patcher] Checksummed file not found: ${filePath} (key: ${fileKey})`);
				continue;
			}

			const newHash = computeFileHash(filePath);
			if (newHash !== productJson.checksums[fileKey]) {
				productJson.checksums[fileKey] = newHash;
				updated++;
				console.log(`[Universal RTL Patcher] Updated checksum for '${fileKey}'`);
			}
		}

		if (updated > 0) {
			fs.writeFileSync(productJsonPath, JSON.stringify(productJson, null, '\t'), 'utf8');
			console.log(`[Universal RTL Patcher] Wrote ${updated} updated checksum(s) to product.json`);

			// Verify the write succeeded by reading back
			const verifyJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
			if (!verifyJson.checksums) {
				return { success: false, updated, total: entries.length, message: 'Verification failed — product.json was written but checksums are missing on re-read.' };
			}
		}

		return { success: true, updated, total: entries.length, message: `${updated} of ${entries.length} checksum(s) updated successfully.` };
	} catch (err) {
		return { success: false, updated: 0, total: 0, message: `Failed to fix checksums: ${err.message}` };
	}
}

/**
 * Update checksum for a single file in product.json.
 * Falls back to fixAllChecksums for robustness.
 * @returns {{ success: boolean, message: string }}
 */
function updateChecksum(filePathInProduct, targetFilePath) {
	const productJsonPath = getProductJsonPath();
	if (!fs.existsSync(productJsonPath)) {
		return { success: false, message: `product.json not found at ${productJsonPath}` };
	}

	try {
		ensureProductJsonBackup(productJsonPath);

		const hash = computeFileHash(targetFilePath);
		const productJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));

		if (!productJson.checksums) {
			// Some IDE builds don't have checksums — nothing to update
			return { success: true, message: 'No checksums object in product.json — skipping (IDE may not use checksum verification).' };
		}

		productJson.checksums[filePathInProduct] = hash;
		fs.writeFileSync(productJsonPath, JSON.stringify(productJson, null, '\t'), 'utf8');
		console.log(`[Universal RTL Patcher] Updated checksum for '${filePathInProduct}' to: ${hash}`);
		return { success: true, message: `Checksum updated for ${filePathInProduct}` };
	} catch (err) {
		console.error('[Universal RTL Patcher] Failed to update checksum:', err);
		return { success: false, message: `Failed to update checksum: ${err.message}` };
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
			return { success: true, message: 'Restored product.json from backup.' };
		} catch (err) {
			console.error('[Universal RTL Patcher] Failed to restore product.json backup:', err);
			return { success: false, message: `Failed to restore product.json backup: ${err.message}` };
		}
	} else {
		console.log('[Universal RTL Patcher] No product.json backup found to restore.');
		// No backup — fix checksums based on current files instead
		return fixAllChecksums();
	}
}

function getWorkbenchJsPath() {
	const appRoot = vscode.env.appRoot;
	return path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
}

function getCssFilePath(config) {
	const appRoot = vscode.env.appRoot;
	const localAppData = process.env.LOCALAPPDATA || '';

	const cssPath = path.join(path.dirname(appRoot), config.cssPath);
	if (fs.existsSync(cssPath)) return cssPath;

	if (config.altCssPath && localAppData) {
		const altPath = path.join(localAppData, config.altCssPath);
		if (fs.existsSync(altPath)) return altPath;
	}

	// Try legacy paths for older versions
	if (config.legacyCssPaths) {
		for (const legacyPath of config.legacyCssPaths) {
			const fullPath = path.join(path.dirname(appRoot), legacyPath);
			if (fs.existsSync(fullPath)) return fullPath;
			if (localAppData) {
				const altLegacyPath = path.join(localAppData, legacyPath);
				if (fs.existsSync(altLegacyPath)) return altLegacyPath;
			}
		}
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
		const cssPatchPath = path.join(extensionPath, 'inject', 'chat-rtl.css');
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

		// Fix ALL checksums in product.json so the IDE integrity check passes
		const checksumResult = fixAllChecksums();
		console.log(`[Universal RTL Patcher] Checksum fix result: ${checksumResult.message}`);
		return { patched: true, checksumResult };
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

		// Restore product.json and fix all checksums
		restoreProductJson();
		const checksumResult = fixAllChecksums();
		console.log(`[Universal RTL Patcher] Post-unpatch checksum fix: ${checksumResult.message}`);
		return { patched: false, checksumResult };
	}
	return false;
}

module.exports = {
	isPatched,
	patch,
	unpatch,
	fixAllChecksums
};
