'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import './auth.css';

function AuthPageContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=80&default=MHF_Steve');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', email: '' });
  const [loginMessage, setLoginMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
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
          setUser({ username: data.username, rank: data.rank });
          loadMinecraftAvatar(data.username);
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
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
          window.location.reload();
        }, 1000);
      } else {
        setRegisterMessage(data.error || 'Kayıt başarısız');
      }
    } catch (error) {
      setRegisterMessage('Bir hata oluştu');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
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
                <li><a className="nav__link" href="/wiki">Wiki</a></li>
                <li><Link className="nav__link" href="/admin">Admin Paneli</Link></li>
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
                  <span className="profile-card__rank">{user.rank}</span>
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
                      <span>0.00 ₺</span>
                      <button className="add-balance-btn">+</button>
                    </div>
                  </div>
                  <div className="details-item">
                    <span className="details-item__label">Kayıt Tarihi:</span>
                    <span className="details-item__value">-</span>
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
                    <span className="details-item__value">-</span>
                  </div>
                </div>
              </section>

              <section className="dashboard-section">
                <h3 className="dashboard-section__title">Destek Talepleri</h3>
                <div className="empty-state">Veri bulunamadı!</div>
              </section>

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
                <li><a href="#destek">Destek</a></li>
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
              <li><a className="nav__link" href="#yardim">Yardım</a></li>
              <li><a className="nav__link" href="#destek">Destek</a></li>
              <li><a className="nav__link" href="#yetkili-basvuru">Yetkili Başvuru</a></li>
            </ul>
          </nav>
          <div className="topbar__actions wiki-top-actions">
            <button type="button" className="ip-pill" onClick={copyIP} title="Adresi kopyala" aria-label="Sunucu IP kopyala">
              <svg className="ip-pill__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 17V7a2 2 0 012-2h6l4 4v8a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 5v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 13h.01M12 13h.01M16 13h.01M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="ip-pill__text">play.averneth.net</span>
            </button>
            <Link className="btn btn--ghost" href="#giris">Giriş Yap</Link>
            <Link className="btn btn--primary" href="#kayit">Kayıt Ol</Link>
          </div>
        </div>
      </header>

      <main className="auth-main">
        <div className="container auth-layout" id="auth-guest-view">
          <div className="auth-hero">
            <h1 className="auth-hero__title">Hesap</h1>
          </div>

          <div className="auth-forms">
            <div id="giris" className="auth-card" tabIndex={-1}>
              <h2 className="auth-card__title">Giriş</h2>
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

            <div id="kayit" className="auth-card" tabIndex={-1}>
              <h2 className="auth-card__title">Kayıt</h2>
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
              <li><a href="#destek">Destek</a></li>
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
