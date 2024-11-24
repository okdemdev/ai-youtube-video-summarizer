/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['i.ytimg.com', 'img.youtube.com', 'youtube.com', 'youtube-to-mp315.p.rapidapi.com'],
  },
};

module.exports = nextConfig;
