#!/bin/zsh
set -u

cd "$(dirname "$0")"

if [ ! -d "dist" ]; then
  echo "dist/ was not found. Build the app first on a machine with Node.js."
  read -r "_?Press Enter to close..."
  exit 1
fi

OUTPUT_ROOT="email-demo-package"
PACKAGE_NAME="siga-treatment-matcher-demo"
PACKAGE_DIR="$OUTPUT_ROOT/$PACKAGE_NAME"
ZIP_FILE="$OUTPUT_ROOT/$PACKAGE_NAME.zip"

rm -rf "$OUTPUT_ROOT"
mkdir -p "$PACKAGE_DIR"

ditto dist "$PACKAGE_DIR"

cat > "$PACKAGE_DIR/README.txt" <<'EOF'
SIGA Treatment Matcher demo

Open index.html in a web browser.
No Node, Python, or other software is required.
EOF

ditto -c -k --sequesterRsrc --keepParent "$PACKAGE_DIR" "$ZIP_FILE"

echo "Created emailable demo at: $ZIP_FILE"
open "$OUTPUT_ROOT" >/dev/null 2>&1 || true
