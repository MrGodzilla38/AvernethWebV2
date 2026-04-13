'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve');

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUsername(data.username);
          setHeaderAvatarUrl(`https://mc-heads.net/avatar/${data.username}/40`);
//      try {
//        const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${data.username}`);
//        if (res.ok) {
//          const mojang = await res.json();
//          if (mojang?.id) setHeaderAvatarUrl(`https://minotar.net/avatar/${mojang.id}/40`);
//        }
//      } catch (_) {}
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

  const copyIP = () => {
    navigator.clipboard.writeText('play.averneth.net');
    showToast('Sunucu IP kopyalandı!');
  };

  const showToast = (message: string) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.display = 'block';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <>
      <div className="noise" aria-hidden="true"></div>
      <header className="topbar">
        <div className="container topbar__inner">
          <Link className="brand" href="#anasayfa">
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
            <button type="button" className="nav__toggle" aria-expanded="false" aria-controls="nav-menu">Menü</button>
            <ul id="nav-menu" className="nav__list">
              <li><a className="nav__link nav__link--active" href="#anasayfa" aria-current="page">Ana Sayfa</a></li>
              <li><a className="nav__link" href="#haberler">Haberler</a></li>
              <li><a className="nav__link" href="#magaza">Mağaza</a></li>
              <li><a className="nav__link" href="#forum">Forum</a></li>
              <li><Link className="nav__link" href="/wiki">Wiki</Link></li>
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
            {isLoggedIn ? (
              <Link href="/auth" className="header-profile" title="Hesabım">
                <img
                  src={headerAvatarUrl}
                  alt="Profil"
                  className="header-profile__img"
                  width={40}
                  height={40}
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => { e.currentTarget.src = 'https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve'; }}
                />
              </Link>
            ) : (
              <>
                <Link className="btn btn--ghost" href="/auth#giris">Giriş</Link>
                <Link className="btn btn--primary" href="/auth#kayit">Kayıt</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="anasayfa">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__scene" aria-hidden="true">
            <div className="hero__bg"></div>
            <div className="hero__bg-shade"></div>
          </div>
          <div className="container hero__center">
            <div className="hero__content">
              <p className="season-tag"><span className="season-tag__dot" aria-hidden="true"></span> SEZON 4 — KARANLIK KRALLIK</p>
              <h1 className="hero__title" id="hero-title">
                <Image
                  className="hero__title-img"
                  src="/assets/averneth-logo.png"
                  width={800}
                  height={800}
                  alt="Averneth"
                />
              </h1>
              <p className="hero__lead">
                Karanlık bir dünyada efsanenin yazılacağı yer. Minecraft MMORPG deneyiminin zirvesi.
              </p>
              <p className="hero__keywords">SAVAŞ <span aria-hidden="true">•</span> KEŞFET <span aria-hidden="true">•</span> HÜKMET</p>
              <div className="hero__cta">
                <a className="btn btn--primary btn--lg btn--glow" href="#magaza">
                  <svg className="btn__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 7h15l-1.5 9h-12L6 7zm0 0L5 3H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="20" r="1.3" fill="currentColor"/>
                    <circle cx="18" cy="20" r="1.3" fill="currentColor"/>
                  </svg>
                  Mağazayı Keşfet
                </a>
                <a className="btn btn--discord btn--lg" href="https://discord.gg/averneth">
                  <svg className="btn__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord&apos;a Katıl
                </a>
              </div>
              <div className="hero__ip-bar">
                <span className="hero__ip-dot" aria-hidden="true"></span>
                <span className="hero__ip-label">SUNUCU IP</span>
                <code className="hero__ip-value">play.averneth.net</code>
                <button type="button" className="hero__ip-copy" onClick={copyIP} aria-label="Adresi kopyala" title="Kopyala">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>
            </div>
            <a className="hero__scroll" href="#haberler">
              <span className="hero__scroll-text">KEŞFET</span>
              <span className="hero__scroll-arrow" aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <div className="container layout">
          <div className="layout__main">
            <section className="section" id="haberler">
              <div className="section__head">
                <h2 className="section__title">Haberler &amp; duyurular</h2>
                <a className="link-arrow" href="#tum-haberler">Tümü</a>
              </div>
              <div className="news-grid">
                <article className="news-card">
                  <span className="news-card__tag">Etkinlik</span>
                  <time className="news-card__date" dateTime="2026-04-02">2 Nis 2026</time>
                  <h3 className="news-card__title">Gölge pazarı açıldı</h3>
                  <p className="news-card__excerpt">Nadir eşya takasları ve lonca sözleşmeleri için yeni NPC bölgesi aktif.</p>
                  <span className="news-card__meta"><span className="news-card__views">892</span> görüntüleme</span>
                  <a className="news-card__link" href="#haber-1">Devamını oku</a>
                </article>
                <article className="news-card">
                  <span className="news-card__tag">Denge</span>
                  <time className="news-card__date" dateTime="2026-03-28">28 Mar 2026</time>
                  <h3 className="news-card__title">Sınıf yetenekleri yeniden düzenlendi</h3>
                  <p className="news-card__excerpt">Büyücü ve gölgeler arası PvE dengesi güncellendi; geri bildirimleriniz için teşekkürler.</p>
                  <span className="news-card__meta"><span className="news-card__views">2.104</span> görüntüleme</span>
                  <a className="news-card__link" href="#haber-2">Devamını oku</a>
                </article>
                <article className="news-card">
                  <span className="news-card__tag">Duyuru</span>
                  <time className="news-card__date" dateTime="2026-03-15">15 Mar 2026</time>
                  <h3 className="news-card__title">Sunucu bakımı tamamlandı</h3>
                  <p className="news-card__excerpt">Performans iyileştirmeleri ve yeni zindan önbelleği devreye alındı.</p>
                  <span className="news-card__meta"><span className="news-card__views">3.421</span> görüntüleme</span>
                  <a className="news-card__link" href="#haber-3">Devamını oku</a>
                </article>
              </div>
            </section>

            <section className="section section--alt" id="sunucu">
              <h2 className="section__title">Neden AVERNETH?</h2>
              <ul className="feature-list">
                <li><strong>Derin MMORPG</strong> — Görev zincirleri, sınıflar ve uzmanlık ağaçları.</li>
                <li><strong>Lonca sistemi</strong> — Kale kuşatmaları ve bölgesel hakimiyet.</li>
                <li><strong>Özel zindanlar</strong> — Mekanik bosslar ve takım oyunu odaklı içerik.</li>
                <li><strong>Adil ekonomi</strong> — Kozmetik odaklı mağaza, oyun içi kazanım yolları.</li>
              </ul>
            </section>
          </div>

          <aside className="layout__side" aria-label="Yan panel">
            <div className="side-card">
              <h3 className="side-card__title">Bu ay — destek sıralaması</h3>
              <ol className="rank-list">
                <li><span className="rank-list__name">Eclipsa_</span> <span className="rank-list__val">—</span></li>
                <li><span className="rank-list__name">Morwen</span> <span className="rank-list__val">—</span></li>
                <li><span className="rank-list__name">Thalric</span> <span className="rank-list__val">—</span></li>
              </ol>
              <p className="side-card__note">Canlı sıralama LeaderOS / mağaza entegrasyonu ile güncellenebilir.</p>
            </div>
            <div className="side-card">
              <h3 className="side-card__title">Son kayıtlar</h3>
              <ul className="join-list">
                <li><span className="join-list__name">VoidWalker</span> <span className="join-list__time">az önce</span></li>
                <li><span className="join-list__name">Sylaise</span> <span className="join-list__time">3 dk önce</span></li>
                <li><span className="join-list__name">Kaelen</span> <span className="join-list__time">11 dk önce</span></li>
                <li><span className="join-list__name">Ashryn</span> <span className="join-list__time">24 dk önce</span></li>
              </ul>
            </div>
            <div className="side-card side-card--social">
              <h3 className="side-card__title">Sosyal</h3>
              <div className="social-row">
                <a className="social-btn" href="https://discord.gg/averneth" aria-label="Discord">Discord</a>
                <a className="social-btn social-btn--muted" href="#" aria-label="YouTube">YouTube</a>
              </div>
            </div>
          </aside>
        </div>

        <section className="section section--quick container" aria-label="Hızlı erişim">
          <div className="quick-grid">
            <a className="quick-tile" id="magaza" href="#">
              <span className="quick-tile__label">Mağaza</span>
              <span className="quick-tile__hint">Kozmetik ve destek</span>
            </a>
            <a className="quick-tile" id="forum" href="#">
              <span className="quick-tile__label">Forum</span>
              <span className="quick-tile__hint">Topluluk ve rehberler</span>
            </a>
            <a className="quick-tile" id="yardim" href="#">
              <span className="quick-tile__label">Yardım</span>
              <span className="quick-tile__hint">SSS ve dokümantasyon</span>
            </a>
            <a className="quick-tile" id="destek" href="#">
              <span className="quick-tile__label">Destek</span>
              <span className="quick-tile__hint">Bilet ve iletişim</span>
            </a>
            <a className="quick-tile" id="yetkili-basvuru" href="#">
              <span className="quick-tile__label">Yetkili Başvuru</span>
              <span className="quick-tile__hint">Ekip başvurusu</span>
            </a>
          </div>
        </section>

        <section className="section section--auth" aria-labelledby="auth-title">
          <div className="container auth-panel">
            <h2 id="auth-title" className="section__title">Hesap</h2>
            <p className="auth-panel__text auth-panel__text--lead">
              Giriş ve kayıt, sunucudaki <strong>nLogin</strong> hesaplarıyla aynı MySQL veritabanını kullanır (BCrypt). Tam form için hesap sayfasına gidin.
            </p>
            <div className="auth-panel__actions">
              <Link className="btn btn--primary" href="/auth#giris">Giriş yap</Link>
              <Link className="btn btn--ghost" href="/auth#kayit">Kayıt ol</Link>
            </div>
          </div>
        </section>

        <section className="section section--legal container" aria-label="Yasal bilgiler">
          <p id="kurallar" className="legal-line" tabIndex={-1}>
            <strong>Kurallar.</strong> Sunucu kuralları için ayrı bir sayfa veya forum başlığına yönlendirin.
          </p>
          <p id="terms" className="legal-line" tabIndex={-1}>
            <strong>Hizmet şartları.</strong> Ticari ve kullanım koşulları metninizi buraya ekleyin.
          </p>
          <p id="privacy" className="legal-line" tabIndex={-1}>
            <strong>Gizlilik.</strong> Veri işleme ve çerez politikası bağlantınızı burada verin.
          </p>
        </section>
      </main>

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
              <li><a href="#anasayfa">Ana Sayfa</a></li>
              <li><a href="#magaza">Mağaza</a></li>
              <li><a href="#forum">Forum</a></li>
              <li><a href="#yardim">Yardım</a></li>
              <li><a href="#destek">Destek</a></li>
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

      <div className="toast" id="toast" role="status" aria-live="polite" hidden></div>
    </>
  );
}
