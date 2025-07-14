#!/bin/bash

# Generate placeholder icons for Tauri app
# This script creates simple colored square icons in the required sizes

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    echo "Please install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Define colors for the placeholder icon
BACKGROUND_COLOR="#2D2D2D"
TEXT_COLOR="#FFFFFF"

echo "Generating placeholder icons..."

# Generate 32x32 PNG
convert -size 32x32 xc:"$BACKGROUND_COLOR" \
    -gravity center -fill "$TEXT_COLOR" \
    -pointsize 16 -annotate +0+0 "SL" \
    icons/32x32.png
echo "✓ Created icons/32x32.png"

# Generate 128x128 PNG
convert -size 128x128 xc:"$BACKGROUND_COLOR" \
    -gravity center -fill "$TEXT_COLOR" \
    -pointsize 64 -annotate +0+0 "SL" \
    icons/128x128.png
echo "✓ Created icons/128x128.png"

# Generate 128x128@2x PNG (256x256)
convert -size 256x256 xc:"$BACKGROUND_COLOR" \
    -gravity center -fill "$TEXT_COLOR" \
    -pointsize 128 -annotate +0+0 "SL" \
    icons/128x128@2x.png
echo "✓ Created icons/128x128@2x.png"

# Generate icon.ico (Windows)
# Windows ICO file with multiple resolutions
convert -size 16x16 xc:"$BACKGROUND_COLOR" \
    -gravity center -fill "$TEXT_COLOR" \
    -pointsize 8 -annotate +0+0 "SL" \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    \( -clone 0 -resize 64x64 \) \
    \( -clone 0 -resize 128x128 \) \
    \( -clone 0 -resize 256x256 \) \
    -delete 0 \
    icons/icon.ico
echo "✓ Created icons/icon.ico"

# Generate icon.icns (macOS)
# First create all required sizes for macOS
mkdir -p temp_icons
convert -size 16x16 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 8 -annotate +0+0 "SL" temp_icons/icon_16x16.png
convert -size 32x32 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 16 -annotate +0+0 "SL" temp_icons/icon_16x16@2x.png
convert -size 32x32 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 16 -annotate +0+0 "SL" temp_icons/icon_32x32.png
convert -size 64x64 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 32 -annotate +0+0 "SL" temp_icons/icon_32x32@2x.png
convert -size 128x128 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 64 -annotate +0+0 "SL" temp_icons/icon_128x128.png
convert -size 256x256 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 128 -annotate +0+0 "SL" temp_icons/icon_128x128@2x.png
convert -size 256x256 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 128 -annotate +0+0 "SL" temp_icons/icon_256x256.png
convert -size 512x512 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 256 -annotate +0+0 "SL" temp_icons/icon_256x256@2x.png
convert -size 512x512 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 256 -annotate +0+0 "SL" temp_icons/icon_512x512.png
convert -size 1024x1024 xc:"$BACKGROUND_COLOR" -gravity center -fill "$TEXT_COLOR" -pointsize 512 -annotate +0+0 "SL" temp_icons/icon_512x512@2x.png

# Check if iconutil is available (macOS only)
if command -v iconutil &> /dev/null; then
    # Create iconset directory
    mkdir -p temp_icons.iconset
    cp temp_icons/icon_16x16.png temp_icons.iconset/
    cp temp_icons/icon_16x16@2x.png temp_icons.iconset/
    cp temp_icons/icon_32x32.png temp_icons.iconset/
    cp temp_icons/icon_32x32@2x.png temp_icons.iconset/
    cp temp_icons/icon_128x128.png temp_icons.iconset/
    cp temp_icons/icon_128x128@2x.png temp_icons.iconset/
    cp temp_icons/icon_256x256.png temp_icons.iconset/
    cp temp_icons/icon_256x256@2x.png temp_icons.iconset/
    cp temp_icons/icon_512x512.png temp_icons.iconset/
    cp temp_icons/icon_512x512@2x.png temp_icons.iconset/
    
    # Generate icns file
    iconutil -c icns temp_icons.iconset -o icons/icon.icns
    rm -rf temp_icons.iconset
    echo "✓ Created icons/icon.icns"
else
    echo "⚠ iconutil not found (macOS only). Skipping icon.icns generation."
    echo "  To generate icon.icns on macOS, ensure you have Xcode command line tools installed."
fi

# Clean up temporary files
rm -rf temp_icons

echo ""
echo "Icon generation complete!"
echo "Generated icons are located in: src-tauri/icons/"
echo ""
echo "These are placeholder icons. For production use, replace them with your actual app icon."
echo "Recommended: Create a high-resolution (1024x1024) icon and use it to generate all sizes."