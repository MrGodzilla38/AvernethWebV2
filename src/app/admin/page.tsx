'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './admin.css';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRank, setEditingRank] = useState<string>('');
  const [editingBalance, setEditingBalance] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Check if user is logged in and has admin privileges
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUser({ username: data.username, rank: data.rank });
          
          // Check if user has admin privileges
          const allowedRanks = ['Admin', 'Kurucu', 'Developer'];
          if (!allowedRanks.includes(data.rank)) {
            window.location.href = '/'; // Redirect non-admin users
            return;
          }
        } else {
          window.location.href = '/auth'; // Redirect to login if not logged in
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth';
        return;
      }
      
      // Load users data if authenticated as admin
      await loadUsers();
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const copyIP = () => {
    navigator.clipboard.writeText('play.averneth.net');
    showToast('Sunucu IP kopyalandı!');
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.display = 'block';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRankBadgeClass = (rank: string) => {
    const rankLower = rank.toLowerCase();
    const rankMap: Record<string, string> = {
      'oyuncu': 'oyuncu',
      'rehber': 'rehber',
      'mimar': 'mimar',
      'moderator': 'moderator',
      'developer': 'developer',
      'admin': 'admin',
      'kurucu': 'kurucu'
    };
    return rankMap[rankLower] || 'oyuncu';
  };

  const startEditing = (user: any) => {
    setEditingUserId(user.id);
    setEditingRank(user.rank);
    setEditingBalance(user.balance?.toString() || '0');
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditingRank('');
    setEditingBalance('');
  };

  const saveUser = async (userId: number) => {
    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          rank: editingRank,
          balance: parseFloat(editingBalance)
        })
      });

      const data = await response.json();
      if (data.ok) {
        // Update the user in the local state
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, rank: editingRank, balance: parseFloat(editingBalance) }
            : u
        ));
        cancelEditing();
        showToast('Kullanıcı güncellendi!');
      } else {
        showToast('Hata: ' + (data.error || 'Kullanıcı güncellenemedi'));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      showToast('Kullanıcı güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null; // Will redirect
  }

  return (
    <>
      <div className="noise" aria-hidden="true"></div>
      <header className="topbar">
        <div className="container topbar__inner">
          <Link className="brand" href="/">
            <Image className="brand__logo" src="/assets/averneth-logo.png" width={160} height={160} alt="" />
            <span className="brand__text">Averneth</span>
          </Link>
          <nav className="nav" aria-label="Ana menü">
            <button type="button" className="nav__toggle" aria-expanded="false" aria-controls="nav-menu">Menü</button>
            <ul id="nav-menu" className="nav__list">
              <li><Link className="nav__link" href="/">Ana Sayfa</Link></li>
              <li><a className="nav__link" href="/#haberler">Haberler</a></li>
              <li><a className="nav__link" href="/#magaza">Mağaza</a></li>
              <li><a className="nav__link" href="/#forum">Forum</a></li>
              <li><Link className="nav__link" href="/wiki">Wiki</Link></li>
              <li><a className="nav__link" href="/#yardim">Yardım</a></li>
              <li><a className="nav__link" href="/#destek">Destek</a></li>
              <li><a className="nav__link" href="/#yetkili-basvuru">Yetkili Başvuru</a></li>
            </ul>
          </nav>
          <div className="topbar__actions">
            <div className="user-info">
              <span>{user.username} ({user.rank})</span>
            </div>
            <button onClick={handleLogout} className="btn btn--ghost btn--sm">Çıkış Yap</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container admin-layout">
          <aside className="admin-sidebar">
            <nav className="admin-nav" aria-label="Admin navigasyonu">
              <button 
                type="button" 
                className={`admin-nav__item ${activeTab === 'users' ? 'admin-nav__item--active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Kullanıcı Yönetimi
              </button>
            </nav>
          </aside>

          <div className="admin-content">
            {activeTab === 'users' && (
              <section className="admin-section">
                <div className="admin-section__header">
                  <h2 className="admin-section__title">Kullanıcı Yönetimi</h2>
                </div>
                
                <div className="admin-filters">
                  <input 
                    type="search" 
                    placeholder="Kullanıcı ara..." 
                    className="admin-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select 
                    className="admin-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">Tüm Roller</option>
                    <option value="Oyuncu">Oyuncu</option>
                    <option value="Rehber">Rehber</option>
                    <option value="Mimar">Mimar</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Developer">Developer</option>
                    <option value="Admin">Admin</option>
                    <option value="Kurucu">Kurucu</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Kullanıcı Adı</th>
                        <th>E-posta</th>
                        <th>Rol</th>
                        <th>Bakiye</th>
                        <th>Son Görülme</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredUsers = users.filter((user) => {
                          const matchesRole = selectedRole === '' || user.rank === selectedRole;
                          const matchesSearch = searchQuery === '' || 
                            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
                          return matchesRole && matchesSearch;
                        });
                        
                        if (filteredUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="empty-table">
                                {users.length === 0 ? 'Kullanıcı bulunamadı.' : 'Filtreye uygun kullanıcı bulunamadı.'}
                              </td>
                            </tr>
                          );
                        }
                        
                        return filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td className="user-cell">
                              <div className="user-avatar">
                                <img src={`/mcavatar?username=${encodeURIComponent(user.username)}`} alt="" width={32} height={32} />
                              </div>
                              {user.username}
                            </td>
                            <td>{user.email || '-'}</td>
                            <td>
                              {editingUserId === user.id ? (
                                <select 
                                  value={editingRank} 
                                  onChange={(e) => setEditingRank(e.target.value)}
                                  className="form-input"
                                >
                                  <option value="Oyuncu">Oyuncu</option>
                                  <option value="Rehber">Rehber</option>
                                  <option value="Mimar">Mimar</option>
                                  <option value="Moderator">Moderator</option>
                                  <option value="Developer">Developer</option>
                                  <option value="Admin">Admin</option>
                                  <option value="Kurucu">Kurucu</option>
                                </select>
                              ) : (
                                <span className={`rank-badge ${getRankBadgeClass(user.rank)}`}>
                                  {user.rank}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingUserId === user.id ? (
                                <input 
                                  type="number" 
                                  value={editingBalance} 
                                  onChange={(e) => setEditingBalance(e.target.value)}
                                  className="form-input"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                '$' + parseFloat(user.balance || 0).toFixed(2)
                              )}
                            </td>
                            <td>{user.lastSeen ? new Date(user.lastSeen).toLocaleDateString('tr-TR') : '-'}</td>
                            <td>
                              <span className={`status status--${user.online ? 'online' : 'offline'}`}>
                                {user.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-actions">
                                {editingUserId === user.id ? (
                                  <>
                                    <button 
                                      onClick={() => saveUser(user.id)}
                                      className="btn btn--primary btn--xs" 
                                      title="Kaydet"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={cancelEditing}
                                      className="btn btn--ghost btn--xs" 
                                      title="İptal"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                      </svg>
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => startEditing(user)}
                                    className="btn btn--ghost btn--xs" 
                                    title="Düzenle"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5"/>
                                    </svg>
                                  </button>
                                )}
                                <button className="btn btn--ghost btn--xs" title="Sil">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__grid">
          <div>
            <h3 className="footer__heading">Admin Paneli</h3>
            <p className="footer__text">
              AVERNETH sunucu yönetim paneli. Sadece yetkili kullanıcılar erişebilir.
            </p>
            <p className="footer__copy">AVERNETH. © {new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="footer__heading">Hızlı menü</h3>
            <ul className="footer__links">
              <li><Link href="/">Ana Sayfa</Link></li>
              <li><Link href="/wiki">Wiki</Link></li>
              <li><a href="/#destek">Destek</a></li>
            </ul>
          </div>
        </div>
      </footer>

      <div className="toast" id="toast" role="status" aria-live="polite" hidden></div>
    </>
  );
}
