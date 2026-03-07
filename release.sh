#!/bin/bash
set -e

echo "Building..."
npm install
npm run build

ZIP="release/riko-chrome-companion.zip"
rm -f "$ZIP"

echo "Packaging..."
zip -r "$ZIP" \
  manifest.json \
  content.css \
  dist/ \
  assets/*.webp \
  options/\
  icons/icon.png

echo "Done! Created $ZIP ($(du -h "$ZIP" | cut -f1))"
echo "Load it in Chrome: chrome://extensions -> Load unpacked (unzip first)"
