import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {
    domains: [
      'image.tmdb.org',
      'media.rawg.io',
      's4.anilist.co',
      'books.google.com',
    ],
  },
};

export default nextConfig;
