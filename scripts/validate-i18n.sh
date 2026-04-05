#!/bin/bash

echo "🔍 Validating i18n translations..."

cd "$(dirname "$0")/.."

LOCALES_DIR="./frontend/src/locales"

if [ ! -d "$LOCALES_DIR" ]; then
  echo "❌ Locales directory not found: $LOCALES_DIR"
  exit 1
fi

EN_FILE="$LOCALES_DIR/en.json"
AR_FILE="$LOCALES_DIR/ar.json"

if [ ! -f "$EN_FILE" ] || [ ! -f "$AR_FILE" ]; then
  echo "❌ Missing locale files"
  exit 1
fi

echo "📄 Checking for missing translations..."

node -e "
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('./frontend/src/locales/en.json'));
const ar = JSON.parse(fs.readFileSync('./frontend/src/locales/ar.json'));

function flatten(obj, prefix = '') {
  let keys = [];
  for (let k in obj) {
    const fullKey = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(flatten(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const allKeys = [...new Set([...flatten(en), ...flatten(ar)])];
let missingCount = 0;

allKeys.forEach(key => {
  const enHas = key.split('.').reduce((o, k) => o && o[k], en) !== undefined;
  const arHas = key.split('.').reduce((o, k) => o && o[k], ar) !== undefined;
  
  if (enHas && !arHas) {
    console.log('⚠️  Missing Arabic: ' + key);
    missingCount++;
  } else if (!enHas && arHas) {
    console.log('⚠️  Missing English: ' + key);
    missingCount++;
  }
});

if (missingCount > 0) {
  console.log('');
  console.log('❌ Found ' + missingCount + ' missing translations');
  process.exit(1);
} else {
  console.log('✅ All translations complete');
  process.exit(0);
}
"

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ i18n validation failed!"
  exit 1
fi

echo ""
echo "✅ i18n validation passed"