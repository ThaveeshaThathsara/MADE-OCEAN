const createNextIntlPlugin = require('next-intl/plugin');
const { withContentlayer } = require('next-contentlayer');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    // Change this to matches your repository name
    basePath: '/MADE-OCEAN',
    images: {
        unoptimized: true,
    },
};

module.exports = withContentlayer(withNextIntl(nextConfig));
