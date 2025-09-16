# Setup Guide - Library Management System

## Masalah: Aplikasi Blank/Muncul Sebentar Lalu Blank

Jika aplikasi muncul sebentar lalu blank, kemungkinan besar disebabkan oleh:

1. **Environment Variables tidak dikonfigurasi**
2. **Error JavaScript yang tidak tertangani**
3. **Supabase connection error**

## Solusi

### 1. Setup Environment Variables

Buat file `.env.local` di root project dengan isi:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Application Configuration
VITE_APP_NAME=Library Management System
VITE_APP_VERSION=1.0.0
```

### 2. Setup Supabase

1. **Buat Project Supabase:**
   - Kunjungi [supabase.com](https://supabase.com)
   - Buat project baru
   - Pilih region terdekat

2. **Dapatkan Credentials:**
   - Masuk ke Project Settings > API
   - Copy `Project URL` → `VITE_SUPABASE_URL`
   - Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `VITE_SUPABASE_SERVICE_ROLE_KEY`

3. **Setup Database:**
   - Jalankan migrations dari folder `supabase/migrations/`
   - Atau import SQL dari `supabase/migrations/001_complete_setup.sql`

### 3. Restart Development Server

```bash
# Stop server (Ctrl+C)
# Start ulang
npm run dev
```

## Fitur Error Handling

Aplikasi sekarang memiliki:

1. **Error Boundary**: Menangkap error JavaScript dan menampilkan pesan error yang user-friendly
2. **Setup Guide**: Menampilkan panduan setup jika environment variables tidak dikonfigurasi
3. **Graceful Degradation**: Aplikasi tidak crash jika Supabase tidak dikonfigurasi

## Troubleshooting

### Jika masih blank:

1. **Buka Browser Developer Tools (F12)**
2. **Check Console tab** untuk error messages
3. **Check Network tab** untuk failed requests

### Error yang mungkin muncul:

- `VITE_SUPABASE_URL is not defined` → Setup environment variables
- `Failed to fetch` → Check Supabase URL dan network connection
- `Invalid API key` → Check Supabase anon key

### Debug Mode:

Tambahkan di `.env.local`:
```env
VITE_DEBUG=true
```

## Production Deployment

Untuk deployment ke Vercel:

1. **Set Environment Variables di Vercel Dashboard:**
   - Masuk ke Project Settings > Environment Variables
   - Tambahkan semua variables dari `.env.local`

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## Support

Jika masih mengalami masalah:
1. Check console errors
2. Verify Supabase project setup
3. Check network connectivity
4. Review this setup guide