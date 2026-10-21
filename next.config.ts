/** @type {import('next').NextConfig} */
const nextConfig = {
  // چون در UI از <img> معمولی استفاده می‌کنیم، بهینه‌ساز تصویر لازم نیست
  images: {
    unoptimized: true,
  },

  trailingSlash: true,

  // ⚠️ حیاتی برای آپلود پیوست ماموریت:
  // پیش‌فرض Server Actions فقط 1mb است و فایل نزدیک 1MB با خطای خام کرش می‌کند.
  // 5mb > سقف اپلیکیشن ما (1MB) → خطای تمیز فارسیِ خودمان نمایش داده می‌شود.
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  output: 'standalone',
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;