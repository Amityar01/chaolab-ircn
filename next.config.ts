import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // IRCN domain for lab images
      {
        protocol: 'https',
        hostname: 'ircn.jp',
      },
      {
        protocol: 'https',
        hostname: '*.ircn.jp',
      },
      // University of Tokyo
      {
        protocol: 'https',
        hostname: '*.u-tokyo.ac.jp',
      },
      // Google Scholar profile images
      {
        protocol: 'https',
        hostname: 'scholar.googleusercontent.com',
      },
      // GitHub avatars (for team members)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Gravatar (common for academic profiles)
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
      },
    ],
  },
};

export default nextConfig;
