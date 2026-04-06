# Averneth Web

Averneth gaming platform için modern Next.js frontend, MySQL kimlik doğrulama ve kullanıcı yönetimi ile.

## 🚀 Özellikler

- **Next.js 14** App Router ile
- **TypeScript** desteği
- **Tailwind CSS** stil için
- **MySQL** nLogin sistemi ile veritabanı entegrasyonu
- **JWT Kimlik Doğrulama** bcrypt şifreleme ile
- **Responsive Tasarım**
- **Production Ready** PM2 desteği ile

## 📋 Gereksinimler

- Node.js 18+
- MySQL veritabanı nLogin tablosu ile
- npm veya yarn

## 🛠️ Kurulum

### Local Geliştirme

1. **Repository'i klonlayın**
```bash
git clone https://github.com/kullanici-adiniz/averneth-web.git
cd averneth-web
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Ortam değişkenlerini ayarlayın**
```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını veritabanı yapılandırmanızla düzenleyin:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=sifreniz
MYSQL_DATABASE=nLogin
JWT_SECRET=gizli-jwt-anahtariniz
```

4. **Geliştirme sunucusunu çalıştırın**
```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 🗄️ Veritabanı Kurulumu

Uygulama aşağıdaki tablo yapısına sahip bir MySQL veritabanı bekler:

```sql
CREATE TABLE nlogin (
  ai INT AUTO_INCREMENT PRIMARY KEY,
  last_name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  last_ip VARCHAR(45),
  last_seen TIMESTAMP,
  email VARCHAR(255),
  rank INT DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0.00
);
```

## 🚀 Deployment

### Production Deployment

1. **Production için build edin**
```bash
npm run build:prod
```

2. **Production sunucusunu başlatın**
```bash
npm run start:prod
```

### PM2 ile Sunucu Deployment

1. **PM2 yükleyin**
```bash
npm install -g pm2
```

2. **Ecosystem config ile deploy edin**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### GitHub Actions Otomatik Deployment

Bu repository'de GitHub Actions ile otomatik deployment bulunur. GitHub repository'nizde şu secrets'leri ayarlayın:

- `SERVER_HOST`: Sunucu IP/adresiniz
- `SERVER_USER`: SSH kullanıcı adı  
- `SERVER_KEY`: SSH private key
- `SERVER_PATH`: Deployment yolu (örn: `/var/www/averneth-web`)

## 📁 Proje Yapısı

```
averneth-web/
├── src/
│   ├── app/              # Next.js App Router sayfaları
│   ├── lib/              # Yardımcı fonksiyonlar ve veritabanı bağlantısı
│   └── components/       # React bileşenleri
├── public/               # Statik dosyalar
├── .env.local.example    # Ortam değişkenleri şablonu
├── .env.production       # Production ortam değişkenleri
├── ecosystem.config.js   # PM2 yapılandırması
├── next.config.js        # Next.js yapılandırması
├── DEPLOYMENT.md         # Detaylı deployment rehberi
└── .github/workflows/    # GitHub Actions workflow'ları
```

## 🔧 Yapılandırma

### Ortam Değişkenleri

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `MYSQL_HOST` | MySQL host | `127.0.0.1` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_USER` | MySQL kullanıcı adı | `root` |
| `MYSQL_PASSWORD` | MySQL şifresi | - |
| `MYSQL_DATABASE` | Veritabanı adı | `nLogin` |
| `JWT_SECRET` | JWT imzalama anahtarı | - |
| `JWT_EXPIRES_DAYS` | Token sona erme günü | `7` |
| `BCRYPT_ROUNDS` | Şifreleme turları | `10` |

### Veritabanı Kolon Eşleştirme

Uygulama nLogin tablosu için yapılandırılabilir kolon adları kullanır:

```env
NLOGIN_TABLE=nlogin
NLOGIN_COL_ID=ai
NLOGIN_COL_NAME=last_name
NLOGIN_COL_PASSWORD=password
NLOGIN_COL_ADDRESS=last_ip
NLOGIN_COL_LASTLOGIN=last_seen
NLOGIN_COL_EMAIL=email
NLOGIN_COL_RANK=rank
NLOGIN_COL_BALANCE=balance
```

## 📝 Mevcut Script'ler

- `npm run dev` - Geliştirme sunucusunu başlat
- `npm run build` - Production için build et
- `npm run start` - Production sunucusunu başlat
- `npm run build:prod` - Production ortamında build et
- `npm run start:prod` - Production ortamında başlat
- `npm run deploy` - Build et ve production'da başlat
- `npm run lint` - ESLint çalıştır

## 🔐 Güvenlik Özellikleri

- **Şifreleme**: bcrypt ile yapılandırılabilir turlarda şifreleme
- **JWT Kimlik Doğrulama**: Güvenli token tabanlı kimlik doğrulama
- **Ortam Değişkenleri**: Hassas veriler repository'e commit edilmez
- **CORS Koruması**: Yapılandırılabilir origin kısıtlamaları
- **Input Validasyon**: SQL injection önleme

## 🌐 API Entegrasyonu

Uygulama, port 3001'de çalışan Averneth API sunucusu ile entegre olur. API route'ları Next.js üzerinden otomatik olarak yönlendirilir:

- Frontend port 3000'de çalışır
- `/api/*` istekleri `http://localhost:3001/api/*`'e yönlendirilir

## 📱 Responsive Tasarım

Tailwind CSS ile aşağıdaki cihazlarda çalışan responsive tasarım:
- Desktop (1920px+)
- Tablet (768px - 1024px)  
- Mobile (320px - 768px)

## 🤝 Katkıda Bulunma

1. Repository'i fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik ekle'`)
4. Branch'e push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasını inceleyin.

## 🆘 Destek

Destek ve sorular için:
- Bu repository'de issue oluşturun
- Deployment sorunları için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasını kontrol edin
- Ortam değişkenleri yapılandırmasını gözden geçirin

## 🔗 İlgili Projeler

- **[averneth-api](https://github.com/kullanici-adiniz/averneth-api)** - Backend API sunucusu
- **[nLogin](https://github.com/kullanici-adiniz/nlogin)** - Kimlik doğrulama eklentisi

---

**Averneth gaming community için ❤️ ile yapıldı**
