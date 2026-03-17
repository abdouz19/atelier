/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',         // generates /out folder
  trailingSlash: true,      // needed for file:// routing in Electron
  images: { unoptimized: true }, // Next Image won't work in Electron without this
}
module.exports = nextConfig