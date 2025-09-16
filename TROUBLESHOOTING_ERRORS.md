# Troubleshooting Errors - Library Management System

## Error: "can't convert item to string"

### Penyebab Error
Error ini terjadi ketika ada data dari database yang tidak bisa dikonversi ke string, biasanya karena:
1. **Data null/undefined** yang tidak ditangani dengan baik
2. **Tipe data yang tidak sesuai** dengan yang diharapkan
3. **Data dari Supabase** yang memiliki format yang tidak konsisten
4. **Profile data** yang tidak valid atau corrupt

### Solusi yang Diterapkan

#### 1. **Data Sanitization**
- Menambahkan fungsi `sanitizeData()` untuk membersihkan semua data
- Konversi otomatis semua data ke tipe yang sesuai
- Handling untuk null/undefined values

#### 2. **Profile Validation**
- Validasi ketat untuk data profile
- Check required fields (id, role)
- Validasi role yang diizinkan (admin, librarian, member)

#### 3. **Error Handling**
- Error boundary untuk menangkap error JavaScript
- Logging yang lebih detail dengan context
- Graceful degradation untuk data yang tidak valid

#### 4. **ProtectedRoute Enhancement**
- Validasi profile role sebelum render
- Check tipe data sebelum digunakan
- Fallback ke login jika data tidak valid

### File yang Dimodifikasi

#### `src/utils/errorHandler.ts` (BARU)
```typescript
// Utility functions untuk error handling
export function sanitizeData(data: any): any
export function validateProfile(profile: any): boolean
export function logError(error: any, context: string): void
```

#### `src/stores/authStore.ts`
- Import error handling utilities
- Sanitize semua data profile
- Validate profile sebelum set state
- Better error logging

#### `src/components/ProtectedRoute.tsx`
- Validasi profile role
- Check tipe data
- Error handling untuk invalid data

### Cara Debug Error

#### 1. **Check Browser Console**
```javascript
// Buka Developer Tools (F12)
// Lihat Console tab untuk error messages
// Error sekarang akan menampilkan context yang jelas
```

#### 2. **Check Network Tab**
- Lihat request ke Supabase
- Check response data format
- Verify API responses

#### 3. **Check Local Storage**
```javascript
// Check stored session data
localStorage.getItem('memberSession')
// Data harus valid JSON dengan structure yang benar
```

#### 4. **Check Database Data**
```sql
-- Check profile data di Supabase
SELECT * FROM profiles WHERE id = 'user-id';
-- Pastikan semua field ada dan tipe data benar
```

### Prevention Measures

#### 1. **Database Schema Validation**
```sql
-- Pastikan semua field memiliki tipe yang benar
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN id SET NOT NULL;
```

#### 2. **Environment Variables**
```env
# Pastikan Supabase configuration benar
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. **Data Migration**
```sql
-- Update existing data jika ada yang corrupt
UPDATE profiles 
SET role = 'member' 
WHERE role IS NULL OR role NOT IN ('admin', 'librarian', 'member');
```

### Testing Error Scenarios

#### 1. **Test dengan Data Invalid**
```javascript
// Simulate invalid profile data
const invalidProfile = {
  id: null,
  role: 'invalid_role',
  // missing required fields
}
```

#### 2. **Test dengan Network Error**
```javascript
// Disconnect internet
// Try to login
// Should show proper error message
```

#### 3. **Test dengan Corrupt LocalStorage**
```javascript
// Set invalid data in localStorage
localStorage.setItem('memberSession', 'invalid-json')
// Refresh page
// Should clear invalid data and redirect to login
```

### Error Recovery

#### 1. **Automatic Recovery**
- Invalid data akan di-clear otomatis
- User akan di-redirect ke login
- Session akan di-reset

#### 2. **Manual Recovery**
```javascript
// Clear all stored data
localStorage.clear()
// Refresh page
window.location.reload()
```

#### 3. **Admin Recovery**
- Admin bisa reset user data
- Database bisa di-update manual
- Profile bisa di-recreate

### Monitoring

#### 1. **Error Logging**
```javascript
// Semua error sekarang di-log dengan context
console.error('[Context] Error:', error)
```

#### 2. **User Feedback**
- Error boundary menampilkan pesan user-friendly
- Setup guide untuk configuration issues
- Clear instructions untuk recovery

### Best Practices

#### 1. **Data Validation**
- Selalu validate data dari external sources
- Use TypeScript interfaces untuk type safety
- Sanitize data sebelum digunakan

#### 2. **Error Handling**
- Catch errors di semua async operations
- Provide fallback values
- Log errors dengan context yang jelas

#### 3. **User Experience**
- Show loading states
- Provide clear error messages
- Offer recovery options

## Error Lainnya

### "VITE_SUPABASE_URL is not defined"
- **Solusi**: Setup environment variables
- **File**: `.env.local`

### "Failed to fetch"
- **Solusi**: Check network connection dan Supabase URL
- **Debug**: Check Network tab di Developer Tools

### "Invalid API key"
- **Solusi**: Check Supabase anon key
- **Debug**: Verify di Supabase dashboard

### "No profile found"
- **Solusi**: Create profile di database
- **Debug**: Check profiles table di Supabase

## Support

Jika masih mengalami masalah:
1. Check console errors dengan context
2. Verify database schema
3. Test dengan fresh browser session
4. Check Supabase project status
5. Review error logs dengan detail