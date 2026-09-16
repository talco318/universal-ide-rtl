const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n=============================================================');
console.log('  🚀 PUBLISHING TO MICROSOFT VISUAL STUDIO CODE MARKETPLACE');
console.log('=============================================================\n');

// 1. Read .env file for Personal Access Token (PAT)
const envPath = path.join(__dirname, '..', '.env');
let pat = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/(?:VSCE_PAT|MICROSOFT_PAT|AZURE_PAT)=([^\r\n]+)/);
    if (match) {
        pat = match[1].trim();
    }
}

if (!pat && process.env.VSCE_PAT) {
    pat = process.env.VSCE_PAT.trim();
}

if (!pat) {
    console.error('❌ Error: Personal Access Token (PAT) not found.');
    console.log('\n📋 Quick Setup Guide:');
    console.log('1. Go to https://dev.azure.com and generate a PAT with "Marketplace (Manage)" scope.');
    console.log('2. Add the token to your .env file:');
    console.log('   VSCE_PAT=your_azure_pat_token_here');
    console.log('3. Run this command again: npm run publish:marketplace\n');
    process.exit(1);
}

// 2. Read package.json version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`📦 Extension:   ${pkg.name}`);
console.log(`🏷️  Version:     v${pkg.version}`);
console.log(`🏢 Publisher:   ${pkg.publisher}\n`);

try {
    console.log('⏳ Packaging and publishing to Microsoft Marketplace...');
    execSync(`npx @vscode/vsce publish --allow-star-activation -p ${pat}`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });
    console.log(`\n🎉 Successfully published ${pkg.name} v${pkg.version} to Microsoft VS Code Marketplace!`);
} catch (err) {
    console.error('\n❌ Publication failed:', err.message);
    process.exit(1);
}
