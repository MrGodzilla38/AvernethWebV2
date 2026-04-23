'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './destek.css';

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: 'Sunucuya nasıl bağlanırım?',
    answer: 'Minecraft Java Edition 1.20+ ile play.averneth.net adresine bağlanabilirsiniz. Premium hesabınızın olması gerekir. Giriş yaptıktan sonra kayıt işlemlerini tamamlayarak oyuna başlayabilirsiniz.'
  },
  {
    question: 'Rank (rütbe) nasıl alabilirim?',
    answer: 'Mağaza üzerinden kredi kartı, banka havalesi veya mobil ödeme ile bakiye yükleyebilirsiniz. Bakiyenizle istediğiniz rankı satın alabilirsiniz. Ranklar oyun içinde avantajlar ve kozmetik özellikler sunar.'
  },
  {
    question: 'Hile kullanan bir oyuncuyu nasıl şikayet edebilirim?',
    answer: 'Hile şikayetleri için bu sayfadaki ticket formunu kullanabilir veya oyun içinde /ticket komutu ile yetkili ekibimize ulaşabilirsiniz. Şikayetinizde mümkün olduğunca detaylı bilgi ve ekran görüntüleri paylaşın.'
  },
  {
    question: 'Ban itirazı nasıl yapabilirim?',
    answer: 'Yanlışlıkla ban yediğinizi düşünüyorsanız, bu sayfadaki ticket formundan "Ban İtiraz" kategorisini seçerek itirazda bulunabilirsiniz. Yetkili ekibimiz en kısa sürede inceleyip karar verecektir.'
  },
  {
    question: 'Bakiyem/parası görünmüyor veya eksik',
    answer: 'Ödeme sonrası bakiyenizin hesabınıza yansımadığını fark ederseniz, ödeme dekontu ile birlikte destek talebi oluşturun. Teknik sorunlar nedeniyle gecikmeler yaşanabilir, genellikle 24 saat içinde çözülür.'
  },
  {
    question: 'Wiki ve oyun rehberlerine nasıl ulaşabilirim?',
    answer: 'Sitemizdeki Wiki bölümünden oyun hakkında detaylı bilgilere ulaşabilirsiniz. Ayrıca Discord sunucumuzda #yardım kanalından topluluktan destek alabilir veya forumda sorularınızı paylaşabilirsiniz.'
  }
];

const categories = [
  'Teknik Sorun',
  'Hile Şikayeti',
  'Ban İtiraz',
  'Rank Sorunu',
  'Bakiye Sorunu',
  'Diğer'
];

export default function DestekPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // User tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  // Load user tickets
  const loadUserTickets = async () => {
    try {
      const response = await fetch('/api/user/tickets', { credentials: 'include' });
      const data = await response.json();
      if (data.ok && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Ticket yükleme hatası:', error);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; class: string }> = {
      'open': { text: 'Açık', class: 'status-badge status-badge--open' },
      'in_progress': { text: 'İşlemde', class: 'status-badge status-badge--inprogress' },
      'resolved': { text: 'Çözüldü', class: 'status-badge status-badge--resolved' },
      'closed': { text: 'Kapalı', class: 'status-badge status-badge--closed' }
    };
    const s = statusMap[status] || statusMap['open'];
    return <span className={s.class}>{s.text}</span>;
  };

  // Submit reply
  const submitReply = async (ticketId: number) => {
    if (!replyText.trim()) return;
    try {
      const response = await fetch(`/api/user/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: replyText.trim() })
      });
      const data = await response.json();
      if (data.ok) {
        setReplyText('');
        loadUserTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          const updatedTicket = { ...selectedTicket, messages: [...(selectedTicket.messages || []), data.message] };
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Yanıt gönderme hatası:', error);
    }
  };

  // Refresh ticket messages
  const refreshTicketMessages = async () => {
    if (!selectedTicket) return;
    try {
      const response = await fetch('/api/user/tickets', { credentials: 'include' });
      const data = await response.json();
      if (data.ok && data.tickets) {
        const updatedTicket = data.tickets.find((t: any) => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Mesaj yenileme hatası:', error);
    }
  };

  // Ticket modal polling
  useEffect(() => {
    if (!selectedTicket) return;
    const intervalId = setInterval(() => {
      refreshTicketMessages();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [selectedTicket?.id]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUsername(data.username);
          setName(data.username);
          setBalance(data.balance || 0);
          setHeaderAvatarUrl(`https://mc-heads.net/avatar/${data.username}/40`);
          loadUserTickets();
          setIsLoading(false);
        } else {
          // Giriş yapılmamışsa auth sayfasına yönlendir
          window.location.replace('/auth');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.replace('/auth');
      }
    };
    checkAuth();
  }, []);

  // Auth kontrolü devam ederken loading göster
  if (isLoading) {
    return (
      <div className="loading-screen" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-deep, #0a0a0f)',
        color: 'var(--silver-100, #e2e8f0)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border, #2a2a3a)',
            borderTop: '3px solid var(--purple-500, #8b5cf6)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const copyIP = () => {
    navigator.clipboard.writeText('play.averneth.net');
    showToast('Sunucu IP kopyalandı!');
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('is-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Dosya boyutu en fazla 5MB olabilir.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setFormError('Sadece resim dosyaları yüklenebilir.');
        return;
      }
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormError('');
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username || !category || !subject || !message) {
      setFormError('Lütfen tüm alanları doldurun ve giriş yaptığınızdan emin olun.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('subject', subject);
      formData.append('message', message);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await fetch('/api/destek', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.ok) {
        showToast('Destek talebiniz alındı!');
        setCategory('');
        setSubject('');
        setMessage('');
        setAttachment(null);
        setAttachmentPreview(null);
        if (!isLoggedIn) {
          setName('');
        }
        // Ticket listesini hemen yenile
        loadUserTickets();
      } else {
        setFormError(data.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      setFormError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="noise" aria-hidden="true"></div>
      <header className="topbar">
        <div className="container topbar__inner">
          <Link className="brand" href="/">
            <Image
              className="brand__logo"
              src="/assets/averneth-logo.png"
              width={160}
              height={160}
              alt=""
            />
            <span className="brand__text">Averneth</span>
          </Link>
          <nav className="nav" aria-label="Ana menü">
            <button
              type="button"
              className="nav__toggle"
              aria-expanded={mobileMenuOpen}
              aria-controls="nav-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              Menü
            </button>
            <ul id="nav-menu" className={`nav__list ${mobileMenuOpen ? 'is-open' : ''}`}>
              <li><Link className="nav__link" href="/">Ana Sayfa</Link></li>
              <li><a className="nav__link" href="#haberler">Haberler</a></li>
              <li><a className="nav__link" href="#magaza">Mağaza</a></li>
              <li><a className="nav__link" href="#forum">Forum</a></li>
              <li><Link className="nav__link" href="/wiki">Wiki</Link></li>
              <li><Link className="nav__link nav__link--active" href="/destek" aria-current="page">Destek</Link></li>
              <li><a className="nav__link" href="#yetkili-basvuru">Yetkili Başvuru</a></li>
            </ul>
          </nav>
          <div className="topbar__actions wiki-top-actions">
            {isLoggedIn ? (
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
                <span className="header-balance">{Math.floor(balance)} ₺</span>
              </Link>
            ) : (
              <div className="auth-btn-group">
                <Link className="auth-btn-group__btn" href="/auth#giris">Giriş Yap</Link>
                <span className="auth-btn-group__divider" />
                <Link className="auth-btn-group__btn auth-btn-group__btn--primary" href="/auth#kayit">Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="destek-page">
        {/* Hero */}
        <section className="destek-hero">
          <div className="container">
            <h1 className="destek-hero__title">Destek Merkezi</h1>
            <p className="destek-hero__subtitle">Sorununu bildir, en kısa sürede yardımcı olalım.</p>
          </div>
        </section>

        <div className="container destek-layout">
          {/* SSS Accordion */}
          <section className="section destek-section">
            <div className="section__head">
              <h2 className="section__title">Sıkça Sorulan Sorular</h2>
            </div>
            <div className="faq-list">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${openFaqIndex === index ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-item__question"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={openFaqIndex === index}
                  >
                    <span>{faq.question}</span>
                    <svg className="faq-item__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="faq-item__answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Form + Tickets Grid */}
          <div className="form-tickets-grid">
            {/* Ticket Form */}
            <section className="section destek-section">
              <div className="section__head">
                <h2 className="section__title">Destek Talebi Oluştur</h2>
              </div>
              <form className="ticket-form" onSubmit={handleSubmit}>
                {formError && (
                  <div className="form-error">{formError}</div>
                )}
                <div className="form-group">
                  <label htmlFor="name">İsim</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={isLoggedIn}
                    placeholder={isLoggedIn ? username : 'Kullanıcı adınız'}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="category">Kategori</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Konu</label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sorunun kısa özeti"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Mesaj</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                    rows={5}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="attachment">Fotoğraf Ekle (Opsiyonel)</label>
                  <div className="attachment-upload">
                    <input
                      type="file"
                      id="attachment"
                      accept="image/*"
                      onChange={handleAttachmentChange}
                      className="attachment-input"
                    />
                    <label htmlFor="attachment" className="attachment-label">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 8l-5-5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{attachment ? attachment.name : 'Fotoğraf seç...'}</span>
                    </label>
                    <span className="form-hint">Max 5MB, sadece resim dosyaları</span>
                  </div>
                  {attachmentPreview && (
                    <div className="attachment-preview">
                      <img src={attachmentPreview} alt="Önizleme" />
                      <button type="button" className="attachment-remove" onClick={removeAttachment} title="Kaldır">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn--primary btn--lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </form>
            </section>

            {/* User Tickets List */}
            <section className="section destek-section">
              <div className="section__head">
                <h2 className="section__title">Destek Taleplerim</h2>
              </div>
              {tickets.length === 0 ? (
                <div className="empty-state">Henüz destek talebi bulunmuyor.</div>
              ) : (
                <div className="tickets-list">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className={`ticket-card ticket-card--${ticket.status}`}>
                      <div className="ticket-card__info">
                        <span className="ticket-card__id">#{ticket.id}</span>
                        <span className="ticket-card__category">{ticket.category}</span>
                      </div>
                      {getStatusBadge(ticket.status)}
                      <div className="ticket-card__subject">{ticket.subject}</div>
                      <span className="ticket-card__date">{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</span>
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="btn btn--primary btn--xs"
                      >
                        Görüntüle
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Quick Contact Cards */}
          <section className="section destek-section">
            <div className="section__head">
              <h2 className="section__title">Hızlı İletişim</h2>
            </div>
            <div className="contact-grid">
              <a href="https://discord.gg/averneth" target="_blank" rel="noopener noreferrer" className="contact-card">
                <div className="contact-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <h3 className="contact-card__title">Discord</h3>
                <p className="contact-card__text">Canlı destek ve topluluk</p>
              </a>
              <a href="mailto:destek@averneth.net" className="contact-card">
                <div className="contact-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="contact-card__title">E-posta</h3>
                <p className="contact-card__text">destek@averneth.net</p>
              </a>
              <div className="contact-card">
                <div className="contact-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 10c0-2-1.79-4-4-4S8 8 8 10" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="contact-card__title">Oyun İçi</h3>
                <p className="contact-card__text">/ticket komutu</p>
              </div>
            </div>
          </section>
        </div>
      </main>

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
                {/* Original Ticket Message */}
                <div className="chat-message chat-message--user">
                  <div className="chat-message__avatar">
                    <img src={`https://mc-heads.net/avatar/${selectedTicket.name}/36`} alt="" width={36} height={36} />
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
                        const base64Data = att.data || att.base64;
                        if (base64Data && base64Data.length > 100) {
                          return (
                            <div className="chat-message__attachment">
                              <a href={`data:${att.type || 'image/jpeg'};base64,${base64Data}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                <img src={`data:${att.type || 'image/jpeg'};base64,${base64Data}`} alt={att.name || 'Ek'} />
                                <span className="attachment-name">{att.name}</span>
                              </a>
                            </div>
                          );
                        }
                      } catch (e) { console.error('Attachment parse error:', e); }
                      return null;
                    })()}
                  </div>
                </div>
                {/* Reply Messages */}
                {selectedTicket.messages?.map((msg: any) => (
                  <div key={msg.id} className={`chat-message ${msg.isStaff ? 'chat-message--staff' : 'chat-message--user'}`}>
                    <div className="chat-message__avatar">
                      <img src={`https://mc-heads.net/avatar/${msg.senderAvatar || msg.sender}/36`} alt="" width={36} height={36} />
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
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                <div className="chat-reply">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    className="chat-reply__input"
                    rows={3}
                  />
                  <button 
                    onClick={() => submitReply(selectedTicket.id)}
                    className="btn btn--primary chat-reply__btn"
                    disabled={!replyText.trim()}
                  >
                    Gönder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container footer__grid">
          <div>
            <h3 className="footer__heading">Hakkımızda</h3>
            <p className="footer__text">
              AVERNETH, karanlık fantezi dünyasında geçen bağımsız bir Minecraft MMORPG projesidir. Bu sayfa örnek içerik içerir; metinleri panel üzerinden güncelleyebilirsiniz.
            </p>
            <p className="footer__copy">AVERNETH. Tüm hakları saklıdır. © {new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="footer__heading">Hızlı menü</h3>
            <ul className="footer__links">
              <li><a href="/">Ana Sayfa</a></li>
              <li><a href="#magaza">Mağaza</a></li>
              <li><a href="#forum">Forum</a></li>
              <li><a href="/destek">Destek</a></li>
            </ul>
          </div>
          <div>
            <h3 className="footer__heading">Bağlantılar</h3>
            <ul className="footer__links">
              <li><a href="#kurallar">Kurallar</a></li>
              <li><a href="#terms">Hizmet Şartları</a></li>
              <li><a href="#privacy">Gizlilik Politikası</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
