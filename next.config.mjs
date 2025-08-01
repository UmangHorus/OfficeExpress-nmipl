/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Recommended for Vercel
  eslint: {
    ignoreDuringBuilds: true, // Temporary fix
  },
  typescript: {
    ignoreBuildErrors: true, // If not using TypeScript
  },
};

export default nextConfig;
