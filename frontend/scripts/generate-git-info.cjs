const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const gitInfoPath = path.resolve(__dirname, '../src/git-info.json');

try {
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    const commitDate = execSync('git log -1 --format=%cd --date=iso').toString().trim();
    
    const versionPath = path.resolve(__dirname, '../../VERSION');
    let version = '1.0.0';
    if (fs.existsSync(versionPath)) {
        const versionContent = fs.readFileSync(versionPath, 'utf8');
        const major = versionContent.match(/MAJOR=(\d+)/)?.[1] || '1';
        const minor = versionContent.match(/MINOR=(\d+)/)?.[1] || '0';
        const patch = versionContent.match(/PATCH=(\d+)/)?.[1] || '0';
        version = `${major}.${minor}.${patch}`;
    }

    const gitInfo = {
        version: version,
        commit: commitHash,
        date: commitDate,
        buildTime: new Date().toISOString()
    };

    fs.writeFileSync(gitInfoPath, JSON.stringify(gitInfo, null, 2));
    console.log('Generated git-info.json:', gitInfo);
} catch (error) {
    console.error('Failed to generate git info:', error.message);
    const fallbackInfo = {
        version: '1.0.0',
        commit: 'unknown',
        date: 'unknown',
        buildTime: new Date().toISOString()
    };
    fs.writeFileSync(gitInfoPath, JSON.stringify(fallbackInfo, null, 2));
}
