/* eslint-disable linebreak-style */
/* eslint-disable prettier/prettier */
const path = require("path");

const aliasPathsToResolve = [
  { name: "common", path: path.resolve(__dirname, "../common") },
];

module.exports = {
  webpack: (config, { defaultLoaders }) => {
    /** Resolve aliases */
    aliasPathsToResolve.forEach((module) => {
      config.resolve.alias[module.name] = module.path;
    });
    return config;
  },
  images: {
    domains: ["picsum.photos"],
  },
  typescript: {
    ignoreBuildErrors: true,
    strictNullChecks: false,
  },
  async redirects() {
    return [{
      source: '/',
      // destination: '',
      destination: '/home',
      permanent: false,
    },]
  },
};