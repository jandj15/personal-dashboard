const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root (a stray lockfile exists in the parent dir).
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
