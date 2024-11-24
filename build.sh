#!/bin/bash
set -e  # Exit on error

echo "Starting build process..."

echo "Making yt-dlp executable..."
chmod +x bin/yt-dlp

echo "Running Next.js build..."
next build

echo "Build process completed"