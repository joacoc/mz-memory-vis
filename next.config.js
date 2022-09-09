// /** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: { esmExternals: 'loose'},
}

const withTM = require('next-transpile-modules')(['reaflow']);  // first import this plugin with reaflow as a target

module.exports = withTM({
   ...nextConfig,
   experimental: {
    esmExternals: 'loose' // second add this experimental flag to the config
  }
})