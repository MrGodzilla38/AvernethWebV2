#!/bin/bash

# Kullanici rolü atama scripti
# Kullaným: ./assign-role.sh <kullanici_adi> <yeni_rol>

if [ $# -ne 2 ]; then
    echo "Kullaným: $0 <kullanici_adi> <yeni_rol>"
    echo "Örnek: $0 UstaGodzilla Admin"
    echo "Mevcut roller: Kurucu, Admin, Developer, Moderator, Rehber, Mimar"
    exit 1
fi

USERNAME=$1
NEW_ROLE=$2

# MySQL þifresi (ayarlarýnýzý deðiþtirin)
MYSQL_PASSWORD="Averneth123!"

# Geçerli roller listesi
VALID_ROLES=("Kurucu" "Admin" "Developer" "Moderator" "Rehber" "Mimar")

# Rol validasyonu
if [[ ! " ${VALID_ROLES[@]} " =~ " ${NEW_ROLE} " ]]; then
    echo "Hata: Geçersiz rol '$NEW_ROLE'"
    echo "Geçerli roller: ${VALID_ROLES[*]}"
    exit 1
fi

echo "Kullanıcı: $USERNAME"
echo "Yeni Rol: $NEW_ROLE"
echo "------------------------"

# MySQL baðlantý kontrolü
if ! mysql -u root -p"$MYSQL_PASSWORD" -e "USE nLogin;" 2>/dev/null; then
    echo "Hata: MySQL baðlantýsý veya veritabaný eriþimi baþarýsýz"
    exit 1
fi

# Mevcut rolü göster
echo "Mevcut rol:"
mysql -u root -p"$MYSQL_PASSWORD" nLogin -e "SELECT last_name, \`rank\` FROM nlogin WHERE last_name = '$USERNAME';" 2>/dev/null

# Kullanýcýnýn var olup olmadýðýný kontrol et
USER_EXISTS=$(mysql -u root -p"$MYSQL_PASSWORD" nLogin -N -e "SELECT COUNT(*) FROM nlogin WHERE last_name = '$USERNAME';" 2>/dev/null)

if [ "$USER_EXISTS" -eq 0 ]; then
    echo "Hata: Kullanýcý '$USERNAME' bulunamadý"
    exit 1
fi

# Rolü güncelle
echo "Rol güncelleniyor..."
mysql -u root -p"$MYSQL_PASSWORD" nLogin -e "UPDATE nlogin SET \`rank\` = '$NEW_ROLE' WHERE last_name = '$USERNAME';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "Yeni rol:"
    mysql -u root -p"$MYSQL_PASSWORD" nLogin -e "SELECT last_name, \`rank\` FROM nlogin WHERE last_name = '$USERNAME';" 2>/dev/null
    echo "Rol başarıyla güncellendi!"
else
    echo "Hata: Rol güncellenirken bir sorun oluþtu"
    exit 1
fi
