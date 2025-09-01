/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  // 성능 최적화 설정
  compress: true,
  poweredByHeader: false,
  // CSP 헤더 설정으로 보안 강화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://www.google.com https://cdn.jsdelivr.net; object-src 'none'; base-uri 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
