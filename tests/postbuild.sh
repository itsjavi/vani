#!/usr/bin/env bash
# Verify that the dist directory has the expected structure after build

set -e

DIST_DIR="${1:-dist}"

echo "Verifying dist structure in: $PWD/$DIST_DIR"

# List of required files that must exist
REQUIRED_FILES=(
  # Vani runtime
  "lib/index.d.mts"
  "lib/index.mjs"
  "lib/index.mjs.map"
  "lib/jsx-dev-runtime.d.mts"
  "lib/jsx-dev-runtime.mjs"
  "lib/jsx-runtime.d.mts"
  "lib/jsx-runtime.mjs"

  # Main SPA app
  "client/index.html"

  # Benchmark styles
  "client/benchmarks/assets/styles.css"

  # Benchmarks landing page
  "client/benchmarks/index.html"
  "client/benchmarks/main.js"

  # Benchmarks results page
  "client/benchmarks/results/index.html"
  "client/benchmarks/results.js"

  # Benchmarks data
  "client/benchmarks/data/bench-results.json"

  # Manual test pages (at least golden-leaf-test must exist)
  "client/benchmarks/manual-tests/golden-leaf-test/index.html"
  "client/benchmarks/manual-tests/golden-leaf-test.js"

  # Framework pages (at least vani must exist)
  "client/benchmarks/frameworks/vani/index.html"
  "client/benchmarks/frameworks/vani.js"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    MISSING_FILES+=("$DIST_DIR/$file")
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo "ERROR: Missing required files:"
  for file in "${MISSING_FILES[@]}"; do
    echo "  - $file"
  done
  exit 1
fi

echo "All required files found."
echo ""
echo "Dist structure:"
find "$DIST_DIR" -type f -name "*.mjs" -o -name "*.html" -o -name "*.js" | sort | head -50
echo ""
echo "Postbuild verification passed."
