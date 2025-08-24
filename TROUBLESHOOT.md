# 🔧 TROUBLESHOOTING GUIDE

## ❌ Masalah: "Error loading config (0/21) [0%]"

### 🔍 Penyebab:

- File JavaScript belum di-bundle dengan benar
- Masalah dengan module loading
- CORS atau network issue

### ✅ Solusi:

#### 1. Build JavaScript Bundle

```bash
npx esbuild js/*.js --bundle --outdir=dist
```

#### 2. Restart Server

```bash
# Hentikan server (Ctrl+C)
# Lalu jalankan lagi:
node server.js
```

#### 3. Gunakan Versi Simple (Alternative)

Jika masih error, gunakan versi yang sudah disederhanakan:

```
http://localhost:3000/simple.html
```

#### 4. Check Console Browser

- Buka Developer Tools (F12)
- Lihat tab Console untuk error details
- Lihat tab Network untuk failed requests

### 🚀 Quick Fix - Pakai Script Otomatis

```bash
# Windows:
start.bat

# Linux/Mac:
chmod +x start.sh
./start.sh
```

## 📁 File Structure Check

Pastikan struktur file benar:

```
undangan-4.x/
├── server.js ✅
├── index.html ✅
├── simple.html ✅ (versi backup)
├── generate.html ✅
├── data/
│   ├── comments.json ✅
│   ├── guests.json ✅
│   └── settings.json ✅
├── dist/
│   ├── guest.js ✅ (hasil build)
│   └── admin.js ✅ (hasil build)
└── js/
    ├── simple-patch.js ✅
    └── (other js files)
```

## 🌐 Test URLs

Setelah server running, test URL berikut:

1. **Main Invitation**: http://localhost:3000
2. **Simple Version**: http://localhost:3000/simple.html ⭐ (RECOMMENDED)
3. **Guest Generator**: http://localhost:3000/generate.html
4. **API Test**: http://localhost:3000/api/comments

## 📱 Mobile Testing

Untuk test di mobile (dalam jaringan yang sama):

1. Cari IP computer: `ipconfig` (Windows) atau `ifconfig` (Linux/Mac)
2. Akses dari mobile: `http://[YOUR-IP]:3000`

Contoh: `http://192.168.1.100:3000`

## 🔄 Common Commands

```bash
# Install dependencies
npm install

# Build JavaScript
npm run build

# Start server
npm start

# Alternative start
node server.js

# Check if port is available
netstat -an | findstr :3000
```

## ⚠️ Known Issues & Solutions

### Issue: Server tidak bisa start

```bash
# Solution: Check port
netstat -an | findstr :3000
# Jika port digunakan, gunakan port lain:
set PORT=8080 && node server.js
```

### Issue: CORS error

```bash
# Solution: Restart browser dan server
# Pastikan akses via localhost, bukan 127.0.0.1
```

### Issue: Comments tidak muncul

```bash
# Solution: Check data/comments.json ada dan valid
# Reset file jika perlu:
echo {"comments":[],"total":0,"lastId":0} > data/comments.json
```

## 📞 Quick Support

Jika masih ada masalah:

1. ✅ **Gunakan simple.html** - versi yang paling stabil
2. 🔄 **Restart server dan browser**
3. 🧹 **Clear browser cache** (Ctrl+Shift+Delete)
4. 📁 **Check file permissions**
5. 🌐 **Test dengan browser lain**

## 🎯 REKOMENDASI UTAMA

**Untuk penggunaan production, gunakan:**

```
http://localhost:3000/simple.html
```

File ini dibuat khusus untuk mengatasi masalah bundling dan lebih stabil untuk demo.

---

**Happy coding! 🎉**
