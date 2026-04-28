/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://ai-tutor-evaluator.onrender.com',
  },
};

module.exports = nextConfig;