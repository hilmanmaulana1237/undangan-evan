# Sistem JSON Storage - Undangan Khitanan Ahmad

## 📁 Overview

Sistem ini menggunakan penyimpanan JSON lokal tanpa memerlukan server. Semua data disimpan di browser menggunakan localStorage dan file JSON sebagai fallback.

## 🗂️ Struktur File

### File JSON Storage System:
- `js/json-storage.js` - Core storage system
- `js/json-patch.js` - Patch untuk mengubah request ke JSON storage
- `index-json.html` - Halaman utama undangan dengan JSON storage
- `generate-json.html` - Generator tamu dengan JSON storage

### File Data JSON:
- `data/comments.json` - Data komentar/ucapan
- `data/guests.json` - Data daftar tamu  
- `data/settings.json` - Pengaturan aplikasi

## 🚀 Cara Menggunakan

### 1. Untuk Halaman Undangan
```html
<!-- Buka file index-json.html di browser -->
file:///path/to/undangan-4.x/index-json.html
```

### 2. Untuk Generator Tamu
```html
<!-- Buka file generate-json.html di browser -->
file:///path/to/undangan-4.x/generate-json.html
```

## 📋 Fitur Utama

### ✅ Sistem Komentar/Ucapan
- Tambah ucapan dan doa
- Pilih status kehadiran (Hadir/Tidak Hadir)
- Tampil real-time tanpa reload
- Penyimpanan otomatis di localStorage

### ✅ Manajemen Tamu
- Tambah tamu baru dengan gelar dan kategori
- Generate link undangan personal
- Export daftar tamu ke CSV
- Statistik views dan komentar

### ✅ Fitur Multimedia
- Background music dengan kontrol play/pause
- Galeri foto dengan modal view
- Countdown timer ke tanggal acara
- Responsive design untuk semua device

### ✅ Sharing & Social Media
- Share via WhatsApp dengan template pesan
- Share via Telegram
- Copy link undangan personal
- QR Code untuk akses mudah (coming soon)

## 🔧 Konfigurasi

### Mengubah Data Acara
Edit file `data/settings.json`:
```json
{
  "event": {
    "title": "Khitanan Ahmad",
    "childName": "Ahmad bin Bapak Fulan", 
    "fatherName": "Bapak Fulan",
    "motherName": "Ibu Fulanah",
    "date": "2025-09-14",
    "time": "08:00:00",
    "location": "Alamat Lengkap Acara",
    "mapUrl": "https://goo.gl/maps/link"
  },
  "contact": {
    "phone": "0812345678",
    "bankName": "Bank Central Asia", 
    "bankAccount": "1234567890",
    "bankHolder": "Nama Pemegang Rekening"
  }
}
```

### Menambah Tamu Default
Edit file `data/guests.json`:
```json
{
  "guests": [
    {
      "id": 1,
      "name": "Nama Tamu",
      "type": "Bapak",
      "category": "Keluarga",
      "full_name": "Bapak Nama Tamu",
      "slug": "nama-tamu",
      "invitation_link": "index-json.html?to=Bapak%20Nama%20Tamu",
      "views": 0,
      "comment_count": 0,
      "created_at": "2025-08-24T05:28:35.553Z"
    }
  ],
  "total": 1,
  "lastId": 1
}
```

## 💾 Penyimpanan Data

### Local Storage Keys:
- `json_comments` - Data ucapan/komentar
- `json_guests` - Data daftar tamu
- `json_settings` - Pengaturan aplikasi

### Backup & Restore:
```javascript
// Backup data
const backup = {
  comments: localStorage.getItem('json_comments'),
  guests: localStorage.getItem('json_guests'), 
  settings: localStorage.getItem('json_settings')
};

// Restore data
localStorage.setItem('json_comments', backup.comments);
localStorage.setItem('json_guests', backup.guests);
localStorage.setItem('json_settings', backup.settings);
```

## 🎨 Customization

### Mengubah Tema Warna
Edit di file CSS atau inline style:
```css
:root {
  --primary-color: #ffc107; /* Kuning */
  --secondary-color: #28a745; /* Hijau */
  --accent-color: #dc3545; /* Merah */
}
```

### Mengganti Background
Ganti file `assets/images/bg.webp` dengan gambar yang diinginkan.

### Mengganti Music
Ganti file `assets/music/pure-love-304010.mp3` dengan musik yang diinginkan.

## 📱 Kompatibilitas

### Browser Support:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Features:
- ✅ Responsive design
- ✅ Touch friendly
- ✅ Offline support
- ✅ PWA ready
- ✅ Fast loading

## 🔍 Troubleshooting

### Problem: Data tidak tersimpan
**Solution:** Pastikan browser mendukung localStorage dan tidak dalam mode incognito.

### Problem: File JSON tidak terbaca
**Solution:** Pastikan struktur folder benar dan akses file via HTTP (bukan file://).

### Problem: Music tidak autoplay
**Solution:** Browser modern memerlukan user interaction sebelum autoplay audio.

### Problem: Gambar tidak muncul
**Solution:** Periksa path file gambar di folder `assets/images/`.

## 📈 Statistics & Analytics

### Data yang Dilacak:
- Total views halaman
- Total ucapan/komentar
- Total tamu yang ditambahkan
- Views per tamu (untuk link personal)

### Export Data:
- CSV export untuk daftar tamu
- JSON backup untuk semua data
- Print-friendly untuk ucapan

## 🔮 Roadmap

### Coming Soon:
- [ ] QR Code generator untuk link undangan
- [ ] WhatsApp direct integration
- [ ] Photo gallery management
- [ ] RSVP tracking
- [ ] Guest check-in system
- [ ] Email invitation sender
- [ ] Advanced analytics dashboard

## 🤝 Support

Untuk bantuan lebih lanjut, silakan:
1. Baca dokumentasi lengkap di README.md
2. Periksa file TROUBLESHOOT.md untuk masalah umum
3. Kontribusi di GitHub repository

---

**Note:** Sistem ini dirancang untuk bekerja tanpa server, semua data tersimpan lokal di browser. Untuk deployment produksi, pertimbangkan menggunakan server untuk keamanan dan skalabilitas yang lebih baik.
