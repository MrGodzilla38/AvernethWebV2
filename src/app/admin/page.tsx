'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './admin.css';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRank, setEditingRank] = useState<string>('');
  const [editingBalance, setEditingBalance] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteModalUser, setDeleteModalUser] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // Ticket arama ve filtre state'leri
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('');
  // Çözüldü onay modalı state'leri
  const [resolveModalTicket, setResolveModalTicket] = useState<any>(null);
  const [resolveNote, setResolveNote] = useState<string>('');
  // Ticket silme modalı state'i (sadece Kurucu)
  const [deleteTicketModal, setDeleteTicketModal] = useState<any>(null);

  // === FONKSİYON TANIMLARI - useEffect'lerden önce ===
  
  const loadTickets = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/tickets?_t=${timestamp}`, { cache: 'no-store' });
      const data = await response.json();
      console.log('[loadTickets] API yanıtı:', { ok: data.ok, ticketCount: data.tickets?.length, timestamp });
      if (data.ok && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        console.log('[loadTickets] Tickets state güncellendi, count:', data.tickets.length);
        if (data.tickets.length > 0) {
          console.log('[loadTickets] İlk ticket:', { id: data.tickets[0].id, status: data.tickets[0].status });
        }
      } else {
        console.error('[loadTickets] API başarısız:', data);
      }
    } catch (error) {
      console.error('[loadTickets] Hata:', error);
    }
  };
  
  // useRef ile fonksiyon referansını sabit tutuyoruz
  const loadTicketsRef = useRef(loadTickets);
  loadTicketsRef.current = loadTickets;

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

  // === USEEFFECT'LER ===

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUser({ username: data.username, rank: data.rank });
          
          const allowedRanks = ['Rehber', 'Mimar', 'Moderator', 'Admin', 'Developer', 'Kurucu'];
          if (!allowedRanks.includes(data.rank)) {
            window.location.href = '/';
            return;
          }
        } else {
          window.location.href = '/auth';
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth';
        return;
      }
      
      await loadUsers();
      await loadTickets();
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Kullanıcı yetkisine göre başlangıç sekmesi ayarla
  useEffect(() => {
    if (user && !canViewUsers() && activeTab === 'users') {
      setActiveTab('tickets');
    }
  }, [user, activeTab]);

  // Ticket modal açıkken otomatik yenileme
  useEffect(() => {
    if (!selectedTicket) return;
    
    const intervalId = setInterval(() => {
      refreshTicketMessages();
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [selectedTicket?.id]);

  // Ticket listesi için otomatik yenileme
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[Admin] Polling: ticket listesi yenileniyor...');
      loadTicketsRef.current();
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Tickets sekmesine geçince listeyi yenile
  useEffect(() => {
    if (activeTab === 'tickets') {
      console.log('[Admin] Tickets sekmesi aktif, listeyi yenile');
      loadTicketsRef.current();
    }
  }, [activeTab]);

  // Sekme görünür olduğunda listeyi yenile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Admin] Sekme görünür oldu, ticket listesi yenileniyor...');
        loadTicketsRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const refreshTicketMessages = async () => {
    if (!selectedTicket) return;
    
    try {
      // Timestamp ekle - cache busting için
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/tickets?_t=${timestamp}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.ok && data.tickets) {
        // Tüm tickets'i güncelle
        setTickets(data.tickets);
        
        // Seçili ticket'i bul ve güncelle
        const updatedTicket = data.tickets.find((t: any) => t.id === selectedTicket.id);
        if (updatedTicket) {
          // Yeni mesaj var mı kontrol et
          const currentMsgCount = selectedTicket.messages?.length || 0;
          const newMsgCount = updatedTicket.messages?.length || 0;
          
          if (newMsgCount > currentMsgCount) {
            // Yeni mesaj geldi!
            setSelectedTicket(updatedTicket);
            
            // Scroll to bottom
            setTimeout(() => {
              const chatThread = document.querySelector('.chat-thread');
              if (chatThread) {
                chatThread.scrollTop = chatThread.scrollHeight;
              }
            }, 50);
          } else {
            // Sadece state güncelle (durum değişikliği vs. için)
            setSelectedTicket(updatedTicket);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh tickets:', error);
    }
  };

  // Ticket silme fonksiyonu (sadece Kurucu)
  const deleteTicket = async (ticketId: number) => {
    if (user?.rank !== 'Kurucu') {
      alert('Bu işlem için Kurucu yetkisi gereklidir.');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Başarılı silme sonrası listeyi yenile
        await loadTickets();
        setDeleteTicketModal(null);
      } else {
        alert(data.error || 'Ticket silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Ticket silme hatası:', error);
      alert('Ticket silinirken bir hata oluştu.');
    }
  };

  // Yetki kontrolü - sadece Moderatör ve üzeri destek taleplerini görebilir
  const canViewTickets = (): boolean => {
    if (!user?.rank) return false;
    const allowedRanks = ['Rehber', 'Mimar', 'Moderator', 'Admin', 'Developer', 'Kurucu'];
    return allowedRanks.includes(user.rank);
  };

  // Yetki kontrolü - sadece Admin ve üzeri kullanıcı yönetimini görebilir
  const canViewUsers = (): boolean => {
    if (!user?.rank) return false;
    const allowedRanks = ['Admin', 'Developer', 'Kurucu'];
    return allowedRanks.includes(user.rank);
  };

  const addReply = async (ticketId: number, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          sender: user.username,
          senderRank: user.rank,
          senderAvatar: user.username,
          isStaff: true
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        // Yeni mesaj objesi oluştur
        const newMessage = {
          id: data.messageId,
          sender: user.username,
          senderRank: user.rank,
          senderAvatar: user.username,
          content: content.trim(),
          createdAt: new Date().toISOString(),
          isStaff: true
        };
        
        // Mevcut mesajlar array'ini kopyala
        const targetTicket = tickets.find(t => t.id === ticketId);
        const currentMessages = targetTicket?.messages || [];
        const updatedMessages = [...currentMessages, newMessage];
        
        // tickets array'ini güncelle
        const updatedTickets = tickets.map(t => 
          t.id === ticketId 
            ? { ...t, status: t.status === 'open' ? 'in_progress' : t.status, messages: updatedMessages }
            : t
        );
        
        // State'leri güncelle
        setTickets(updatedTickets);
        
        // Eğer bu ticket şu an açık ise selectedTicket'i de güncelle
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev: any) => prev ? ({ 
            ...prev, 
            status: prev.status === 'open' ? 'in_progress' : prev.status,
            messages: updatedMessages 
          }) : null);
        }
        
        // Chat thread'i en alta scroll yap
        setTimeout(() => {
          const chatThread = document.querySelector('.chat-thread');
          if (chatThread) {
            chatThread.scrollTop = chatThread.scrollHeight;
          }
        }, 50);
        
        showToast('Yanıt gönderildi!');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      showToast('Yanıt gönderilemedi!');
    }
  };

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    console.log('[updateTicketStatus] Çağrıldı:', { ticketId, newStatus });
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log('[updateTicketStatus] API yanıt status:', response.status);
      const data = await response.json();
      console.log('[updateTicketStatus] API yanıt data:', data);
      
      if (data.ok) {
        // Yerel state güncelle
        setTickets(prevTickets => 
          prevTickets.map(t => 
            t.id === ticketId ? { ...t, status: newStatus } : t
          )
        );
        
        // Eğer bu ticket şu an açık ise selectedTicket'i de güncelle
        setSelectedTicket((prev: any) => 
          prev && prev.id === ticketId ? { ...prev, status: newStatus } : prev
        );
        
        showToast('Talep durumu güncellendi!');
        console.log('[updateTicketStatus] Başarılı, state güncellendi');
      } else {
        console.error('[updateTicketStatus] API hata:', data.error);
        showToast(data.error || 'Durum güncellenemedi!');
      }
    } catch (error) {
      console.error('[updateTicketStatus] Exception:', error);
      showToast('Durum güncellenemedi!');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; label: string }> = {
      'open': { class: 'status--open', label: 'Açık' },
      'in_progress': { class: 'status--progress', label: 'İşlemde' },
      'resolved': { class: 'status--resolved', label: 'Çözüldü' },
      'closed': { class: 'status--closed', label: 'Kapalı' }
    };
    const statusInfo = statusMap[status] || { class: 'status--open', label: 'Açık' };
    return <span className={`status ${statusInfo.class}`}>{statusInfo.label}</span>;
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

  // Rol hiyerarşisi: Kurucu(6) > Admin(5) > Developer(4) > Moderator(3) > Mimar(2) > Rehber(1) > Oyuncu(0)
  const getRankLevel = (rank: string): number => {
    const rankLower = rank.toLowerCase();
    const levels: Record<string, number> = {
      'oyuncu': 0,
      'rehber': 1,
      'mimar': 2,
      'moderator': 3,
      'developer': 4,
      'admin': 5,
      'kurucu': 6
    };
    return levels[rankLower] ?? 0;
  };

  // Kullanıcının başka bir kullanıcıyı düzenleyip düzenleyemeyeceğini kontrol et
  const canEditUser = (targetUserRank: string): boolean => {
    if (!user?.rank) return false;
    // Kurucu herkesi düzenleyebilir
    if (user.rank.toLowerCase() === 'kurucu') return true;
    const currentLevel = getRankLevel(user.rank);
    const targetLevel = getRankLevel(targetUserRank);
    // Sadece kendi seviyesinden düşük kullanıcıları düzenleyebilir
    return currentLevel > targetLevel;
  };

  // Kullanıcının bir rol atayıp atayamayacağını kontrol et
  const canAssignRank = (rankToAssign: string): boolean => {
    if (!user?.rank) return false;
    // Kurucu her rolü atayabilir
    if (user.rank.toLowerCase() === 'kurucu') return true;
    const currentLevel = getRankLevel(user.rank);
    const assignLevel = getRankLevel(rankToAssign);
    // Sadece kendi seviyesinden düşük rolleri atayabilir
    return currentLevel > assignLevel;
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

  const openDeleteModal = (user: any) => {
    setDeleteModalUser(user);
    setDeleteConfirmText('');
  };

  const closeDeleteModal = () => {
    setDeleteModalUser(null);
    setDeleteConfirmText('');
    setIsDeleting(false);
  };

  const deleteUser = async () => {
    if (!deleteModalUser) return;
    if (deleteConfirmText !== deleteModalUser.username) {
      showToast('Kullanıcı adı eşleşmiyor!');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: deleteModalUser.id
        })
      });

      const data = await response.json();
      if (data.ok) {
        setUsers(users.filter(u => u.id !== deleteModalUser.id));
        closeDeleteModal();
        showToast('Kullanıcı silindi!');
      } else {
        showToast('Hata: ' + (data.error || 'Kullanıcı silinemedi'));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      showToast('Kullanıcı silinemedi');
    } finally {
      setIsDeleting(false);
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
              <li><Link className="nav__link" href="/destek">Destek</Link></li>
              <li><a className="nav__link" href="/#yetkili-basvuru">Yetkili Başvuru</a></li>
            </ul>
          </nav>
          <div className="topbar__actions">
            <Link href="/auth" className="user-profile-link">
              <img 
                src={`https://mc-heads.net/avatar/${encodeURIComponent(user.username)}/40`} 
                alt="" 
                className="user-profile-avatar"
                width={32}
                height={32}
              />
              <span className="user-profile-name">{user.username}</span>
              <span className="user-profile-rank">({user.rank})</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container admin-layout">
          <aside className="admin-sidebar">
            <nav className="admin-nav" aria-label="Admin navigasyonu">
              {canViewUsers() && (
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
              )}
              {canViewTickets() && (
                <button 
                  type="button" 
                  className={`admin-nav__item ${activeTab === 'tickets' ? 'admin-nav__item--active' : ''}`}
                  onClick={() => setActiveTab('tickets')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Destek Talepleri
                  {tickets.filter(t => t.status === 'open').length > 0 && (
                    <span className="admin-nav__badge">{tickets.filter(t => t.status === 'open').length}</span>
                  )}
                </button>
              )}
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
                        <th>Kayıt Tarihi</th>
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
                                  {canAssignRank('Oyuncu') && <option value="Oyuncu">Oyuncu</option>}
                                  {canAssignRank('Rehber') && <option value="Rehber">Rehber</option>}
                                  {canAssignRank('Mimar') && <option value="Mimar">Mimar</option>}
                                  {canAssignRank('Moderator') && <option value="Moderator">Moderator</option>}
                                  {canAssignRank('Developer') && <option value="Developer">Developer</option>}
                                  {canAssignRank('Admin') && <option value="Admin">Admin</option>}
                                  {canAssignRank('Kurucu') && <option value="Kurucu">Kurucu</option>}
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
                                '$' + (Math.floor(user.balance || 0))
                              )}
                            </td>
                            <td>{user.created ? new Date(user.created).toLocaleDateString('tr-TR') : '-'}</td>
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
                                  <>
                                    {canEditUser(user.rank) && (
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
                                    {canEditUser(user.rank) && (
                                      <button 
                                        onClick={() => openDeleteModal(user)}
                                        className="btn btn--ghost btn--xs" 
                                        title="Sil"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5"/>
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5"/>
                                        </svg>
                                      </button>
                                    )}
                                  </>
                                )}
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

            {activeTab === 'tickets' && canViewTickets() && (
              <section className="admin-section">
                <div className="admin-section__header">
                  <h2 className="admin-section__title">Destek Talepleri</h2>
                  <div className="admin-stats">
                    <span className="stat-badge stat-badge--open">Açık: {tickets.filter(t => t.status === 'open').length}</span>
                    <span className="stat-badge stat-badge--progress">İşlemde: {tickets.filter(t => t.status === 'in_progress').length}</span>
                    <span className="stat-badge stat-badge--resolved">Çözüldü: {tickets.filter(t => t.status === 'resolved').length}</span>
                    <span className="stat-badge stat-badge--total">Toplam: {tickets.length}</span>
                  </div>
                </div>
                
                {/* Arama ve Filtreler */}
                <div className="admin-filters" style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <div className="search-box" style={{ flex: '1', minWidth: '200px' }}>
                    <input
                      type="text"
                      placeholder="Kullanıcı adı veya konu ara..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="admin-search-input"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)'
                      }}
                    />
                  </div>
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="admin-filter-select"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="open">Açık</option>
                    <option value="in_progress">İşlemde</option>
                    <option value="resolved">Çözüldü</option>
                    <option value="closed">Kapalı</option>
                  </select>
                  <select
                    value={ticketCategoryFilter}
                    onChange={(e) => setTicketCategoryFilter(e.target.value)}
                    className="admin-filter-select"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Tüm Kategoriler</option>
                    <option value="Teknik Sorun">Teknik Sorun</option>
                    <option value="Hile Şikayeti">Hile Şikayeti</option>
                    <option value="Ban İtiraz">Ban İtiraz</option>
                    <option value="Rank Sorunu">Rank Sorunu</option>
                    <option value="Bakiye Sorunu">Bakiye Sorunu</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                  {(ticketSearch || ticketStatusFilter || ticketCategoryFilter) && (
                    <button
                      onClick={() => {
                        setTicketSearch('');
                        setTicketStatusFilter('');
                        setTicketCategoryFilter('');
                      }}
                      className="btn btn--secondary btn--sm"
                    >
                      Filtreleri Temizle
                    </button>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="admin-table admin-table--tickets">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Kullanıcı</th>
                        <th>Kategori</th>
                        <th>Konu</th>
                        <th>Durum</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredTickets = tickets.filter((ticket) => {
                          const matchesSearch = ticketSearch === '' || 
                            ticket.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                            ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase());
                          const matchesStatus = ticketStatusFilter === '' || ticket.status === ticketStatusFilter;
                          const matchesCategory = ticketCategoryFilter === '' || ticket.category === ticketCategoryFilter;
                          return matchesSearch && matchesStatus && matchesCategory;
                        });
                        
                        if (filteredTickets.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="empty-table">
                                {tickets.length === 0 
                                  ? 'Henüz destek talebi bulunmuyor.' 
                                  : 'Filtrelere uygun destek talebi bulunamadı.'}
                              </td>
                            </tr>
                          );
                        }
                        
                        return filteredTickets.map((ticket) => (
                          <tr key={ticket.id} className={`ticket-row ticket-row--${ticket.status}`}>
                            <td>#{ticket.id}</td>
                            <td className="user-cell">
                              <div className="user-avatar">
                                <img src={`/mcavatar?username=${encodeURIComponent(ticket.name)}`} alt="" width={32} height={32} />
                              </div>
                              <div className="user-info">
                                <span className="user-name">{ticket.name}</span>
                                <span className="user-email">{ticket.email}</span>
                              </div>
                            </td>
                            <td><span className="category-badge">{ticket.category}</span></td>
                            <td className="ticket-subject">{ticket.subject}</td>
                            <td>{getStatusBadge(ticket.status)}</td>
                            <td>{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</td>
                            <td>
                              <div className="admin-actions">
                                <button 
                                  onClick={() => setSelectedTicket(ticket)}
                                  className="btn btn--ghost btn--xs" 
                                  title="Görüntüle"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                                  </svg>
                                </button>
                                {ticket.status === 'open' && (
                                  <button 
                                    onClick={() => { updateTicketStatus(ticket.id, 'in_progress'); }}
                                    className="btn btn--primary btn--xs" 
                                    title="İşleme Al"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                  </button>
                                )}
                                {ticket.status !== 'resolved' && (
                                  <button 
                                    onClick={() => { setResolveModalTicket(ticket); }}
                                    className="btn btn--success btn--xs" 
                                    title="Çözüldü"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                )}
                                {/* Sadece Kurucu çözülmüş ticketları silebilir */}
                                {ticket.status === 'resolved' && user?.rank === 'Kurucu' && (
                                  <button 
                                    onClick={() => { setDeleteTicketModal(ticket); }}
                                    className="btn btn--danger btn--xs" 
                                    title="Sil"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Ticket Detail Modal with Messaging */}
                {selectedTicket && (
                  <div className="modal-overlay" onClick={() => { setSelectedTicket(null); setReplyText(''); }}>
                    <div className="modal modal--large modal--chat" onClick={(e) => e.stopPropagation()}>
                      <div className="modal__header">
                        <div className="ticket-detail__header-info">
                          <h3 className="modal__title">Destek Talebi #{selectedTicket.id}</h3>
                          <div className="ticket-detail__meta">
                            <span className="category-badge">{selectedTicket.category}</span>
                            {getStatusBadge(selectedTicket.status)}
                          </div>
                        </div>
                        <button onClick={() => { setSelectedTicket(null); setReplyText(''); }} className="modal__close">×</button>
                      </div>
                      
                      <div className="modal__body modal__body--chat">
                        {/* Ticket Info */}
                        <div className="ticket-detail__subject">
                          <strong>Konu:</strong> {selectedTicket.subject}
                        </div>
                        
                        {/* Conversation Thread */}
                        <div className="chat-thread">
                          {/* Original Message */}
                          <div className="chat-message chat-message--user">
                            <div className="chat-message__avatar">
                              <img src={`/mcavatar?username=${encodeURIComponent(selectedTicket.name)}`} alt="" width={36} height={36} />
                            </div>
                            <div className="chat-message__content">
                              <div className="chat-message__header">
                                <span className="chat-message__author">{selectedTicket.name}</span>
                                <span className="chat-message__rank user-rank">Oyuncu</span>
                                <span className="chat-message__time">{new Date(selectedTicket.createdAt).toLocaleString('tr-TR')}</span>
                              </div>
                              <div className="chat-message__text">{selectedTicket.message}</div>
                              {selectedTicket.attachment && (() => {
                                try {
                                  const att = JSON.parse(selectedTicket.attachment);
                                  // Yeni 'data' field'ı veya eski 'base64' field'ı (tam veri olmayabilir)
                                  const base64Data = att.data || att.base64;
                                  if (base64Data && base64Data.length > 100) {
                                    return (
                                      <div className="chat-message__attachment">
                                        <a 
                                          href={`data:${att.type || 'image/jpeg'};base64,${base64Data}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="attachment-link"
                                        >
                                          <img 
                                            src={`data:${att.type || 'image/jpeg'};base64,${base64Data}`} 
                                            alt={att.name || 'Ek'} 
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                          />
                                          <span className="attachment-name">{att.name}</span>
                                        </a>
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  console.error('Attachment parse error:', e);
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                          
                          {/* Replies */}
                          {selectedTicket.messages && selectedTicket.messages.map((msg: any) => (
                            <div key={msg.id} className={`chat-message ${msg.isStaff ? 'chat-message--staff' : 'chat-message--user'}`}>
                              <div className="chat-message__avatar">
                                <img src={`/mcavatar?username=${encodeURIComponent(msg.senderAvatar)}`} alt="" width={36} height={36} />
                              </div>
                              <div className="chat-message__content">
                                <div className="chat-message__header">
                                  <span className="chat-message__author">{msg.sender}</span>
                                  {msg.isStaff && <span className="chat-message__rank staff-rank">{msg.senderRank}</span>}
                                  {!msg.isStaff && <span className="chat-message__rank user-rank">Oyuncu</span>}
                                  <span className="chat-message__time">{new Date(msg.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                                <div className="chat-message__text">{msg.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Reply Input */}
                        {selectedTicket.status !== 'resolved' && (
                          <div className="chat-reply">
                            <div className="chat-reply__header">
                              <span className="chat-reply__label">Yanıt gönder</span>
                              <span className="chat-reply__info">{user?.username} ({user?.rank}) olarak</span>
                            </div>
                            <textarea
                              className="chat-reply__input"
                              placeholder="Mesajınızı yazın..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                            />
                            <div className="chat-reply__actions">
                              <button 
                                onClick={() => { setSelectedTicket(null); setReplyText(''); }}
                                className="btn btn--ghost"
                              >
                                Kapat
                              </button>
                              <button 
                                onClick={() => {
                                  addReply(selectedTicket.id, replyText);
                                  setReplyText('');
                                  // Update selected ticket to show new message
                                  const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
                                  if (updatedTicket) setSelectedTicket(updatedTicket);
                                }}
                                disabled={!replyText.trim()}
                                className="btn btn--primary"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginRight: '0.5rem'}}>
                                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Yanıt Gönder
                              </button>
                              {selectedTicket.status === 'open' && (
                                <button 
                                  onClick={async () => {
                                    await updateTicketStatus(selectedTicket.id, 'in_progress');
                                  }}
                                  className="btn btn--secondary"
                                >
                                  İşleme Al
                                </button>
                              )}
                              {selectedTicket.status !== 'resolved' && (
                                <button 
                                  onClick={() => { setResolveModalTicket(selectedTicket); }}
                                  className="btn btn--success"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginRight: '0.5rem'}}>
                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Çözüldü
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {selectedTicket.status === 'resolved' && (
                          <div className="chat-closed">
                            <span className="chat-closed__text">Bu talep çözüldü olarak işaretlenmiştir.</span>
                            
                            {/* Çözüm Notu Kutusu - Son Mesaj */}
                            {selectedTicket.messages && selectedTicket.messages.length > 0 && (() => {
                              const lastMessage = selectedTicket.messages[selectedTicket.messages.length - 1];
                              const isStaffMessage = lastMessage.isStaff || lastMessage.senderRank;
                              return (
                                <div className="resolution-note-box" style={{
                                  background: 'var(--surface)',
                                  border: '1px solid var(--success)',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  marginTop: '1rem',
                                  maxWidth: '80%',
                                  alignSelf: 'flex-start'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.85rem',
                                    color: 'var(--success)',
                                    fontWeight: '600'
                                  }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Çözüm Notu
                                  </div>
                                  <div style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                                    {lastMessage.content}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.5rem'
                                  }}>
                                    {lastMessage.sender} • {new Date(lastMessage.createdAt).toLocaleString('tr-TR')}
                                  </div>
                                </div>
                              );
                            })()}
                            
                            <button 
                              onClick={() => { setSelectedTicket(null); setReplyText(''); }}
                              className="btn btn--ghost"
                              style={{ marginTop: '1rem' }}
                            >
                              Kapat
                            </button>
                          </div>
                        )}
                        
                        <div className="ticket-detail__meta-footer">
                          <span>IP: {selectedTicket.ip}</span>
                          <span>Talep No: #{selectedTicket.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Çözüldü Onay Modalı */}
                {resolveModalTicket && (
                  <div className="modal-overlay" onClick={() => { setResolveModalTicket(null); setResolveNote(''); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                      <div className="modal__header">
                        <h3 className="modal__title">Destek Talebini Çözüldü Olarak İşaretle</h3>
                        <button onClick={() => { setResolveModalTicket(null); setResolveNote(''); }} className="modal__close">×</button>
                      </div>
                      <div className="modal__body" style={{ padding: '1.5rem' }}>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                          <strong>#{resolveModalTicket.id}</strong> numaralı destek talebini çözüldü olarak işaretlemek istediğinize emin misiniz?
                        </p>
                        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          Kullanıcı: <strong>{resolveModalTicket.name}</strong><br/>
                          Konu: <strong>{resolveModalTicket.subject}</strong><br/>
                          Kategori: <strong>{resolveModalTicket.category}</strong>
                        </p>
                        <div className="form-group">
                          <label htmlFor="resolve-note" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Çözüm Notu (Opsiyonel):
                          </label>
                          <textarea
                            id="resolve-note"
                            value={resolveNote}
                            onChange={(e) => setResolveNote(e.target.value)}
                            placeholder="Çözüm hakkında kısa bir not yazın..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>
                      <div className="modal__footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => { setResolveModalTicket(null); setResolveNote(''); }}
                          className="btn btn--ghost"
                        >
                          İptal
                        </button>
                        <button 
                          onClick={async () => {
                            // Önce not varsa gönder
                            if (resolveNote.trim()) {
                              await addReply(resolveModalTicket.id, resolveNote);
                            }
                            // Sonra çözüldü yap
                            await updateTicketStatus(resolveModalTicket.id, 'resolved');
                            setResolveModalTicket(null);
                            setResolveNote('');
                            // Eğer ticket detay modalı açıksa onu da kapat
                            if (selectedTicket && selectedTicket.id === resolveModalTicket.id) {
                              setSelectedTicket(null);
                              setReplyText('');
                            }
                          }}
                          className="btn btn--success"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.5rem' }}>
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Evet, Çözüldü Olarak İşaretle
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket Silme Onay Modalı (sadece Kurucu) */}
                {deleteTicketModal && (
                  <div className="modal-overlay" onClick={() => setDeleteTicketModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                      <div className="modal__header" style={{ borderBottom: '1px solid var(--danger)' }}>
                        <h3 className="modal__title" style={{ color: 'var(--danger)' }}>⚠️ Destek Talebini Sil</h3>
                        <button onClick={() => setDeleteTicketModal(null)} className="modal__close">×</button>
                      </div>
                      <div className="modal__body" style={{ padding: '1.5rem' }}>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                          <strong>#{deleteTicketModal.id}</strong> numaralı çözülmüş destek talebini <strong style={{ color: 'var(--danger)' }}>kalıcı olarak silmek</strong> istediğinize emin misiniz?
                        </p>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          Kullanıcı: <strong>{deleteTicketModal.name}</strong><br/>
                          Konu: <strong>{deleteTicketModal.subject}</strong><br/>
                          Kategori: <strong>{deleteTicketModal.category}</strong>
                        </p>
                        <div style={{ 
                          padding: '0.75rem', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          borderRadius: '6px',
                          border: '1px solid var(--danger)',
                          fontSize: '0.85rem',
                          color: 'var(--danger)'
                        }}>
                          <strong>UYARI:</strong> Bu işlem geri alınamaz! Ticket ve tüm mesajları kalıcı olarak silinecektir.
                        </div>
                      </div>
                      <div className="modal__footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setDeleteTicketModal(null)}
                          className="btn btn--ghost"
                        >
                          İptal
                        </button>
                        <button 
                          onClick={() => deleteTicket(deleteTicketModal.id)}
                          className="btn btn--danger"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.5rem' }}>
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Evet, Kalıcı Olarak Sil
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
              <li><Link href="/destek">Destek</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Kullanıcıyı Sil</h3>
              <button onClick={closeDeleteModal} className="modal__close">×</button>
            </div>
            <div className="modal__body">
              <p className="modal__text">
                <strong>{deleteModalUser.username}</strong> kullanıcısını silmek üzeresiniz.
              </p>
              <p className="modal__warning">Bu işlem geri alınamaz!</p>
              <div className="modal__confirm">
                <label className="modal__label">
                  Onaylamak için kullanıcı adını girin: <strong>{deleteModalUser.username}</strong>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="form-input modal__input"
                  placeholder={deleteModalUser.username}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal__footer">
              <button 
                onClick={closeDeleteModal} 
                className="btn btn--ghost"
                disabled={isDeleting}
              >
                İptal
              </button>
              <button 
                onClick={deleteUser}
                className="btn btn--danger"
                disabled={deleteConfirmText !== deleteModalUser.username || isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast" id="toast" role="status" aria-live="polite" hidden></div>
    </>
  );
}
