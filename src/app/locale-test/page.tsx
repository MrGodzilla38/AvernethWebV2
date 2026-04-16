'use client';

import { useState, useEffect } from 'react';
import UserProfile from '../../components/UserProfile';

interface User {
  ai: number;
  last_name: string;
  email: string;
  locale: string;
  rank: string;
  balance: number;
  last_seen: string;
}

export default function LocaleTest() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLocale, setSelectedLocale] = useState('tr-TR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translations: Record<string, Record<string, string>> = {
    'tr-TR': {
      'title': 'Locale Test Sayfası',
      'description': 'Farklı yerel ayarları test edin ve arayüzün kullanıcı tercihlerine nasıl uyum sağladığını görün.',
      'select_locale': 'Arayüz Dili Seç',
      'users_list': 'Kullanıcı Listesi',
      'name': 'İsim',
      'email': 'E-posta',
      'current_locale': 'Mevcut Dil',
      'change_locale': 'Dil Değiştir',
      'rank': 'Rütbe',
      'balance': 'Bakiye',
      'loading': 'Yükleniyor...',
      'error': 'Hata',
      'minecraft_heads': 'Minecraft Başlıkları',
      'head_status': 'Başlık Durumu',
      'real_skin': 'Orijinal Skin',
      'steve_fallback': 'Steve (Varsayılan)',
      'refresh_heads': 'Başlıkları Yenile',
      'total_users': 'Toplam Kullanıcı',
      'online_users': 'Çevrimiçi',
      'last_login': 'Son Giriş',
    },
    'en-US': {
      'title': 'Locale Test Page',
      'description': 'Test different locales and see how the interface adapts to user preferences.',
      'select_locale': 'Select Interface Language',
      'users_list': 'Users List',
      'name': 'Name',
      'email': 'Email',
      'current_locale': 'Current Locale',
      'change_locale': 'Change Locale',
      'rank': 'Rank',
      'balance': 'Balance',
      'loading': 'Loading...',
      'error': 'Error',
      'minecraft_heads': 'Minecraft Heads',
      'head_status': 'Head Status',
      'real_skin': 'Real Skin',
      'steve_fallback': 'Steve (Default)',
      'refresh_heads': 'Refresh Heads',
      'total_users': 'Total Users',
      'online_users': 'Online',
      'last_login': 'Last Login',
    }
  };

  const t = (key: string) => translations[selectedLocale]?.[key] || key;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateUserLocale = async (userId: number, newLocale: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/locale`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      });
      if (!response.ok) throw new Error('Failed to update locale');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const availableLocales = ['tr-TR', 'en-US', 'fr-FR', 'de-DE', 'zh-CN'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('error')}</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('refresh_heads')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-2">{t('description')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-sm text-gray-500">{t('total_users')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.floor(users.length * 0.7)}</div>
                <div className="text-sm text-gray-500">{t('online_users')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Locale Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('select_locale')}</h2>
          <div className="flex flex-wrap gap-2">
            {availableLocales.map((locale) => (
              <button
                key={locale}
                onClick={() => setSelectedLocale(locale)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedLocale === locale
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {locale === 'tr-TR' && '🇹🇷 Türkçe'}
                {locale === 'en-US' && '🇺🇸 English'}
                {locale === 'fr-FR' && '🇫🇷 Français'}
                {locale === 'de-DE' && '🇩🇪 Deutsch'}
                {locale === 'zh-CN' && '🇨🇳 中文'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t('minecraft_heads')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('head_status')}: {t('real_skin')} ✅ / {t('steve_fallback')} ❌
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <div key={user.ai} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <UserProfile user={user} size="large" />
                  
                  {/* Locale Change Controls */}
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{t('change_locale')}:</span>
                      <select
                        value={user.locale}
                        onChange={(e) => updateUserLocale(user.ai, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableLocales.map((locale) => (
                          <option key={locale} value={locale}>
                            {locale}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
