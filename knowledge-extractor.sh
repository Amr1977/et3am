#!/bin/bash
# knowledge-extractor.sh - Extracts learnings from recent commits to KB

echo "Scanning recent commits for knowledge to add..."

# Get commits with keywords that suggest learnable content
COMMITS=$(git log --oneline -20 --grep="fix:" --grep="feat:" --grep="refactor:" -i)

echo "Review these commits and add relevant learnings to docs/kb/:"
echo "$COMMITS"
echo ""
echo "Areas to check:"
echo "- New patterns in src/"
echo "- Configuration changes"
echo "- Workarounds or fixes"
echo "- New dependencies or tools"
echo ""
echo "After reviewing, update docs/kb/ with any new learnings"