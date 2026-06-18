const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionPath = path.resolve(__dirname, '..', 'VERSION');

function parseVersion(content) {
  return {
    major: parseInt(content.match(/MAJOR=(\d+)/)?.[1] || '1', 10),
    minor: parseInt(content.match(/MINOR=(\d+)/)?.[1] || '0', 10),
    patch: parseInt(content.match(/PATCH=(\d+)/)?.[1] || '0', 10),
  };
}

function getBumpType(commitMsg) {
  const lines = commitMsg.split('\n');
  const firstLine = lines[0];

  // Breaking change: type! or BREAKING CHANGE footer
  if (firstLine.includes('!') || lines.some(l => l.startsWith('BREAKING CHANGE:'))) {
    return 'major';
  }

  const match = firstLine.match(/^(\w+)/);
  const type = match ? match[1] : 'chore';

  const bumpMap = {
    feat: 'minor',
    perf: 'minor',
    fix: 'patch',
    docs: 'patch',
    style: 'patch',
    refactor: 'patch',
    test: 'patch',
    build: 'patch',
    ci: 'patch',
    revert: 'patch',
    chore: 'none',
  };

  return bumpMap[type] || 'none';
}

function bumpVersion(current, bumpType) {
  switch (bumpType) {
    case 'major':
      return { major: current.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case 'patch':
      return { major: current.major, minor: current.minor, patch: current.patch + 1 };
    default:
      return null;
  }
}

function getCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '0000000';
  }
}

function main() {
  const commitMsgFile = process.argv[2];
  if (!commitMsgFile) {
    console.log('No commit message file provided, skipping version bump');
    process.exit(0);
  }

  const commitMsg = fs.readFileSync(commitMsgFile, 'utf8');
  const bumpType = getBumpType(commitMsg);

  if (bumpType === 'none') {
    console.log(`Commit type 'chore' — no version bump`);
    process.exit(0);
  }

  const versionContent = fs.readFileSync(versionPath, 'utf8');
  const current = parseVersion(versionContent);
  const bumped = bumpVersion(current, bumpType);

  if (!bumped) {
    process.exit(0);
  }

  const newVersion = `${bumped.major}.${bumped.minor}.${bumped.patch}`;
  const commitHash = getCommitHash();

  const newContent = `MAJOR=${bumped.major}
MINOR=${bumped.minor}
PATCH=${bumped.patch}
BUILD_DATE=${new Date().toISOString().split('T')[0]}
LAST_RELEASE_COMMIT=${commitHash}
`;

  fs.writeFileSync(versionPath, newContent);
  console.log(`Bumped version: ${current.major}.${current.minor}.${current.patch} → ${newVersion} (${bumpType})`);

  try {
    execSync('git add VERSION', { stdio: 'inherit' });
    console.log('Staged VERSION file');
  } catch {
    console.error('Failed to stage VERSION file');
  }
}

main();
