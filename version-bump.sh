#!/bin/bash
# version-bump.sh - Auto-bump version based on commit messages

VERSION_FILE="VERSION"

# Read current version
MAJOR=$(grep "^MAJOR=" "$VERSION_FILE" | cut -d= -f2)
MINOR=$(grep "^MINOR=" "$VERSION_FILE" | cut -d= -f2)
PATCH=$(grep "^PATCH=" "$VERSION_FILE" | cut -d= -f2)
LAST_COMMIT=$(git rev-parse HEAD)

# Get the last commit message
COMMIT_MSG=$(git log -1 --format="%s")
COMMIT_TYPE=$(echo "$COMMIT_MSG" | cut -d: -f1 | cut -d! -f1)

# Determine version bump
NEW_MAJOR=$MAJOR
NEW_MINOR=$MINOR
NEW_PATCH=$PATCH

if echo "$COMMIT_MSG" | grep -qi "BREAKING CHANGE"; then
    NEW_MAJOR=$((MAJOR + 1))
    NEW_MINOR=0
    NEW_PATCH=0
elif [ "$COMMIT_TYPE" = "feat" ]; then
    NEW_MINOR=$((MINOR + 1))
    NEW_PATCH=0
elif [ "$COMMIT_TYPE" = "fix" ] || [ "$COMMIT_TYPE" = "perf" ] || [ "$COMMIT_TYPE" = "refactor" ]; then
    NEW_PATCH=$((PATCH + 1))
elif [ "$COMMIT_TYPE" = "docs" ] || [ "$COMMIT_TYPE" = "style" ] || [ "$COMMIT_TYPE" = "test" ] || [ "$COMMIT_TYPE" = "build" ] || [ "$COMMIT_TYPE" = "ci" ]; then
    NEW_PATCH=$((PATCH + 1))
fi

# Only update if version changed
if [ "$NEW_MAJOR" != "$MAJOR" ] || [ "$NEW_MINOR" != "$MINOR" ] || [ "$NEW_PATCH" != "$PATCH" ]; then
    echo "MAJOR=$NEW_MAJOR" > "$VERSION_FILE"
    echo "MINOR=$NEW_MINOR" >> "$VERSION_FILE"
    echo "PATCH=$NEW_PATCH" >> "$VERSION_FILE"
    echo "BUILD_DATE=$(date +%Y-%m-%d)" >> "$VERSION_FILE"
    echo "LAST_RELEASE_COMMIT=$LAST_COMMIT" >> "$VERSION_FILE"
    echo "Version: $MAJOR.$MINOR.$PATCH → $NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"
    git add "$VERSION_FILE"
fi