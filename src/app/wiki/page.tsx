'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './wiki.css';
import { debug } from '@/lib/debug';

export default function WikiPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('https://crafatar.com/avatars/MHF_Steve?size=40&default=MHF_Steve');
  const [activeFilter, setActiveFilter] = useState('tumu');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.ok && data.loggedIn) {
          setIsLoggedIn(true);
          setUsername(data.username);
          setBalance(data.balance || 0);
          setHeaderAvatarUrl(`https://mc-heads.net/avatar/${data.username}/40`);
        }
      } catch (error) {
        debug.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

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

  const races = [
    {
      id: 'irk-iblis',
      name: 'İBLİS',
      shortName: 'iblis',
      stages: '2 evrim aşaması',
      icon: '🔥',
      tags: 'buyu',
      search: 'iblis şeytan şeytanlordu cehennem ateş büyü mana',
      description: 'Cehennem alevlerinden beslenen karanlık varlıklar. Ateş onlara dokunmaz, su ise en büyük düşmanlarıdır. Büyü hasarında zirvedirler fakat fiziksel savunmaları incedir.',
      stats: { can: 110, mana: 200, guc: 13 },
      evolutions: [
        {
          title: 'İblis',
          meta: 'Başlangıç formu',
          description: 'Cehennem alevlerinden beslenen karanlık varlıklar. Ateş onlara dokunmaz, su ise en büyük düşmanlarıdır. Büyü hasarında zirvedirler fakat fiziksel savunmaları incedir.',
          passive: 'Güç 13, Can 110, Mana 200, Rejen 1.5/sn, Şans 5, Dayanıklılık 9, Kritik %12, Kritik Hasar %18, Hız 100',
          ability: 'Büyü hasarı +%15 | Ateş bağışık (burning-time:0) | Sudan hasar alır'
        },
        {
          title: 'Şeytan',
          meta: 'İblis evrimi — Lv.20',
          description: 'İblisin daha güçlü ve korku salan formu. Büyük boynuzlar ve kanat taslağıyla tanınır.',
          passive: 'Güç 15, Can 130, Mana 230, Rejen 2.0/sn, Şans 5, Dayanıklılık 11, Kritik %11, Kritik Hasar %16, Hız 100',
          ability: 'Korku aurası (MythicMobs) | Ateş bağışık | Sudan hasar alır'
        },
        {
          title: 'ŞEYTANLOARDU',
          meta: 'Şeytan evrimi — Lv.50',
          description: 'İblis ırkının nihai formu. Tam kanatlar ve olağanüstü büyü gücüyle donatılmıştır.',
          passive: 'Güç 17, Can 155, Mana 280, Rejen 2.5/sn, Şans 6, Dayanıklılık 13, Kritik %14, Kritik Hasar %20, Hız 100',
          ability: 'Büyü hasarı +%25 | Ateş bağışık | Sudan hasar alır'
        }
      ]
    },
    {
      id: 'irk-elf',
      name: 'ELF',
      shortName: 'elf',
      stages: '2 evrim aşaması',
      icon: '🍃',
      tags: 'buyu destek',
      search: 'elf melek serafim doğa ok iyileştirme',
      description: 'Doğayla iç içe büyümüş, uzun ömürlü bir ırk. Savaşta hız ve hassasiyete güvenir. Vücut yenilenme güçleri olağanüstü yüksektir.',
      stats: { can: 95, mana: 150, guc: 11 },
      evolutions: [
        {
          title: 'Elf',
          meta: 'Başlangıç formu',
          description: 'Doğayla iç içe büyümüş, uzun ömürlü bir ırk. Savaşta hız ve hassasiyete güvenir. Vücut yenilenme güçleri olağanüstü yüksektir.',
          passive: 'Güç 11, Can 95, Mana 150, Rejen 2.5/sn, Şans 10, Dayanıklılık 8, Kritik %16, Kritik Hasar %22, Hız 100',
          ability: 'Ok hasarı +%20 | health-regen attr. ile hızlı can yenilenme'
        },
        {
          title: 'Melek',
          meta: 'Elf evrimi — Lv.25',
          description: 'Doğanın iyileştirici gücünü tam anlamıyla özümsemiş Elf formu. Küçük beyaz kanatlar ve halo taşır.',
          passive: 'Güç 12, Can 110, Mana 200, Rejen 3.5/sn, Şans 10, Dayanıklılık 10, Kritik %14, Kritik Hasar %20, Hız 100',
          ability: 'İyileştirme büyüsü +%25 | Çok hızlı can yenilenme'
        },
        {
          title: 'Serafim',
          meta: 'Melek evrimi — Lv.55',
          description: 'Elf ırkının nihai formu. 6 büyük kanat ve parlak halo ile en yüksek can yenilenme hızına sahiptir.',
          passive: 'Güç 14, Can 125, Mana 240, Rejen 5.0/sn, Şans 12, Dayanıklılık 12, Kritik %15, Kritik Hasar %22, Hız 100',
          ability: 'En yüksek can yenilenme hızı | 6 kanatlı görünüm'
        }
      ]
    },
    {
      id: 'irk-insan',
      name: 'İNSAN',
      shortName: 'insan',
      stages: '2 evrim aşaması',
      icon: '✦',
      tags: 'fiziksel destek',
      search: 'insan kahraman imparator xp uyarlanabilir',
      description: 'Ne çok güçlü ne çok zayıf, tam da bu yüzden en uyarlanabilir ırktır. Evrimleşince tarihin en büyük kahramanlarına ve imparatorlarına dönüşür.',
      stats: { can: 100, mana: 100, guc: 10 },
      evolutions: [
        {
          title: 'İnsan',
          meta: 'Başlangıç formu',
          description: 'Ne çok güçlü ne çok zayıf, tam da bu yüzden en uyarlanabilir ırktır. Evrimleşince tarihin en büyük kahramanlarına ve imparatorlarına dönüşür.',
          passive: 'Güç 10, Can 100, Mana 100, Rejen 1.0/sn, Şans 8, Dayanıklılık 10, Kritik %10, Kritik Hasar %15, Hız 100',
          ability: 'XP kazanımı +%10 | Her stat +1 pasif bonus | Tüm silahları kullanabilir'
        },
        {
          title: 'Kahraman',
          meta: 'İnsan evrimi — Lv.30',
          description: 'Savaşın kıyısında en parlayan insan formu. Omuzlarda epaulet/rozet taşır.',
          passive: 'Güç 14, Can 120, Mana 120, Rejen 1.5/sn, Şans 8, Dayanıklılık 13, Kritik %11, Kritik Hasar %16, Hız 102',
          ability: 'Son nefes (MythicMobs) — %20 HP altında hasar +%30'
        },
        {
          title: 'İmparator',
          meta: 'Kahraman evrimi — Lv.60',
          description: 'İnsan ırkının nihai formu. Kron takar, tüm takıma ilham verir.',
          passive: 'Güç 16, Can 140, Mana 150, Rejen 2.0/sn, Şans 10, Dayanıklılık 15, Kritik %13, Kritik Hasar %18, Hız 104',
          ability: 'Komuta aurası (MythicMobs) — takım hasarı +%10'
        }
      ]
    },
    {
      id: 'irk-dev',
      name: 'DEV',
      shortName: 'dev',
      stages: '2 evrim aşaması',
      icon: '⬛',
      tags: 'fiziksel tank',
      search: 'dev fomorian titan titan knockback dayanıklı',
      description: 'Yeryüzünün en iri ve en dayanıklı ırkı. Yavaş adımları savaş alanını titretir. Bir Titan yaklaşırken duvar gibi durur.',
      stats: { can: 180, mana: 50, guc: 15 },
      evolutions: [
        {
          title: 'Dev',
          meta: 'Başlangıç formu',
          description: 'Yeryüzünün en iri ve en dayanıklı ırkı. Yavaş adımları savaş alanını titretir. Bir Titan yaklaşırken duvar gibi durur.',
          passive: 'Güç 15, Can 180, Mana 50, Rejen 0.5/sn, Şans 5, Dayanıklılık 13, Kritik %15, Kritik Hasar %28, Hız 82',
          ability: 'knockback-resistance yüksek | Blok engelleme +%30'
        },
        {
          title: 'Fomorian',
          meta: 'Dev evrimi — Lv.20',
          description: 'Devlerin savaşçı formu. Omuzlarda kaya parçası taşır, çarpma saldırısıyla zemin sarsar.',
          passive: 'Güç 17, Can 215, Mana 65, Rejen 0.8/sn, Şans 5, Dayanıklılık 16, Kritik %16, Kritik Hasar %30, Hız 81',
          ability: 'Çarpma saldırısı (MythicMobs) — zemin sarsar'
        },
        {
          title: 'Titan',
          meta: 'Fomorian evrimi — Lv.50',
          description: 'Dev ırkının nihai formu. Büyük omuz zırhı taşır, geniş alana yumruk vurur.',
          passive: 'Güç 19, Can 250, Mana 80, Rejen 1.0/sn, Şans 6, Dayanıklılık 19, Kritik %18, Kritik Hasar %35, Hız 82',
          ability: 'Titan yumruğu geniş AoE (MythicMobs)'
        }
      ]
    },
    {
      id: 'irk-cuce',
      name: 'CÜCE',
      shortName: 'cuce',
      stages: '2 evrim aşaması',
      icon: '⛏',
      tags: 'fiziksel tank',
      search: 'cüce duergar urdunnir maden küçük şans dayanıklılık',
      description: 'Kısa boylu (1.5 blok) ama inanılmaz dayanıklı bir ırk. Madencilik onların kanı, taş ise kalkanları. Küçük boyları savunmada avantaj sağlar.',
      stats: { can: 105, mana: 60, guc: 11 },
      evolutions: [
        {
          title: 'Cüce',
          meta: 'Başlangıç formu',
          description: 'Kısa boylu (1.5 blok) ama inanılmaz dayanıklı bir ırk. Madencilik onların kanı, taş ise kalkanları. Küçük boyları savunmada avantaj sağlar.',
          passive: 'Güç 11, Can 105, Mana 60, Rejen 1.0/sn, Şans 20, Dayanıklılık 15, Kritik %8, Kritik Hasar %12, Hız 85',
          ability: 'block-break-speed +%30 | knockback-resistance yüksek | Küçük boy avantajı'
        },
        {
          title: 'Duergar',
          meta: 'Cüce evrimi — Lv.25',
          description: 'Karanlık derinliklerin sertleştirdiği Cüce formu. Koyu zırh ve kızıl gözleriyle tanınır.',
          passive: 'Güç 14, Can 125, Mana 75, Rejen 1.5/sn, Şans 25, Dayanıklılık 19, Kritik %9, Kritik Hasar %13, Hız 87',
          ability: 'Zehir direnci | Çekiç soku AoE (MythicMobs)'
        },
        {
          title: 'Urdunnir',
          meta: 'Duergar evrimi — Lv.55',
          description: 'Cüce ırkının nihai formu. Sırtında run taşı taşır, silahlarına elemental güç katar.',
          passive: 'Güç 15, Can 135, Mana 110, Rejen 2.0/sn, Şans 30, Dayanıklılık 20, Kritik %11, Kritik Hasar %15, Hız 88',
          ability: 'Run silahı elemental efekt (MythicMobs) | Taş derisi pasifi'
        }
      ]
    }
  ];

  const filteredRaces = races.filter(race => {
    const matchesFilter = activeFilter === 'tumu' || race.tags.includes(activeFilter);
    const matchesSearch = !searchQuery || 
      race.search.toLowerCase().includes(searchQuery.toLowerCase()) ||
      race.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const jumpToRace = (raceId: string) => {
    const element = document.getElementById(raceId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="wiki-bg" aria-hidden="true"></div>
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
              <li><Link className="nav__link nav__link--active" href="/wiki" aria-current="page">Wiki</Link></li>
              <li><Link className="nav__link" href="/destek">Destek</Link></li>
              <li><Link className="nav__link" href="/basvuru">Yetkili Başvuru</Link></li>
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

      <main className="wiki-main">
        <section className="wiki-hero" aria-labelledby="wiki-hero-title">
          <div className="container wiki-hero__inner">
            <p className="wiki-badge">Bilgi Bankası</p>
            <h1 id="wiki-hero-title" className="wiki-hero__title">AVERNETH WIKI</h1>
            <p className="wiki-hero__lead">
              Irklar, yetenekler, zindanlar ve ekonomi hakkında güncel bilgiler. Şimdilik ırk rehberi aktif; diğer bölümler yakında.
            </p>
            <div className="wiki-search" role="search">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <label className="visually-hidden" htmlFor="wiki-search">Wiki&apos;de ara</label>
              <input 
                id="wiki-search" 
                type="search" 
                placeholder="Wiki&apos;de ara..." 
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="container">
          <nav className="wiki-cats" aria-label="Wiki kategorileri">
            <button 
              type="button" 
              className={`wiki-cat ${activeFilter === 'tumu' ? 'wiki-cat--active' : ''}`}
              onClick={() => setActiveFilter('tumu')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Irklar
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Sınıflar
              <span className="wiki-cat__soon">Yakında</span>
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Yetenekler
              <span className="wiki-cat__soon">Yakında</span>
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Eşyalar
              <span className="wiki-cat__soon">Yakında</span>
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Zindanlar
              <span className="wiki-cat__soon">Yakında</span>
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Üretim
              <span className="wiki-cat__soon">Yakında</span>
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Görevler
              <span className="wiki-cat__soon">Yakında</span>
            </button>
            <button type="button" className="wiki-cat" disabled aria-disabled="true" title="Yakında">
              Ekonomi
              <span className="wiki-cat__soon">Yakında</span>
            </button>
          </nav>

          <section className="wiki-irk-section" aria-labelledby="irk-baslik">
            <div className="wiki-section-head">
              <div className="wiki-section-head__text">
                <p className="eyebrow">Irk Rehberi</p>
                <h2 id="irk-baslik" className="wiki-section-head__title">AVERNETH IRKLARI</h2>
              </div>
              <div className="wiki-filters" role="group" aria-label="Irk filtresi">
                <button 
                  type="button" 
                  className={`wiki-filter ${activeFilter === 'tumu' ? 'wiki-filter--active' : ''}`}
                  onClick={() => setActiveFilter('tumu')}
                >
                  Tümü
                </button>
                <button 
                  type="button" 
                  className={`wiki-filter ${activeFilter === 'buyu' ? 'wiki-filter--active' : ''}`}
                  onClick={() => setActiveFilter('buyu')}
                >
                  Büyü
                </button>
                <button 
                  type="button" 
                  className={`wiki-filter ${activeFilter === 'fiziksel' ? 'wiki-filter--active' : ''}`}
                  onClick={() => setActiveFilter('fiziksel')}
                >
                  Fiziksel
                </button>
                <button 
                  type="button" 
                  className={`wiki-filter ${activeFilter === 'tank' ? 'wiki-filter--active' : ''}`}
                  onClick={() => setActiveFilter('tank')}
                >
                  Tank
                </button>
                <button 
                  type="button" 
                  className={`wiki-filter ${activeFilter === 'destek' ? 'wiki-filter--active' : ''}`}
                  onClick={() => setActiveFilter('destek')}
                >
                  Destek
                </button>
              </div>
            </div>

            <div className="wiki-race-bar" role="toolbar" aria-label="Hızlı ırk seçimi">
              {races.map(race => (
                <button 
                  key={race.id}
                  type="button" 
                  className={`wiki-race-chip wiki-race-chip--${race.shortName.toLowerCase()}`}
                  onClick={() => jumpToRace(race.id)}
                >
                  <span className="wiki-race-chip__icon" aria-hidden="true">{race.icon}</span>
                  {race.shortName}
                </button>
              ))}
            </div>

            <div className="wiki-race-grid">
              {filteredRaces.map(race => (
                <article
                  key={race.id}
                  className={`race-card race-card--${race.shortName.toLowerCase()}`}
                  id={race.id}
                  data-tags={race.tags}
                  data-search={race.search}
                >
                  <div className="race-card__media">
                    <div className="race-card__media-inner">
                      <div>
                        <h3 className="race-card__name">{race.name}</h3>
                        <p className="race-card__stages">{race.stages}</p>
                      </div>
                      <div className="race-card__corner-icon" aria-hidden="true">{race.icon}</div>
                    </div>
                  </div>
                  <div className="race-card__body">
                    <p className="race-card__desc">{race.description}</p>
                    <div className="race-stats">
                      <div className="race-stat">
                        <svg className="race-stat__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 21s-7-4.35-7-11a4.5 4.5 0 0 1 9-11a4.5 4.5 0 0 1 9 11c0 6.65-7 11-7 11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        <span className="race-stat__val">{race.stats.can}</span>
                        <span className="race-stat__label">Can</span>
                      </div>
                      <div className="race-stat">
                        <svg className="race-stat__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 2.5c-4 6-6 9.5-6 12.5a6 6 0 0 1 12 0c0-3-2-6.5-6-12.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        <span className="race-stat__val">{race.stats.mana}</span>
                        <span className="race-stat__label">Mana</span>
                      </div>
                      <div className="race-stat">
                        <svg className="race-stat__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M4 18h4l2-4M16 6h4l-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="race-stat__val">{race.stats.guc}</span>
                        <span className="race-stat__label">Güç</span>
                      </div>
                    </div>
                    <details>
                      <summary>
                        Tüm detayları gör
                        <span className="chev" aria-hidden="true">▼</span>
                      </summary>
                      <div className="race-card__details-inner">
                        {race.evolutions.map((evo, index) => (
                          <div key={index} className="evo-block">
                            <h4 className="evo-block__title">{evo.title}</h4>
                            <span className="evo-block__meta">{evo.meta}</span>
                            <p>Açıklama: {evo.description}</p>
                            <p className="evo-block__label">Pasif</p>
                            <p className="evo-block__text">{evo.passive}</p>
                            <p className="evo-block__label">Yetenek</p>
                            <p className="evo-block__text">{evo.ability}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__grid">
          <div>
            <h3 className="footer__heading">Wiki</h3>
            <p className="footer__text">
              AVERNETH oyun içi bilgileri özetler; değerler güncellemelere göre değişebilir.
            </p>
            <p className="footer__copy">AVERNETH. © {new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="footer__heading">Bağlantılar</h3>
            <ul className="footer__links">
              <li><Link href="/">Ana Sayfa</Link></li>
              <li><Link href="/wiki">Wiki</Link></li>
              <li><Link href="/destek">Destek</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      <div className="toast" id="toast" role="status" aria-live="polite" hidden></div>
    </>
  );
}
