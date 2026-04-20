# AvernethWebV2

Averneth gaming platform için modern Next.js frontend, MySQL kimlik doğrulama ve kullanıcı yönetimi ile.

## 🚀 Özellikler

- **Next.js 14** App Router ile
- **TypeScript** desteği
- **Tailwind CSS** stil için
- **MySQL** nLogin sistemi ile veritabanı entegrasyonu
- **JWT Kimlik Doğrulama** bcrypt şifreleme ile
- **Responsive Tasarım**
- **Production Ready** PM2 desteği ile

## 📋 Sistem Gereksinimleri

### Minimum Sistem Gereksinimleri
- **İşletim Sistemi**: Windows 10+, macOS 10.15+, Ubuntu 18.04+ veya benzeri Linux dağıtımları
- **Node.js**: Sürüm 18.0 veya üstü (LTS sürümü önerilir)
- **npm**: Sürüm 8.0 veya üstü (Node.js ile birlikte gelir)
- **MySQL**: Sürüm 5.7+ veya 8.0+
- **RAM**: Minimum 2GB, önerilen 4GB+
- **Depolama**: Minimum 1GB boş alan

### Geliştirme Ortamı Gereksinimleri
- **VS Code** veya tercih edilen kod editörü
- **Git** sürüm kontrol sistemi
- **MySQL Command Line Client** veya **phpMyAdmin** gibi veritabanı yönetim aracı

### Opsiyonel Araçlar
- **PM2**: Production sunucu yönetimi için
- **Docker**: Konteynerize deployment için

## 🛠️ Kurulum

### Adım 1: Node.js Kurulumu

**Windows için:**
1. [Node.js resmi sitesinden](https://nodejs.org/) LTS sürümünü indirin
2. Installer'ı çalıştırın ve "Add to PATH" seçeneğini işaretlediğinizden emin olun
3. Kurulumu tamamladıktan sonra komut istemini açın ve doğrulayın:
```bash
node --version
npm --version
```

**macOS için:**
```bash
# Homebrew ile
brew install node

# Veya doğrudan indirme
# https://nodejs.org/
```

**Linux (Ubuntu/Debian) için:**
```bash
# NodeSource repository ekleyin
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Doğrulama
node --version
npm --version
```

### Adım 2: MySQL Veritabanı Kurulumu

**Windows için:**
1. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) indirin
2. Installer'ı çalıştırın ve "Developer Default" seçeneğini seçin
3. Root şifresini belirleyin ve güvenli bir yere kaydedin
4. MySQL Command Line Client'ı kurduğunuzdan emin olun

**macOS için:**
```bash
# Homebrew ile
brew install mysql
brew services start mysql

# Güvenlik kurulumu
mysql_secure_installation
```

**Linux (Ubuntu/Debian) için:**
```bash
sudo apt update
sudo apt install mysql-server mysql-client
sudo mysql_secure_installation
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Adım 3: Veritabanı ve Tablo Oluşturma

1. **MySQL'e root kullanıcı olarak giriş yapın:**
```bash
mysql -u root -p
# Şifrenizi girin
```

2. **Veritabanı oluşturun:**
```sql
CREATE DATABASE nLogin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
```

3. **Kullanıcı oluşturun (opsiyonel ama önerilir):**
```sql
CREATE USER 'averneth'@'localhost' IDENTIFIED BY 'guvenli_sifre';
GRANT ALL PRIVILEGES ON nLogin.* TO 'averneth'@'localhost';
FLUSH PRIVILEGES;
```

4. **nLogin tablosunu oluşturun:**
```sql
USE nLogin;

CREATE TABLE nlogin (
  ai INT AUTO_INCREMENT PRIMARY KEY,
  last_name VARCHAR(255) NOT NULL,
  unique_id VARCHAR(255),
  mojang_id VARCHAR(255),
  bedrock_id VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  premium BOOLEAN DEFAULT FALSE,
  last_ip VARCHAR(45),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(255),
  discord VARCHAR(255),
  rank VARCHAR(50) DEFAULT 'Oyuncu',
  balance DECIMAL(10,2) DEFAULT 0.00,
  locale VARCHAR(10) DEFAULT 'tr_TR',
  settings TEXT,
  INDEX idx_username (last_name),
  INDEX idx_email (email),
  INDEX idx_last_seen (last_seen),
  INDEX idx_creation_date (creation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Tabloyu kontrol edin
DESCRIBE nlogin;
```

5. **Destek Talebi (Ticket) Sistemi Tablolarını Oluşturun:**
```sql
# Destek Talepleri tablosu
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  ip_address VARCHAR(100),
  attachment LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Ticket Mesajları tablosu (yönetici-kullanıcı mesajlaşması)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  sender VARCHAR(100) NOT NULL,
  sender_rank VARCHAR(50) DEFAULT 'Oyuncu',
  sender_avatar VARCHAR(255),
  content TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Tabloları kontrol edin
SHOW TABLES;
DESCRIBE support_tickets;
DESCRIBE ticket_messages;
```

6. **MySQL'den çıkış yapın:**
```sql
EXIT;
```

### Adım 4: Proje Kurulumu

1. **Repository'i klonlayın:**
```bash
git clone https://github.com/MrGodzilla38/AvernethWebV2.git
cd AvernethWebV2
```

2. **Proje dizinini kontrol edin:**
```bash
ls -la
# README.md, package.json, src/ klasörünü görmelisiniz
```

3. **Bağımlılıkları yükleyin:**
```bash
# npm ile
npm install

# Veya yarn ile (eğer kuruluysa)
yarn install
```

4. **Kurulumu doğrulayın:**
```bash
# node_modules klasörünün oluştuğunu kontrol edin
ls node_modules

# Package versiyonlarını kontrol edin
npm list --depth=0
```

### Adım 5: Ortam Değişkenleri Yapılandırması

1. **Ortam değişkenleri şablonunu kopyalayın:**
```bash
cp .env.local.example .env.local
```

2. **.env.local dosyasını düzenleyin:**
```bash
# Windows (Notepad ile)
notepad .env.local

# macOS/Linux (nano ile)
nano .env.local
```

3. **Aşağıdaki yapılandırmayı ekleyin:**
```env
# MySQL Veritabanı Ayarları
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root              # Veya oluşturduğunuz kullanıcı adı
MYSQL_PASSWORD=sifreniz       # MySQL şifreniz
MYSQL_DATABASE=nLogin

# JWT Ayarları
JWT_SECRET=en_az_32_karakter_gizli_jwt_anahtariniz_buraya
JWT_EXPIRES_DAYS=7

# Şifreleme Ayarları
BCRYPT_ROUNDS=10

# Tablo Kolon Eşleştirmesi (nLogin tablosu için)
NLOGIN_TABLE=nlogin
NLOGIN_COL_ID=ai
NLOGIN_COL_NAME=last_name
NLOGIN_COL_PASSWORD=password
NLOGIN_COL_ADDRESS=last_ip
NLOGIN_COL_LASTLOGIN=last_seen
NLOGIN_COL_EMAIL=email
NLOGIN_COL_RANK=rank
NLOGIN_COL_BALANCE=balance
NLOGIN_COL_CREATED=creation_date

# Development Ayarları
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

4. **Güvenlik uyarısı:** `.env.local` dosyasını asla GitHub'a yüklemeyin! Bu dosya otomatik olarak .gitignore ile dışlanmıştır.

### Adım 6: Veritabanı Bağlantısı Testi

1. **Veritabanı bağlantısını test etmek için:**
```bash
# MySQL'e bağlanmayı deneyin
mysql -h 127.0.0.1 -P 3306 -u root -p nLogin
# Şifrenizi girin ve "Welcome to the MySQL monitor" mesajını görün
```

2. **Tablo varlığını kontrol edin:**
```sql
USE nLogin;
SHOW TABLES;
DESCRIBE nlogin;
EXIT;
```

### Adım 7: Uygulamayı Çalıştırma

1. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

2. **Sunucu başlangıcını kontrol edin:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

3. **Tarayıcıda açın:**
   - Adres: [http://localhost:3000](http://localhost:3000)
   - Sayfanın düzgün yüklendiğini doğrulayın

4. **Hata kontrolü:**
   - Konsolda hata mesajı olup olmadığını kontrol edin
   - Veritabanı bağlantı hatası alırsanız, .env.local ayarlarınızı kontrol edin

## 🗄️ Veritabanı Kurulumu

### Tablo Yapısı

Uygulama aşağıdaki optimize edilmiş tablo yapısına sahip bir MySQL veritabanı bekler:

```sql
CREATE TABLE nlogin (
  ai INT AUTO_INCREMENT PRIMARY KEY,
  last_name VARCHAR(255) NOT NULL,
  unique_id VARCHAR(255),
  mojang_id VARCHAR(255),
  bedrock_id VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  premium BOOLEAN DEFAULT FALSE,
  last_ip VARCHAR(45),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(255),
  discord VARCHAR(255),
  rank VARCHAR(50) DEFAULT 'Oyuncu',
  balance DECIMAL(10,2) DEFAULT 0.00,
  locale VARCHAR(10) DEFAULT 'tr_TR',
  settings TEXT,
  INDEX idx_username (last_name),
  INDEX idx_email (email),
  INDEX idx_last_seen (last_seen),
  INDEX idx_creation_date (creation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Veritabanı Optimizasyonu

**Performans için ek indeksler:**
```sql
-- Sık kullanılan sorgular için ek indeksler
CREATE INDEX idx_rank_balance ON nlogin(rank, balance);
CREATE INDEX idx_last_login_ip ON nlogin(last_seen, last_ip);
```

### Destek Talebi (Ticket) Sistemi Tabloları

Destek talebi sistemi için aşağıdaki tablolar otomatik olarak oluşturulur:

**support_tickets** - Ana destek talepleri tablosu:
```sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,           -- Kullanıcı adı
  email VARCHAR(255) NOT NULL,          -- Kullanıcı e-postası
  category VARCHAR(100) NOT NULL,       -- Kategori (Teknik Sorun, Hile Şikayeti, vb.)
  subject VARCHAR(255) NOT NULL,      -- Konu başlığı
  message TEXT NOT NULL,                -- Açıklama mesajı
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  ip_address VARCHAR(100),              -- IP adresi
  attachment LONGTEXT,                  -- Ek dosya (base64, opsiyonel)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**ticket_messages** - Ticket mesajlaşma tablosu:
```sql
CREATE TABLE IF NOT EXISTS ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,               -- İlişkili ticket ID
  sender VARCHAR(100) NOT NULL,         -- Mesaj gönderen
  sender_rank VARCHAR(50) DEFAULT 'Oyuncu',
  sender_avatar VARCHAR(255),           -- Avatar URL
  content TEXT NOT NULL,                -- Mesaj içeriği
  is_staff BOOLEAN DEFAULT FALSE,       -- Yetkili mesajı mı?
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Not:** Bu tablolar API ilk çalıştığında otomatik olarak oluşturulur. Manuel oluşturmanıza gerek yoktur.

**Örnek veri ekleme (test için):**
```sql
INSERT INTO nlogin (last_name, password, email, rank, balance) VALUES 
('testuser1', '$2b$10$hashed_password_here', 'user1@example.com', 'Admin', 100.00),
('testuser2', '$2b$10$another_hashed_password', 'user2@example.com', 'Oyuncu', 50.00);
```

### Veritabanı Bakımı

**Regülar bakım komutları:**
```sql
-- Tablo optimizasyonu
OPTIMIZE TABLE nlogin;

-- İstatistikleri güncelle
ANALYZE TABLE nlogin;

-- Tablo kontrolü
CHECK TABLE nlogin;
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
- `SERVER_PATH`: Deployment yolu (örn: `/var/www/AvernethWebV2`)

## 📁 Proje Yapısı

```
AvernethWebV2/
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
NLOGIN_COL_CREATED=creation_date
```

## 📝 Mevcut Script'ler

- `npm run dev` - Geliştirme sunucusunu başlat
- `npm run build` - Production için build et
- `npm run start` - Production sunucusunu başlat
- `npm run build:prod` - Production ortamında build et
- `npm run start:prod` - Production ortamında başlat
- `npm run deploy` - Build et ve production'da başlat
- `npm run lint` - ESLint çalıştır

### Kullanıcı Yönetim Script'leri

#### Rol Atama Script'i (`scripts/assign-role.sh`)

Bu script ile kullanıcıların rollerini kolayca değiştirebilirsiniz.

**Kullanım:**
```bash
bash ./scripts/assign-role.sh <kullanıcı_adi> <yeni_rol>
```

**Geçerli roller:**
- `Oyuncu` (varsayılan)
- `Rehber`
- `Mimar`
- `Moderator`
- `Developer`
- `Admin`
- `Kurucu`

**Örnekler:**
```bash
# Kullanıcıyı Admin yap
bash ./scripts/assign-role.sh UstaGodzilla Admin

# Kullanıcıyı Rehber yap
./scripts/assign-role.sh Oyuncu123 Rehber
```

**Script'in özellikleri:**
- Rol validasyonu (sadece geçerli roller kabul edilir)
- MySQL bağlantısı kontrolü
- Kullanıcı varlığı kontrolü
- Mevcut ve yeni rolü gösterir
- Hata durumlarında açıklamalı mesajlar

**Gereksinimler:**
- MySQL sunucusunun çalışıyor olması
- `nLogin` veritabanının mevcut olması
- Script'in çalıştırma izni (`chmod +x scripts/assign-role.sh`)

**Not:** Fish shell kullananlar `bash ./scripts/assign-role.sh` olarak çalıştırmalı.

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

## 🔧 Sorun Giderme

### Yaygın Kurulum Sorunları

**❌ "node: command not found" Hatası**
```bash
# Çözüm: Node.js PATH'e eklenmemiş
# Windows: Node.js'i yeniden kurun ve "Add to PATH" seçeneğini işaretleyin
# macOS/Linux: ~/.bashrc veya ~/.zshrc dosyasına ekleyin
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**❌ "Access denied for user 'root'@'localhost'" Hatası**
```bash
# Çözüm 1: MySQL şifresini sıfırla
sudo mysql_secure_installation

# Çözüm 2: MySQL servisini yeniden başlat
# Windows: Services'de MySQL servisini yeniden başlat
# Linux: sudo systemctl restart mysql
# macOS: brew services restart mysql
```

**❌ "Can't connect to MySQL server" Hatası**
```bash
# MySQL servisinin çalıştığını kontrol et
# Windows: net start mysql
# Linux: sudo systemctl status mysql
# macOS: brew services list | grep mysql

# MySQL portunu kontrol et
netstat -an | grep 3306
```

**❌ "npm install fails with permissions" Hatası**
```bash
# Çözüm 1: npm cache temizle
npm cache clean --force

# Çözüm 2: Global modüller için doğru izinler (Linux/macOS)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Çözüm 3: npx kullan
npx npm install
```

**❌ "Port 3000 already in use" Hatası**
```bash
# Port kullanan process'i bul
netstat -tulpn | grep :3000
# Windows: netstat -ano | findstr :3000

# Process'i sonlandır
# Linux/macOS: kill -9 <PID>
# Windows: taskkill /PID <PID> /F

# Veya farklı port kullan
npm run dev -- -p 3001
```

**❌ "Database connection failed" Hatası**
```bash
# Kontrol listesi:
# 1. MySQL servisinin çalıştığından emin olun
# 2. .env.local dosyasındaki bilgilerin doğru olduğundan emin olun
# 3. Veritabanı ve tablonun oluşturulduğundan emin olun
# 4. MySQL kullanıcısının yetkilerinin olduğundan emin olun

# Test için manuel bağlantı
mysql -h 127.0.0.1 -P 3306 -u root -p nLogin
```

### Geliştirme Sorunları

**❌ Hot reload çalışmıyor**
```bash
# Node.js sürümünü kontrol et
node --version

# Next.js cache temizle
rm -rf .next
npm run dev
```

**❌ CSS stilleri yüklenmiyor**
```bash
# Tailwind CSS kurulumunu kontrol et
npm list tailwindcss

# Config dosyasını kontrol et
cat tailwind.config.js
```

### Log Kontrolü

**Uygulama loglarını kontrol et:**
```bash
# Development logları
tail -f .next/server.log

# PM2 logları (production için)
pm2 logs

# MySQL logları
# Linux: sudo tail -f /var/log/mysql/error.log
# Windows: MySQL data dizinindeki .log dosyaları
```

### Yardım İçin

Eğer yukarıdaki çözümler sorununuzu çözmezse:
1. **GitHub Issues**: [Proje Issues Sayfası](https://github.com/MrGodzilla38/AvernethWebV2/issues)
2. **Hata raporu gönderirken şunları ekleyin:**
   - İşletim sistemi ve sürümü
   - Node.js ve MySQL sürümleri
   - Tam hata mesajı
   - .env.local dosyasındaki hassas bilgileri kaldırarak yapılandırma

---

**Averneth gaming community için ❤️ ile yapıldı**
