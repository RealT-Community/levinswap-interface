/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  webpack: (config) => {
    // Désactiver les avertissements de sérialisation
    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tokens.1inch.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tokens-data.1inch.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.trustwallet.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**etherscan.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**realt.co',
        pathname: '/**',
      },

    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
  },
};

module.exports = nextConfig;
