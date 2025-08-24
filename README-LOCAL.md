# 🎉 Undangan Digital Khitanan Ahmad

## 📋 Deskripsi
Aplikasi undangan digital modern untuk acara khitanan dengan fitur:
- 💬 Sistem komentar real-time dengan JSON storage
- 👥 Generator undangan personal untuk tamu
- 📱 Responsive design (mobile-first)
- 🎵 Background music
- 🖼️ Gallery foto
- 💳 Amplop digital
- 🌙 Dark/Light theme
- 📊 Dashboard admin
- 🔄 Offline support

## 🚀 Cara Menjalankan Aplikasi

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Server
```bash
npm start
# atau
node server.js
```

### 3. Akses Aplikasi
- **Undangan Utama**: http://localhost:3000
- **Generator Tamu**: http://localhost:3000/generate.html
- **Dashboard Admin**: http://localhost:3000/dashboard.html

## 📁 Struktur File

```
undangan-4.x/
├── server.js                 # Server Express.js
├── index.html               # Halaman undangan utama
├── generate.html            # Generator undangan tamu
├── dashboard.html           # Dashboard admin
├── data/                    # Folder penyimpanan JSON
│   ├── comments.json        # Data komentar
│   ├── guests.json          # Data tamu
│   └── settings.json        # Pengaturan aplikasi
├── assets/                  # Asset gambar, musik, video
├── css/                     # Styling CSS
├── js/                      # JavaScript modules
│   ├── request-patch.js     # Patch untuk local server
│   └── app/                 # Komponen aplikasi
└── dist/                    # Bundle JavaScript
```

## 🛠️ API Endpoints

### Comments API
- `GET /api/comments` - Ambil semua komentar
- `POST /api/comments` - Tambah komentar baru
- `PUT /api/comments/:uuid/like` - Like komentar

### Guests API
- `GET /api/guests` - Ambil semua tamu
- `POST /api/guests` - Tambah tamu baru
- `DELETE /api/guests/:id` - Hapus tamu
- `DELETE /api/guests` - Hapus semua tamu

### Settings API
- `GET /api/settings` - Ambil pengaturan
- `PUT /api/settings` - Update pengaturan

### Stats API
- `GET /api/stats` - Ambil statistik aplikasi

## 💾 Penyimpanan Data

Aplikasi menggunakan file JSON untuk penyimpanan:

### comments.json
```json
{
  "comments": [
    {
      "uuid": "unique-id",
      "id": 1,
      "name": "Nama Pengirim",
      "presence": true,
      "comment": "Isi komentar",
      "created_at": "2025-01-01T00:00:00.000Z",
      "like_count": 0
    }
  ],
  "total": 1,
  "lastId": 1
}
```

### guests.json
```json
{
  "guests": [
    {
      "id": 1,
      "name": "Ahmad",
      "type": "Bapak",
      "category": "Keluarga",
      "full_name": "Bapak Ahmad",
      "slug": "ahmad",
      "invitation_link": "index.html?to=Bapak%20Ahmad",
      "views": 0,
      "comment_count": 0,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "lastId": 1
}
```

## 🔧 Fitur Utama

### 1. Generator Undangan Tamu
- Buat link undangan personal untuk setiap tamu
- Kategori tamu (Keluarga, Teman, Tetangga, dll)
- Export daftar tamu ke CSV
- Statistik views dan komentar per tamu

### 2. Sistem Komentar
- Komentar real-time
- Like system
- Support GIF
- Offline support dengan sync otomatis
- Format text seperti WhatsApp

### 3. Dashboard Admin
- Statistik lengkap
- Manajemen komentar
- Manajemen tamu
- Pengaturan acara

### 4. Fitur Offline
- Cache komentar saat offline
- Sync otomatis saat online kembali
- Progressive Web App (PWA) ready

## 🎨 Customization

### Mengubah Data Acara
Edit file `data/settings.json`:
```json
{
  "event": {
    "title": "Khitanan Ahmad",
    "childName": "Ahmad bin Bapak Fulan",
    "date": "2025-09-14",
    "time": "08:00:00",
    "location": "Alamat lengkap acara"
  }
}
```

### Mengubah Tema
- Edit file CSS di folder `css/`
- Gambar di folder `assets/images/`
- Musik di folder `assets/music/`

## 🔒 Keamanan

- CORS protection
- Helmet.js untuk security headers
- Input validation
- Rate limiting (dapat ditambahkan)
- XSS protection

## 📱 Mobile Support

- Mobile-first design
- Touch-friendly interface
- Optimized untuk WhatsApp sharing
- PWA features

## 🐛 Troubleshooting

### Server tidak bisa start
```bash
# Pastikan port 3000 tidak digunakan
netstat -an | findstr :3000

# Gunakan port lain jika perlu
set PORT=8080 && npm start
```

### CORS Error
- Pastikan server berjalan di localhost:3000
- Check browser console untuk error details
- Restart server jika diperlukan

### Data hilang
- Check folder `data/` ada file JSON
- Backup file JSON secara berkala
- Gunakan version control (Git)

## 📧 Support

Jika ada masalah atau pertanyaan:
1. Check console browser untuk error
2. Check terminal server untuk log
3. Restart server dan browser
4. Pastikan semua dependencies terinstall

## 🚀 Deployment

### Local Network
```bash
# Jalankan server dengan IP local
node server.js
# Akses dari device lain: http://[YOUR-IP]:3000
```

### Production
- Upload file ke hosting
- Setup Node.js environment
- Install dependencies: `npm install --production`
- Setup PM2 untuk process management
- Configure reverse proxy (Nginx)

## 📄 License

MIT License - Free to use and modify

---

**Selamat menggunakan! 🎉**

Semoga acara khitanan Ahmad berjalan lancar dan meriah! ✨
