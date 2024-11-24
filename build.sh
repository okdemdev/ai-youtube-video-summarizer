#!/bin/bash
set -e  # Exit on error

echo "Starting build process..."

# Download yt-dlp with timeout and retry
echo "Downloading yt-dlp..."
for i in {1..3}; do
    if curl -L --connect-timeout 30 --max-time 60 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp; then
        break
    fi
    echo "Download attempt $i failed, retrying..."
    sleep 5
done

echo "Making yt-dlp executable..."
chmod +x yt-dlp

echo "Running Next.js build..."
next build

echo "Build process completed"