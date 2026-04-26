'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './basvuru.css';
import { debug } from '@/lib/debug';

const positions = [
  { value: 'Rehber', label: 'Rehber', desc: 'Yeni oyunculara yardım eder.' },
  { value: 'Mimar', label: 'Mimar', desc: 'Yapı ve event alanı tasarlar.' },
  { value: 'Moderator', label: 'Moderator', desc: 'Düzen sağlar, şikayet inceler.' },
  { value: 'Developer', label: 'Developer', desc: 'Plugin ve sistem geliştirir.' }
];

export default function BasvuruPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [discord, setDiscord] = useState('');
  const [age, setAge] = useState('');
  const [position, setPosition] = useState('');
  const [experience, setExperience] = useState('');
  const [why, setWhy] = useState('');
  const [availability, setAvailability] = useState('');
  const [about, setAbout] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUsername(data.username);
          setBalance(data.balance || 0);
          setHeaderAvatarUrl(`https://mc-heads.net/avatar/${data.username}/40`);
          loadMyApplications();
        }
      } catch (e) {
        debug.error('Auth check failed:', e);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const loadMyApplications = async () => {
    try {
      const res = await fetch('/api/user/basvurular', { credentials: 'include' });
      const data = await res.json();
      if (data.ok && data.applications) setMyApplications(data.applications);
    } catch (e) {
      debug.error('Basvuru yukleme hatasi:', e);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge--pending',
      reviewing: 'badge--reviewing',
      accepted: 'badge--accepted',
      rejected: 'badge--rejected',
    };
    const texts: Record<string, string> = {
      pending: 'Beklemede',
      reviewing: 'İnceleniyor',
      accepted: 'Kabul Edildi',
      rejected: 'Reddedildi',
    };
    return <span className={`badge ${map[status] || 'badge--pending'}`}>{texts[status] || 'Beklemede'}</span>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!firstName.trim() || !lastName.trim() || !discord.trim() || !age || !position || !experience.trim() || !why.trim() || !availability.trim()) {
      setFormError('Tüm zorunlu alanlar doldurulmalıdır.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/basvuru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, discord, age, position, experience, why, availability, about })
      });
      const data = await res.json();
      if (data.ok) {
        setFormSuccess(data.message || 'Başvurunuz alındı!');
        setFirstName(''); setLastName(''); setDiscord(''); setAge(''); setPosition('');
        setExperience(''); setWhy(''); setAvailability(''); setAbout('');
        loadMyApplications();
      } else {
        setFormError(data.error || 'Bir hata oluştu.');
      }
    } catch (e) {
      setFormError('Sunucu hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="basvuru-loading">
        <div className="basvuru-loading__spinner" />
      </div>
    );
  }

  return (
    <div className="basvuru-page">
      <div className="noise" aria-hidden="true" />
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
            <button type="button" className="nav__toggle" aria-expanded="false" aria-controls="nav-menu">Menü</button>
            <ul id="nav-menu" className="nav__list">
              <li><Link className="nav__link" href="/">Ana Sayfa</Link></li>
              <li><Link className="nav__link" href="/">Haberler</Link></li>
              <li><Link className="nav__link" href="/">Mağaza</Link></li>
              <li><Link className="nav__link" href="/">Forum</Link></li>
              <li><Link className="nav__link" href="/wiki">Wiki</Link></li>
              <li><Link className="nav__link" href="/destek">Destek</Link></li>
              <li><Link className="nav__link nav__link--active" href="/basvuru" aria-current="page">Yetkili Başvuru</Link></li>
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

      <section className="basvuru-hero">
        <div className="container">
          <h1 className="basvuru-hero__title">Yetkili Başvurusu</h1>
          <p className="basvuru-hero__subtitle">Averneth ekibine katılmak mı istiyorsun? Aşağıdaki formu doldurarak başvurunu gönder. Yetkili ekibimiz en kısa sürede değerlendirecektir.</p>
        </div>
      </section>

      <main className="container basvuru-layout">
        {!isLoggedIn && (
          <div className="basvuru-card basvuru-cta">
            <p className="basvuru-cta__text">Başvuru yapabilmek için giriş yapmalısın.</p>
            <Link href="/auth" className="btn btn--primary">Giriş Yap</Link>
          </div>
        )}

        {isLoggedIn && (
          <>
            <div className="basvuru-card">
              {formError && <div className="basvuru-alert basvuru-alert--error" style={{ marginBottom: '1.25rem' }}>{formError}</div>}
              {formSuccess && <div className="basvuru-alert basvuru-alert--success" style={{ marginBottom: '1.25rem' }}>{formSuccess}</div>}

              <form onSubmit={handleSubmit} className="basvuru-form">
                <div className="basvuru-form__row">
                  <div className="basvuru-form__group">
                    <label className="basvuru-form__label">İsim <span className="required">*</span></label>
                    <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Adın" className="basvuru-form__input" />
                  </div>
                  <div className="basvuru-form__group">
                    <label className="basvuru-form__label">Soyisim <span className="required">*</span></label>
                    <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Soyadın" className="basvuru-form__input" />
                  </div>
                </div>

                <div className="basvuru-form__row">
                  <div className="basvuru-form__group">
                    <label className="basvuru-form__label">Discord Kullanıcı Adı <span className="required">*</span></label>
                    <input type="text" value={discord} onChange={e=>setDiscord(e.target.value)} placeholder="kullanici#0000" className="basvuru-form__input" />
                  </div>
                  <div className="basvuru-form__group">
                    <label className="basvuru-form__label">Yaş <span className="required">*</span></label>
                    <input type="number" value={age} onChange={e=>setAge(e.target.value)} min="13" max="100" className="basvuru-form__input" />
                  </div>
                </div>

                <div className="basvuru-form__group">
                  <label className="basvuru-form__label">Pozisyon <span className="required">*</span></label>
                  <div className="basvuru-positions">
                    {positions.map(p => (
                      <button key={p.value} type="button" onClick={()=>setPosition(p.value)}
                        className={`basvuru-position ${position===p.value ? 'is-selected' : ''}`}>
                        <div className="basvuru-position__title">{p.label}</div>
                        <div className="basvuru-position__desc">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="basvuru-form__group">
                  <label className="basvuru-form__label">Deneyimlerin <span className="required">*</span></label>
                  <textarea value={experience} onChange={e=>setExperience(e.target.value)} rows={4} placeholder="Daha önce hangi sunucularda yetkili oldun? Ne tür deneyimlerin var?" className="basvuru-form__textarea" />
                </div>

                <div className="basvuru-form__group">
                  <label className="basvuru-form__label">Neden Sen? <span className="required">*</span></label>
                  <textarea value={why} onChange={e=>setWhy(e.target.value)} rows={4} placeholder="Neden bu pozisyonu hak ettiğini düşünüyorsun? Sunucuya ne katacaksın?" className="basvuru-form__textarea" />
                </div>

                <div className="basvuru-form__group">
                  <label className="basvuru-form__label">Aktiflik / Müsaitlik <span className="required">*</span></label>
                  <textarea value={availability} onChange={e=>setAvailability(e.target.value)} rows={3} placeholder="Haftada kaç saat aktif olabilirsin? Hangi saatler müsaitsin?" className="basvuru-form__textarea" />
                </div>

                <div className="basvuru-form__group">
                  <label className="basvuru-form__label">Kendinden Bahset</label>
                  <textarea value={about} onChange={e=>setAbout(e.target.value)} rows={3} placeholder="Kendin hakkında kısa bir bilgi, hobilerin, ilgi alanların..." className="basvuru-form__textarea" />
                </div>

                <button type="submit" disabled={isSubmitting} className="basvuru-submit">
                  {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                </button>
              </form>
            </div>

            {/* Başvuru Geçmişi */}
            {myApplications.length > 0 && (
              <div className="basvuru-card">
                <div className="basvuru-history__header">
                  <h2 className="basvuru-history__title">Başvuru Geçmişin</h2>
                  <button onClick={()=>setShowHistory(!showHistory)} className="basvuru-history__toggle">
                    {showHistory ? 'Gizle' : 'Göster'}
                  </button>
                </div>
                {showHistory && (
                  <div>
                    {myApplications.map(app => (
                      <div key={app.id} className="basvuru-app">
                        <div className="basvuru-app__top">
                          <div className="basvuru-app__meta">
                            <span className="basvuru-app__position">{app.position}</span>
                            {getStatusBadge(app.status)}
                          </div>
                          <span className="basvuru-app__date">{new Date(app.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <button
                          onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                          className="basvuru-app__detail-toggle"
                        >
                          {expandedAppId === app.id ? 'Detayları Gizle' : 'Detayları Gör'}
                        </button>

                        {expandedAppId === app.id && (
                          <div className="basvuru-app__details">
                            <div className="basvuru-app__detail-grid">
                              <div>
                                <div className="basvuru-app__detail-label">İsim Soyisim</div>
                                <div className="basvuru-app__detail-box">{(app.firstName || app.first_name || '-') + ' ' + (app.lastName || app.last_name || '')}</div>
                              </div>
                              <div>
                                <div className="basvuru-app__detail-label">Discord</div>
                                <div className="basvuru-app__detail-box">{app.discord || '-'}</div>
                              </div>
                              <div>
                                <div className="basvuru-app__detail-label">Yaş</div>
                                <div className="basvuru-app__detail-box">{app.age || '-'}</div>
                              </div>
                              <div>
                                <div className="basvuru-app__detail-label">Email</div>
                                <div className="basvuru-app__detail-box">{app.email || '-'}</div>
                              </div>
                              <div>
                                <div className="basvuru-app__detail-label">Deneyim</div>
                                <div className="basvuru-app__detail-box" style={{ whiteSpace: 'pre-wrap' }}>{app.experience}</div>
                              </div>
                              <div>
                                <div className="basvuru-app__detail-label">Neden Sen?</div>
                                <div className="basvuru-app__detail-box" style={{ whiteSpace: 'pre-wrap' }}>{app.why}</div>
                              </div>
                              <div>
                                <div className="basvuru-app__detail-label">Aktiflik</div>
                                <div className="basvuru-app__detail-box" style={{ whiteSpace: 'pre-wrap' }}>{app.availability}</div>
                              </div>
                              {app.about && (
                                <div>
                                  <div className="basvuru-app__detail-label">Hakkında</div>
                                  <div className="basvuru-app__detail-box" style={{ whiteSpace: 'pre-wrap' }}>{app.about}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {app.comments && app.comments.length > 0 && (
                          <div className="basvuru-app__comments">
                            {app.comments.map((c: any) => (
                              <div key={c.id} className="basvuru-app__comment">
                                <span className="basvuru-app__comment-author">{c.author}</span>
                                <span className="basvuru-app__comment-time">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span>
                                <p className="basvuru-app__comment-text">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
