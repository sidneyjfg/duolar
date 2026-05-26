const pagesBasePath = process.env.GITHUB_PAGES_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath: pagesBasePath,
  assetPrefix: pagesBasePath
};

export default nextConfig;
