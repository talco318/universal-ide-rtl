const https = require('https');
const fs = require('fs');
const path = require('path');

const EXTENSION_API = 'https://open-vsx.org/api/talco/universal-ide-rtl';
const TARGET_DOWNLOADS = 10000;
const GROWTH_DIR = path.join(__dirname, '..', 'growth');
const STATS_FILE = path.join(GROWTH_DIR, 'growth-stats.json');

function fetchExtensionData() {
    return new Promise((resolve, reject) => {
        https.get(EXTENSION_API, {
            headers: {
                'User-Agent': 'Universal-IDE-RTL-Growth-Tracker'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON response: ${e.message}`));
                    }
                } else {
                    reject(new Error(`API returned HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

function renderProgressBar(current, target, length = 30) {
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage.toFixed(2)}%`;
}

async function runTracker() {
    console.log('\n=============================================================');
    console.log('  🚀 UNIVERSAL IDE RTL — OPEN VSX GROWTH MONITOR & ANALYTICS');
    console.log('=============================================================\n');

    try {
        console.log('📡 Fetching live data from Open VSX registry API...');
        const data = await fetchExtensionData();

        const downloads = data.downloadCount || 0;
        const rating = data.averageRating || 0;
        const reviews = data.reviewCount || 0;
        const version = data.version || 'unknown';
        const now = new Date().toISOString();

        const remaining = Math.max(0, TARGET_DOWNLOADS - downloads);
        const progressStr = renderProgressBar(downloads, TARGET_DOWNLOADS);

        // Ensure growth directory exists
        if (!fs.existsSync(GROWTH_DIR)) {
            fs.mkdirSync(GROWTH_DIR, { recursive: true });
        }

        // Load historical records
        let history = [];
        if (fs.existsSync(STATS_FILE)) {
            try {
                history = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
            } catch (e) {
                history = [];
            }
        }

        // Calculate delta since last recorded check
        let lastRecord = history.length > 0 ? history[history.length - 1] : null;
        let deltaDownloads = lastRecord ? (downloads - lastRecord.downloads) : 0;
        let timeSinceLast = '';
        if (lastRecord) {
            const diffHours = ((new Date(now) - new Date(lastRecord.timestamp)) / (1000 * 60 * 60)).toFixed(1);
            timeSinceLast = ` (+${deltaDownloads} downloads in last ${diffHours} hours)`;
        }

        // Save new snapshot (if changed or first entry)
        if (!lastRecord || downloads !== lastRecord.downloads || history.length === 0) {
            history.push({
                timestamp: now,
                downloads: downloads,
                remaining: remaining,
                reviews: reviews,
                rating: rating,
                version: version
            });
            fs.writeFileSync(STATS_FILE, JSON.stringify(history, null, 2), 'utf8');
        }

        console.log('\n📊 CURRENT PERFORMANCE SNAPSHOT:');
        console.log(`   • Total Downloads:   ${downloads.toLocaleString()} ${timeSinceLast}`);
        console.log(`   • Target Goal:       ${TARGET_DOWNLOADS.toLocaleString()}`);
        console.log(`   • Remaining to 10K:  ${remaining.toLocaleString()} downloads`);
        console.log(`   • Progress to 10K:   ${progressStr}`);
        console.log(`   • Live Version:      v${version}`);
        console.log(`   • Average Rating:    ${rating.toFixed(1)} / 5.0 ⭐ (${reviews} review${reviews === 1 ? '' : 's'})`);

        console.log('\n💡 GROWTH VELOCITY & STRATEGY INSIGHTS:');
        if (downloads >= TARGET_DOWNLOADS) {
            console.log('   🎉 CONGRATULATIONS! Target of 10,000 downloads has been achieved!');
        } else {
            console.log(`   📈 You are ${((downloads / TARGET_DOWNLOADS) * 100).toFixed(1)}% of the way to the 10,000 milestone.`);
            console.log('   🔄 Auto-Update Flywheel: Each new release pushed to Open VSX triggers automatic');
            console.log('      downloads by existing active IDE installations (VSCodium, Gitpod, Cursor, Windsurf).');
            console.log('   📣 Community Outreach: Share the ready-to-post kits in the marketing/ folder');
            console.log('      to drive organic first-time installations.');
        }

        console.log('\n=============================================================\n');
        return { downloads, remaining, rating, reviews, version };
    } catch (err) {
        console.error('❌ Error fetching growth statistics:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runTracker();
}

module.exports = { runTracker };
