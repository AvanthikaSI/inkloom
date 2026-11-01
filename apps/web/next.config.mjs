import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@inkloom/shared',
    '@inkloom/database',
    '@inkloom/vector-store',
    '@inkloom/langgraph-core'
  ],
  experimental: {
    serverComponentsExternalPackages: ['chromadb', 'pdf-parse', 'adm-zip']
  },
  async rewrites() {
    const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (rawBackendUrl && !rawBackendUrl.startsWith('/')) {
      const cleanUrl = rawBackendUrl.replace(/\/+$/, '');
      const destinationUrl = cleanUrl.endsWith('/api') ? `${cleanUrl}/:path*` : `${cleanUrl}/api/:path*`;
      return [
        {
          source: '/api/:path*',
          destination: destinationUrl
        }
      ];
    }
    return [];
  },
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx']
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@chroma-core/default-embed': false,
      '@inkloom/shared': path.resolve(rootDir, 'packages/shared/src/index.ts'),
      '@inkloom/database': path.resolve(rootDir, 'packages/database/src/index.ts'),
      '@inkloom/vector-store': path.resolve(rootDir, 'packages/vector-store/src/index.ts'),
      '@inkloom/langgraph-core': path.resolve(rootDir, 'packages/langgraph-core/src/index.ts')
    };
    return config;
  }
};

export default nextConfig;
