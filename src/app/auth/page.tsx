'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import './auth.css';

function AuthPageContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve');
  const [avatarUrl, setAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=80&default=MHF_Steve');
  const [showEmail, setShowEmail] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', email: '' });
  const [loginMessage, setLoginMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        const data = await response.json();
        console.log('DEBUG: Auth check response:', data);
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUser({ username: data.username, rank: data.rank, email: data.email, created: data.created, balance: data.balance });
          setBalance(data.balance || 0);
          setHeaderAvatarUrl(`https://mc-heads.net/avatar/${data.username}/40`);
          loadMinecraftAvatar(data.username);
          loadUserTickets();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();

    // Handle hash navigation
    const hash = searchParams.get('hash') || window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  // Ticket modal açıkken otomatik yenileme (polling)
  useEffect(() => {
    if (!selectedTicket) return;
    
    const intervalId = setInterval(() => {
      refreshTicketMessages();
    }, 3000); // Her 3 saniyede bir yenile
    
    return () => clearInterval(intervalId);
  }, [selectedTicket?.id]);

  const refreshTicketMessages = async () => {
    if (!selectedTicket) return;
    
    try {
      const response = await fetch('/api/user/tickets', { credentials: 'include' });
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
            
            // Bildirim göster (ilk açılışta değil, sadece yeni mesaj geldiğinde)
            if (currentMsgCount > 0) {
              showToast('Yeni mesaj!');
              
              // Scroll to bottom
              setTimeout(() => {
                const chatThread = document.querySelector('.chat-thread');
                if (chatThread) {
                  chatThread.scrollTop = chatThread.scrollHeight;
                }
              }, 50);
            }
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

const loadMinecraftAvatar = (username: string) => {
  setAvatarUrl(`https://mc-heads.net/avatar/${username}/80`);
};
  
//const loadMinecraftAvatar = async (username: string) => {
//  try {
//    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
//    if (res.ok) {
//      const data = await res.json();
//      if (data?.id) {
//        setAvatarUrl(`https://minotar.net/avatar/${data.id}/80`);
//       return;
//      }
//    }
//  } catch (_) {}
//  setAvatarUrl(`https://minotar.net/avatar/MHF_Steve/80`);
//};

//const loadMinecraftAvatar = async (username: string) => {
//  setAvatarUrl(`/mcavatar?username=${username}`);
//};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage('');
    
    try {
      console.log('DEBUG: Sending login request for:', loginForm.username);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log('DEBUG: Login response:', data);
      
      if (data.ok) {
        setLoginMessage('Giriş başarılı! Yönlendiriliyor...');
        
        // Full page reload to get fresh auth state
        setTimeout(() => {
          window.location.href = '/auth';
        }, 500);
      } else {
        setLoginMessage(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('DEBUG: Login fetch error:', error);
      setLoginMessage('Bir hata oluştu');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMessage('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterMessage('Şifreler eşleşmiyor');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
          email: registerForm.email,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setRegisterMessage('Kayıt başarılı! Yönlendiriliyor...');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 500);
      } else {
        setRegisterMessage(data.error || 'Kayıt başarısız');
      }
    } catch (error) {
      setRegisterMessage('Bir hata oluştu');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const loadUserTickets = async () => {
    try {
      const response = await fetch('/api/user/tickets', { credentials: 'include' });
      const data = await response.json();
      if (data.ok) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; label: string }> = {
      'open': { class: 'status-badge--open', label: 'Açık' },
      'in_progress': { class: 'status-badge--progress', label: 'İşlemde' },
      'resolved': { class: 'status-badge--resolved', label: 'Çözüldü' },
      'closed': { class: 'status-badge--closed', label: 'Kapalı' }
    };
    const statusInfo = statusMap[status] || { class: 'status-badge--open', label: 'Açık' };
    return <span className={`ticket-status ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    
    try {
      const response = await fetch(`/api/user/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: replyText.trim() })
      });
      
      const data = await response.json();
      if (data.ok) {
        // Yeni mesaj objesi oluştur
        const newMessage = {
          id: data.messageId,
          sender: user?.username,
          senderRank: 'Oyuncu',
          senderAvatar: user?.username,
          content: replyText.trim(),
          createdAt: new Date().toISOString(),
          isStaff: false
        };
        
        // Mevcut mesajlar array'ini kopyala ve yeni mesajı ekle
        const currentMessages = selectedTicket.messages || [];
        const updatedMessages = [...currentMessages, newMessage];
        
        // tickets array'ini güncelle
        const updatedTickets = tickets.map(t => 
          t.id === selectedTicket.id 
            ? { ...t, messages: updatedMessages }
            : t
        );
        
        // State'leri güncelle
        setTickets(updatedTickets);
        setSelectedTicket((prev: any) => prev ? ({ ...prev, messages: updatedMessages }) : null);
        setReplyText('');
        
        // Chat thread'i en alta scroll yap
        setTimeout(() => {
          const chatThread = document.querySelector('.chat-thread');
          if (chatThread) {
            chatThread.scrollTop = chatThread.scrollHeight;
          }
        }, 50);
        
        showToast('Mesajınız gönderildi!');
      } else {
        showToast(data.error || 'Mesaj gönderilemedi!');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      showToast('Mesaj gönderilemedi!');
    }
  };

  const togglePasswordVisibility = (field: 'login' | 'register' | 'confirm') => {
    if (field === 'login') {
      setShowLoginPassword(!showLoginPassword);
    } else if (field === 'register') {
      setShowRegisterPassword(!showRegisterPassword);
    } else if (field === 'confirm') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validatePasswordMatch = () => {
    if (registerForm.password && registerForm.confirmPassword) {
      if (registerForm.password !== registerForm.confirmPassword) {
        setRegisterMessage('Şifreler eşleşmiyor');
        return false;
      } else {
        setRegisterMessage('');
        return true;
      }
    }
    return true;
  };

  const getMessageType = (message: string) => {
    if (!message) return '';
    if (message.includes('başarılı') || message.includes('Başarılı')) return 'auth-msg--ok';
    if (message.includes('eşleşmiyor') || message.includes('başarısız') || message.includes('hata')) return 'auth-msg--err';
    return 'auth-msg--info';
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

  if (isLoggedIn && user) {
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
                <li><Link className="nav__link" href="/basvuru">Yetkili Başvuru</Link></li>
              </ul>
            </nav>
            <div className="topbar__actions wiki-top-actions">
              <Link href="/auth" className="header-profile" title="Hesabım">
                <span className="header-profile__avatar-box">
                  <img
                    src={headerAvatarUrl}
                    alt="Profil"
                    className="header-profile__img"
                    width={36}
                    height={36}
                    onError={(e) => { e.currentTarget.src = 'https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve'; }}
                  />
                </span>
                <span className="header-balance">{Math.floor(balance || 0)} ₺</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="auth-main">
          <div className="container dashboard">
            <aside className="dashboard__sidebar">
              <div className="profile-card">
                <div className="profile-card__avatar">
                  <img
                    src={avatarUrl}
                    alt={`${user.username} Minecraft skin`}
                    width={80}
                    height={80}
                    style={{ borderRadius: '8px', imageRendering: 'pixelated' }}
                    onError={(e) => { e.currentTarget.src = 'https://crafatar.com/avatars/MHF_Steve?size=80&default=MHF_Steve'; }}
                  />
                </div>
                <div className="profile-card__info">
                  <h3 className="profile-card__name">{user.username}</h3>
                  <span className={`profile-card__rank rank--${user.rank.toLowerCase()}`}>{user.rank}</span>
                </div>
              </div>

              <nav className="dashboard-nav">
                <div className="dashboard-nav__group">
                  <h4 className="dashboard-nav__title">Hesabım</h4>
                  <ul className="dashboard-nav__list">
                    <li><a href="#" className="dashboard-nav__link active"><span className="icon">👤</span> Profil</a></li>
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">🛒</span> Siparişler</a></li>
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">🔄</span> Abonelikler</a></li>
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">💳</span> Kredi Geçmişi</a></li>
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">📄</span> Başvurular</a></li>
                  </ul>
                </div>

                <div className="dashboard-nav__group">
                  <h4 className="dashboard-nav__title">Ayarlar</h4>
                  <ul className="dashboard-nav__list">
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">⚙️</span> Profil Düzenle</a></li>
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">🔒</span> Güvenlik</a></li>
                    <li><a href="#" className="dashboard-nav__link"><span className="icon">📱</span> Discord Hesabını Bağla</a></li>
                    <li><button onClick={handleLogout} className="dashboard-nav__link logout-btn-sidebar"><span className="icon">🚪</span> Çıkış Yap</button></li>
                  </ul>
                </div>
              </nav>
            </aside>

            <div className="dashboard__content">
              <section className="dashboard-section">
                <h3 className="dashboard-section__title">Detaylar</h3>
                <div className="details-grid">
                  <div className="details-item">
                    <span className="details-item__label">Bakiye:</span>
                    <div className="details-item__value bakiye-box">
                      <span>{Math.floor(user.balance || 0)} ₺</span>
                      <button className="add-balance-btn">+</button>
                    </div>
                  </div>
                  <div className="details-item">
                    <span className="details-item__label">Kayıt Tarihi:</span>
                    <span className="details-item__value">{user?.created ? new Date(user.created).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                  <div className="details-item">
                    <span className="details-item__label">Yetki:</span>
                    <span className="details-item__value">{user.rank}</span>
                  </div>
                  <div className="details-item">
                    <span className="details-item__label">İki Adımlı Doğrulama:</span>
                    <span className="details-item__value status-disabled">Devre-dışı</span>
                  </div>
                  <div className="details-item full-width">
                    <span className="details-item__label">E-Posta:</span>
                    <span className="details-item__value email-field">
                      {showEmail ? (user?.email || '-') : '*************'}
                      <button 
                        className="email-toggle-btn" 
                        onClick={() => setShowEmail(!showEmail)}
                        title={showEmail ? 'E-postayı gizle' : 'E-postayı göster'}
                      >
                        {showEmail ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </span>
                  </div>
                </div>
              </section>

              <section className="dashboard-section">
                <h3 className="dashboard-section__title">Destek Talepleri</h3>
                {tickets.length === 0 ? (
                  <div className="empty-state">Henüz destek talebi bulunmuyor.</div>
                ) : (
                  <div className="tickets-list">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className={`ticket-card ticket-card--${ticket.status}`}>
                        <div className="ticket-card__header">
                          <div className="ticket-card__info">
                            <span className="ticket-card__id">#{ticket.id}</span>
                            <span className="ticket-card__category">{ticket.category}</span>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <div className="ticket-card__subject">{ticket.subject}</div>
                        <div className="ticket-card__preview">{ticket.message.substring(0, 100)}{ticket.message.length > 100 ? '...' : ''}</div>
                        <div className="ticket-card__footer">
                          <span className="ticket-card__date">{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</span>
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="btn btn--primary btn--xs"
                          >
                            Görüntüle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Ticket Detail Modal */}
              {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                  <div className="modal modal--chat" onClick={(e) => e.stopPropagation()}>
                    <div className="modal__header">
                      <div className="ticket-detail__header-info">
                        <h3 className="modal__title">Destek Talebi #{selectedTicket.id}</h3>
                        <div className="ticket-detail__meta">
                          <span className="category-badge">{selectedTicket.category}</span>
                          {getStatusBadge(selectedTicket.status)}
                        </div>
                      </div>
                      <button onClick={() => setSelectedTicket(null)} className="modal__close">×</button>
                    </div>
                    <div className="modal__body modal__body--chat">
                      <div className="ticket-detail__subject">
                        <strong>Konu:</strong> {selectedTicket.subject}
                      </div>
                      <div className="chat-thread">
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
                                // Yeni 'data' field'ı veya eski 'base64' field'ı
                                const base64Data = att.data || att.base64;
                                if (base64Data && base64Data.length > 100) {
                                  return (
                                    <div className="chat-message__attachment">
                                      <a href={`data:${att.type || 'image/jpeg'};base64,${base64Data}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                        <img src={`data:${att.type || 'image/jpeg'};base64,${base64Data}`} alt={att.name || 'Ek'} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                      <div className="ticket-detail__meta-footer">
                        <span>IP: {selectedTicket.ip}</span>
                        <span>Talep No: #{selectedTicket.id}</span>
                      </div>
                    </div>
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                      <div className="chat-reply">
                        <div className="chat-reply__header">
                          <span className="chat-reply__label">Mesaj gönder</span>
                        </div>
                        <textarea
                          className="chat-reply__input"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Mesajınızı yazın..."
                          rows={3}
                        />
                        <div className="chat-reply__actions">
                          <button onClick={() => { setSelectedTicket(null); setReplyText(''); }} className="btn btn--ghost">Kapat</button>
                          <button 
                            onClick={sendReply} 
                            disabled={!replyText.trim()}
                            className="btn btn--primary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginRight: '0.5rem'}}>
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Gönder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="modal__footer">
                        <button onClick={() => setSelectedTicket(null)} className="btn btn--ghost">Kapat</button>
                        <span className="ticket-status-hint">Bu talep {selectedTicket.status === 'resolved' ? 'çözüldü' : 'kapandı'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <section className="dashboard-section">
                <h3 className="dashboard-section__title">Kredi Geçmişi</h3>
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>MİKTAR</th>
                        <th>TÜR</th>
                        <th>TARİH</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="empty-table">Henüz kredi işlemi yok.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="dashboard-section">
                <h3 className="dashboard-section__title">Siparişler</h3>
                <div className="empty-state">Veri bulunamadı!</div>
              </section>
            </div>
          </div>
        </main>

        <footer className="footer">
          <div className="container footer__grid">
            <div>
              <h3 className="footer__heading">Hesap</h3>
              <p className="footer__text">
                Bu sayfa, nLogin ile paylaşılan MySQL veritabanına BCrypt ile hashlenmiş şifre yazar. Güvenlik için API&apos;yi HTTPS üzerinden yayınlayın ve JWT_SECRET değerini güçlü tutun.
              </p>
              <p className="footer__copy">AVERNETH. © {new Date().getFullYear()}</p>
            </div>
            <div>
              <h3 className="footer__heading">Hızlı menü</h3>
              <ul className="footer__links">
                <li><Link href="/">Ana Sayfa</Link></li>
                <li><a href="/wiki">Wiki</a></li>
                <li><Link href="/destek">Destek</Link></li>
              </ul>
            </div>
          </div>
        </footer>

        <div className="toast" id="toast" role="status" aria-live="polite" hidden></div>
      </>
    );
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
              <li><a className="nav__link" href="#haberler">Haberler</a></li>
              <li><a className="nav__link" href="#magaza">Mağaza</a></li>
              <li><a className="nav__link" href="#forum">Forum</a></li>
              <li><a className="nav__link" href="/wiki">Wiki</a></li>
              <li><Link className="nav__link" href="/destek">Destek</Link></li>
              <li><a className="nav__link" href="#yetkili-basvuru">Yetkili Başvuru</a></li>
            </ul>
          </nav>
          <div className="topbar__actions wiki-top-actions">
            <div className="auth-btn-group">
              <Link className="auth-btn-group__btn" href="#giris">Giriş Yap</Link>
              <span className="auth-btn-group__divider" />
              <Link className="auth-btn-group__btn auth-btn-group__btn--primary" href="#kayit">Kayıt Ol</Link>
              <div className="auth-btn-group__glow" />
            </div>
          </div>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-bg-overlay"></div>
        <div className="auth-center">
          <div className="auth-brand">
            <h1 className="auth-brand__title">AVERNETH</h1>
            <p className="auth-brand__sub">Premium MMORPG Minecraft Deneyimi</p>
          </div>

          <div className="auth-tabs">
            <button
              className="auth-tab active"
              id="tab-giris"
              onClick={() => {
                const panels = document.querySelectorAll('.auth-panel');
                const tabs = document.querySelectorAll('.auth-tab');
                panels.forEach(p => p.classList.remove('active'));
                tabs.forEach(t => t.classList.remove('active'));
                document.getElementById('panel-giris')?.classList.add('active');
                document.getElementById('tab-giris')?.classList.add('active');
              }}
            >
              Giriş Yap
            </button>
            <button
              className="auth-tab"
              id="tab-kayit"
              onClick={() => {
                const panels = document.querySelectorAll('.auth-panel');
                const tabs = document.querySelectorAll('.auth-tab');
                panels.forEach(p => p.classList.remove('active'));
                tabs.forEach(t => t.classList.remove('active'));
                document.getElementById('panel-kayit')?.classList.add('active');
                document.getElementById('tab-kayit')?.classList.add('active');
              }}
            >
              Kayıt Ol
            </button>
          </div>

          <div id="panel-giris" className="auth-panel active">
            <form onSubmit={handleLogin} className="auth-form" autoComplete="on">
              <div className="auth-field">
                <label htmlFor="login-user">Oyuncu adı</label>
                <input 
                  id="login-user" 
                  name="username" 
                  type="text" 
                  required 
                  minLength={3} 
                  maxLength={16} 
                  pattern="[a-zA-Z0-9_]{3,16}" 
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-pass">Şifre</label>
                <div className="password-input-wrapper">
                  <input 
                    id="login-pass" 
                    name="password" 
                    type={showLoginPassword ? "text" : "password"} 
                    required 
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    aria-label={showLoginPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    onClick={() => togglePasswordVisibility('login')}
                  >
                    <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path className="eye-open" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" style={{display: showLoginPassword ? 'block' : 'none'}} />
                      <circle className="eye-open" cx="12" cy="12" r="3" style={{display: showLoginPassword ? 'block' : 'none'}} />
                      <g className="eye-closed" style={{display: showLoginPassword ? 'none' : 'block'}}>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
              <p className="auth-hint">Şifre uzunluğu sunucu ayarıyla uyumludur (genelde 5–32 karakter).</p>
              <div className="auth-actions">
                <button type="submit" className="btn btn--primary">Giriş yap</button>
              </div>
              {loginMessage && (
              <div id="msg-login" className={`auth-msg ${getMessageType(loginMessage)}`} role="alert">
                <div className="auth-msg__icon">
                  {getMessageType(loginMessage) === 'auth-msg--ok' && '✓'}
                  {getMessageType(loginMessage) === 'auth-msg--err' && '✕'}
                  {getMessageType(loginMessage) === 'auth-msg--info' && 'ⓘ'}
                </div>
                <span className="auth-msg__text">{loginMessage}</span>
              </div>
            )}
            </form>
          </div>

          <div id="panel-kayit" className="auth-panel">
            <form onSubmit={handleRegister} className="auth-form" autoComplete="on">
              <div className="auth-field">
                <label htmlFor="reg-user">Oyuncu adı</label>
                <input 
                  id="reg-user" 
                  name="username" 
                  type="text" 
                  required 
                  minLength={3} 
                  maxLength={16} 
                  pattern="[a-zA-Z0-9_]{3,16}" 
                  autoComplete="username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="reg-pass">Şifre</label>
                <div className="password-input-wrapper">
                  <input 
                    id="reg-pass" 
                    name="password" 
                    type={showRegisterPassword ? "text" : "password"} 
                    required 
                    minLength={5} 
                    maxLength={32} 
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(e) => {
                      setRegisterForm({...registerForm, password: e.target.value});
                      if (registerForm.confirmPassword) {
                        validatePasswordMatch();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    aria-label={showRegisterPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    onClick={() => togglePasswordVisibility('register')}
                  >
                    <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path className="eye-open" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" style={{display: showRegisterPassword ? 'block' : 'none'}} />
                      <circle className="eye-open" cx="12" cy="12" r="3" style={{display: showRegisterPassword ? 'block' : 'none'}} />
                      <g className="eye-closed" style={{display: showRegisterPassword ? 'none' : 'block'}}>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="reg-pass-confirm">Şifre Onay</label>
                <div className="password-input-wrapper">
                  <input 
                    id="reg-pass-confirm" 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    minLength={5} 
                    maxLength={32} 
                    autoComplete="new-password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => {
                      setRegisterForm({...registerForm, confirmPassword: e.target.value});
                      validatePasswordMatch();
                    }}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    <svg className="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path className="eye-open" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" style={{display: showConfirmPassword ? 'block' : 'none'}} />
                      <circle className="eye-open" cx="12" cy="12" r="3" style={{display: showConfirmPassword ? 'block' : 'none'}} />
                      <g className="eye-closed" style={{display: showConfirmPassword ? 'none' : 'block'}}>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="reg-email">E-posta</label>
                <input 
                  id="reg-email" 
                  name="email" 
                  type="email" 
                  required 
                  maxLength={254} 
                  autoComplete="email" 
                  inputMode="email" 
                  placeholder="ornek@posta.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </div>
              <p className="auth-hint">Minecraft kullanıcı adı kuralları geçerlidir. E-posta nLogin hesabınızda (kurtarma vb.) kullanılır. Kayıttan sonra oyunda aynı bilgilerle oturum açın.</p>
              <div className="auth-actions">
                <button type="submit" className="btn btn--primary">Hesap oluştur</button>
              </div>
              {registerMessage && (
              <div id="msg-register" className={`auth-msg ${getMessageType(registerMessage)}`} role="alert">
                <div className="auth-msg__icon">
                  {getMessageType(registerMessage) === 'auth-msg--ok' && '✓'}
                  {getMessageType(registerMessage) === 'auth-msg--err' && '✕'}
                  {getMessageType(registerMessage) === 'auth-msg--info' && 'ⓘ'}
                </div>
                <span className="auth-msg__text">{registerMessage}</span>
              </div>
            )}
            </form>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__grid">
          <div>
            <h3 className="footer__heading">Hesap</h3>
            <p className="footer__text">
              Bu sayfa, nLogin ile paylaşılan MySQL veritabanına BCrypt ile hashlenmiş şifre yazar. Güvenlik için API&apos;yi HTTPS üzerinden yayınlayın ve JWT_SECRET değerini güçlü tutun.
            </p>
            <p className="footer__copy">AVERNETH. © {new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="footer__heading">Hızlı menü</h3>
            <ul className="footer__links">
              <li><Link href="/">Ana Sayfa</Link></li>
              <li><a href="/wiki">Wiki</a></li>
              <li><Link href="/destek">Destek</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      <div className="toast" id="toast" role="status" aria-live="polite" hidden></div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
