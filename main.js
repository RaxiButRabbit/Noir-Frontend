// =====================
// SUPABASE CONFIG - SECURE (API key server-side)
// =====================
// Supabase client sadece local session yönetimi için kullanılır.
// SUPABASE_URL backend /config endpoint'inden alınır; anon key ASLA frontend'e gönderilmez.
// Tüm API çağrıları backend proxy (/api, /auth) üzerinden yapılır.
let sb = null;
let _sbReady = null;

// Backend API Proxy — URL config.js'ten gelir (GitHub Pages / local otomatik algilama)
const API_BASE = (window.NOIR_CONFIG && window.NOIR_CONFIG.API_BASE) || '';

async function initSupabase() {
    if (_sbReady) return _sbReady;
    _sbReady = (async () => {
        const res = await fetch(API_BASE + '/config', { credentials: 'include' });
        const cfg = await res.json();
        sb = supabase.createClient(cfg.supabaseUrl, 'public-anon-placeholder', {
            auth: { autoRefreshToken: false, persistSession: true, detectSessionInUrl: true }
        });
        return sb;
    })();
    return _sbReady;
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${API_BASE}/api/${endpoint}`, options);
    return res.json();
}

async function authRequest(action, body) {
    const res = await fetch(`${API_BASE}/auth/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

// =====================
// STATE
// =====================
let currentUser = null
let currentProfile = null
let cart = []

// =====================
// INIT
// =====================
window.addEventListener('load', async () => {
    // Supabase secure init (URL from backend /config)
    try { await initSupabase(); } catch (e) { console.error('Supabase init failed', e); }

    // Theme Init
    const savedTheme = localStorage.getItem('noir-theme') || 'dark';
    setTheme(savedTheme);

    // Language Init
    const savedLang = localStorage.getItem('noir-lang') || 'en';
    setLang(savedLang);
    updateTranslations(savedLang);
    // --- INFINITE DRAGGABLE REVIEWS (CHOOSE & THROW) ---
    const track = document.getElementById('reviewsTrack');
    const container = document.querySelector('.reviews-slider-container');

    if (track && container) {
        let isDragging = false;
        let startX;
        let scrollLeft = 0;
        let velocity = 0;
        let lastX = 0;
        let rafId;

        // Sonsuz döngü için eşik değerler
        const trackWidth = track.scrollWidth;
        const setWidth = trackWidth / 3; // 3 set eklemiştik

        const updatePosition = () => {
            // Sonsuz döngü mantığı: Sınırları aşınca merkeze çek
            if (scrollLeft > 0) scrollLeft = -setWidth;
            if (scrollLeft < -setWidth * 2) scrollLeft = -setWidth;
            
            track.style.transform = `translateX(${scrollLeft}px)`;
        };

        // Başlangıç pozisyonu (orta set)
        scrollLeft = -setWidth;
        updatePosition();

        const startDragging = (e) => {
            isDragging = true;
            startX = (e.pageX || e.touches[0].pageX);
            cancelAnimationFrame(rafId);
            lastX = e.pageX || e.touches[0].pageX;
        };

        const stopDragging = () => {
            if (!isDragging) return;
            isDragging = false;
            
            const throwInertia = () => {
                if (Math.abs(velocity) > 0.1) {
                    scrollLeft += velocity;
                    velocity *= 0.96; // Sürtünme
                    updatePosition();
                    rafId = requestAnimationFrame(throwInertia);
                }
            };
            throwInertia();
        };

        const move = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const pageX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
            
            // Hızı daha hassas ve yumuşak hesapla
            const instantVelocity = (pageX - lastX);
            velocity = velocity * 0.4 + instantVelocity * 0.6; // Low-pass filter for smoothness
            lastX = pageX;
            
            scrollLeft += instantVelocity;
            updatePosition();
        };

        container.addEventListener('mousedown', startDragging);
        container.addEventListener('touchstart', startDragging);
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move);
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
    }

// --- KITTEN MASCOT (ORIGINAL) ---
const setStyles = ({ target, h, w, x, y }) => {
  if (h) target.style.height = h
  if (w) target.style.width = w
  target.style.transform = `translate(${x || 0}, ${y || 0})`
}

const kittenScope = document.querySelector('.kitten-wrapper')
if(kittenScope) {
    const elements = {
      body: kittenScope,
      platypus: {
        wrapper: document.querySelector('.platypus-wrapper'),
        body: document.querySelector('.platypus-body'),
        head: document.querySelector('.head'),
        beak: document.querySelector('.beak'),
        bodyMarker: document.querySelector('.platypus-body-marker'),
        headMarker: document.querySelector('.head-marker'),
        beakMarker: document.querySelector('.beak-marker'),
        tail: document.querySelector('.tail-wrapper'),
        eyes: document.querySelector('.eyes-wrapper'),
        earLeft: document.querySelector('.ear-left'),
        earRight: document.querySelector('.ear-right'),
        legs: document.querySelectorAll('.leg'),
      },
      chatContainer: document.querySelector('.kitten-chat-container'),
      marker: document.querySelectorAll('.marker'),
    }

    const positionMarker = (i, pos) => {
      elements.marker[i].style.left = px(pos.x)
      elements.marker[i].style.top = px(pos.y)
    }

    const px = num => `${num}px`
    const radToDeg = rad => Math.round(rad * (180 / Math.PI))

    const setAngle = ({ target, angle }) => {
      target.style.transform = `rotate(${angle}deg)`
    }

    const getTargetAngle = () => {
      const { x, y } = getPlatypusBeakPos()
      return angle = radToDeg(Math.atan2(y - control.y, x - control.x)) - 90
    }

    const control = {
      x: null,
      y: null,
      platypusTimer: null,
    }

    const getValueWithinBound = ({ value, min, max, buffer }) => {
      return value = value < (min - buffer)
        ? min - buffer
        : value > (max + buffer)
        ? max + buffer
        : value
    }

    const setStyles = ({ target, h, w, x, y }) => {
      if (h) target.style.height = h
      if (w) target.style.width = w
      
      // Gözlerin pozisyonu bozulmasın diye scale işlemini değişkenden okuyoruz
      let scaleStr = '';
      if (target.classList.contains('eyes')) {
          scaleStr = ' var(--eye-transform, scaleY(1.8))';
      }
      
      target.style.transform = `translate(${x || 0}, ${y || 0})${scaleStr}`
    }

    const moveWithinBound = ({ target, boundary, pos, buffer }) => {
      const { left: hX, top: hY, width, height } = boundary.getBoundingClientRect()

      setStyles({
        target,
        x: px(getValueWithinBound({
          value: pos.x - (target.clientWidth / 2),
          min: hX,
          max: hX + width - target.clientWidth,
          buffer: buffer.x
        }) - hX),
        y: px(getValueWithinBound({
          value: pos.y - (target.clientHeight / 2),
          min: hY,
          max: hY + height - target.clientHeight,
          buffer: buffer.y
        }) - hY),
      })
    }

    const movePlatypus = pos => {
      control.x = pos.x
      control.y = pos.y
      positionMarker(0, control)

      const { body, bodyMarker, wrapper, head, headMarker, beak, beakMarker, eyes, tail, earLeft, earRight } = elements.platypus

      ;[
        { target: body, boundary: wrapper },
        { target: bodyMarker, boundary: wrapper },
        { target: head, boundary: body },
        { target: headMarker, boundary: bodyMarker },
        { target: beak, boundary: head, buffer: { x: 5, y: 3 } },
        { target: beakMarker, boundary: headMarker, buffer: { x: 5, y: 3 } },
        { target: eyes.childNodes[1], boundary: eyes, buffer: { x: 5, y: 3 } }
      ].forEach(item => {
        if(item.target) {
            moveWithinBound({
              target: item.target,
              boundary: item.boundary,
              pos: control,
              buffer: item.buffer || { x: 15, y: 15 }
            })
        }
      })

      setAngle({
        target: tail,
        angle: getTargetAngle() - 180
      })

      // Ear rotation based on cursor X position
      const screenCenterX = elements.body.offsetWidth / 2
      const screenCenterY = elements.body.offsetHeight / 2
      const t = Math.max(-1, Math.min(1, (control.x - screenCenterX) / screenCenterX))
      const tY = Math.max(-1, Math.min(1, (control.y - screenCenterY) / screenCenterY))
      const earUp = tY * -4
      earRight.style.transform = `translateY(${earUp}px) rotate(${t * 35}deg)`
      earLeft.style.transform = `translateY(${earUp}px) rotate(${t * 18}deg)`
    }

    const getPlatypusBeakPos = () => {
      const { x, y, width, height } = elements.platypus.beakMarker.getBoundingClientRect()
      return {
        x: x + (width / 2),
        y: y + (height / 2)
      }
    }

    const callPlatypusTowardsClick = (e) => {
      const { x, y } = elements.platypus.wrapper.getBoundingClientRect()
      const newX = control.x + (x - getPlatypusBeakPos().x)
      const newY = control.y + (y - getPlatypusBeakPos().y)

      positionMarker(1, {
        x: newX,
        y: newY
      })
      setStyles({
        target: elements.platypus.wrapper,
        x: px(newX),
        y: px(newY)
      })
      
      setTimeout(() => movePlatypus(control), 50);

      elements.platypus.legs.forEach(leg => {
        leg.classList.add('swim')
      })
      setTimeout(() => {
        elements.platypus.legs.forEach(leg => {
          leg.classList.remove('swim')
        })
      }, 3000)
    }

    const positionPlatypus = () => {
      clearTimeout(control.platypusTimer)
      const { offsetWidth, offsetHeight } = elements.body
      control.x = offsetWidth / 2
      control.y = (offsetHeight / 2) - elements.platypus.wrapper.clientHeight

      callPlatypusTowardsClick()
      movePlatypus({
        x: control.x + 10,
        y: control.y + 100
      })
      control.platypusTimer = setTimeout(() => {
        movePlatypus({
          x: control.x,
          y: control.y + 80
        })
      }, 2000)
    }

    window.addEventListener('mousemove', e => {
      movePlatypus({
        x: e.clientX,
        y: e.clientY
      })
    })
    
    window.addEventListener('click', (e) => {
      control.x = e.clientX
      control.y = e.clientY
      callPlatypusTowardsClick(e)
    })
    
    window.addEventListener('resize', positionPlatypus)

    positionPlatypus()

    // --- CHAT BUBBLE LOGIC ---
    const getFunNotes = () => {
        const lang = localStorage.getItem('noir-lang') || 'en';
        const dict = translations[lang] || translations.en;
        return [
            dict.fun_note_1, dict.fun_note_2, dict.fun_note_3, dict.fun_note_4,
            dict.fun_note_5, dict.fun_note_6, dict.fun_note_7, dict.fun_note_8,
            dict.fun_note_9, dict.fun_note_10
        ];
    };

    const bubble = kittenScope.querySelector('.kitten-bubble');
    const indicator = kittenScope.querySelector('.typing-indicator');
    const bubbleText = kittenScope.querySelector('.bubble-text');
    let isSpeaking = false;

    const speak = () => {
        if (isSpeaking || !bubble || !indicator) return;
        isSpeaking = true;

        // 1. Önce noktaları göster
        bubble.classList.remove('show');
        indicator.classList.add('show');
        bubbleText.textContent = ''; 

        // 1.5 saniye sonra noktaları kapatıp balonu aç
        setTimeout(() => {
            indicator.classList.remove('show');
            
            // Noktalar kapandıktan kısa bir süre sonra balonu aç
            setTimeout(() => {
                bubble.classList.add('show');
                
                const notes = getFunNotes();
                const randomNote = notes[Math.floor(Math.random() * notes.length)];
                let i = 0;
                
                const typeWriter = setInterval(() => {
                    bubbleText.textContent += randomNote.charAt(i);
                    i++;
                    if (i >= randomNote.length) {
                        clearInterval(typeWriter);
                        setTimeout(() => {
                            bubble.classList.remove('show');
                            setTimeout(() => { isSpeaking = false; }, 1000);
                        }, 5000);
                    }
                }, 40);
            }, 300);
            
        }, 1500);
    };

    // Her 10 ila 25 saniye arasında rastgele konuşma ihtimali
    setInterval(() => {
        if (Math.random() > 0.4) speak();
    }, Math.random() * 15000 + 10000);

    // Kediye tıklanınca da mırıldansın
    kittenScope.querySelector('.platypus-wrapper').addEventListener('click', () => {
        if (!isSpeaking) speak();
    });

    // --- SMOOTH FOLLOW LOOP ---
    const updateBubbleLoop = () => {
        if (elements.chatContainer && elements.platypus.head) {
            const headRect = elements.platypus.head.getBoundingClientRect();
            const headX = headRect.left + headRect.width / 2;
            const headY = headRect.top;
            
            const screenRatioX = headX / window.innerWidth;
            const dynamicOffset = (screenRatioX - 0.5) * -60; 
            
            elements.chatContainer.style.transform = `translate(calc(-50% + ${dynamicOffset}px), -100%)`;
            elements.chatContainer.style.left = px(headX);
            elements.chatContainer.style.top = px(headY);
        }
        requestAnimationFrame(updateBubbleLoop);
    };
    updateBubbleLoop();
}

// Initial Calls
feather.replace();    initCursorAndTilt()
    initCanvasStarfield()
    initHeaderButtons()
    initGlowEffects()
    initTypewriter()
    checkSession()
    initASCIIRipple()
})

// --- ASCII RIPPLE LOGIC (from Erevan) ---
const WAVE_THRESH = 3;
const CHAR_MULT = 3;
const ANIM_STEP = 40;
const WAVE_BUF = 5;

const createASCIIShift = (el, opts = {}) => {
  let origTxt = el.textContent;
  let origChars = origTxt.split("");
  let isAnim = false;
  let cursorPos = 0;
  let waves = [];
  let animId = null;
  let isHover = false;
  let origW = null;

  const cfg = {
    dur: 1000,
    chars: '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@0123456789*',
    preserveSpaces: true,
    spread: 1,
    ...opts
  };

  const updateCursorPos = (e) => {
    // Precise character detection for multi-line text
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range && (range.startContainer === el || range.startContainer.parentNode === el)) {
        cursorPos = range.startOffset;
        return;
      }
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos && (pos.offsetNode === el || pos.offsetNode.parentNode === el)) {
        cursorPos = pos.offset;
        return;
      }
    }
    
    // Fallback for single-line or unsupported browsers
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const len = origTxt.length;
    const pos = Math.round((x / rect.width) * len);
    cursorPos = Math.max(0, Math.min(pos, len - 1));
  };

  const startWave = () => {
    waves.push({
      startPos: cursorPos,
      startTime: Date.now(),
      id: Math.random()
    });
    if (!isAnim) start();
  };

  const cleanupWaves = (t) => {
    waves = waves.filter((w) => t - w.startTime < cfg.dur);
  };

  const calcWaveEffect = (charIdx, t) => {
    let shouldAnim = false;
    let resultChar = origChars[charIdx];
    for (const w of waves) {
      const age = t - w.startTime;
      const prog = Math.min(age / cfg.dur, 1);
      const dist = Math.abs(charIdx - w.startPos);
      const maxDist = Math.max(w.startPos, origChars.length - w.startPos - 1);
      const rad = (prog * (maxDist + WAVE_BUF)) / cfg.spread;
      if (dist <= rad) {
        shouldAnim = true;
        const intens = Math.max(0, rad - dist);
        if (intens <= WAVE_THRESH && intens > 0) {
          const charIdx = (dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) % cfg.chars.length;
          resultChar = cfg.chars[charIdx];
        }
      }
    }
    return { shouldAnim, char: resultChar };
  };

  const genScrambledTxt = (t) =>
    origChars.map((char, i) => {
        if (cfg.preserveSpaces && char === " ") return " ";
        const res = calcWaveEffect(i, t);
        return res.shouldAnim ? res.char : char;
    }).join("");

  const stop = () => {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    el.textContent = origTxt;
    el.classList.remove("as");
    if (origW !== null) { el.style.width = ""; origW = null; }
    isAnim = false;
  };

  const start = () => {
    if (isAnim) return;
    if (origW === null) {
      origW = el.getBoundingClientRect().width;
      el.style.width = `${origW}px`;
    }
    isAnim = true;
    el.classList.add("as");
    const animate = () => {
      const t = Date.now();
      cleanupWaves(t);
      if (waves.length === 0) { stop(); return; }
      el.textContent = genScrambledTxt(t);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
  };

  const handleEnter = (e) => { isHover = true; updateCursorPos(e); startWave(); };
  const handleMove = (e) => { if (!isHover) return; const old = cursorPos; updateCursorPos(e); if (cursorPos !== old) startWave(); };
  const handleLeave = () => { isHover = false; };

  el.addEventListener("mouseenter", handleEnter);
  el.addEventListener("mousemove", handleMove);
  el.addEventListener("mouseleave", handleLeave);
};

function initASCIIRipple() {
    const targets = document.querySelectorAll('.hero-sub-desc, .footer-brand p, .section-title, nav ul li a');
    targets.forEach(t => createASCIIShift(t));
}

// =====================
// AUTH — Session
// =====================
async function checkSession() {
    await initSupabase();
    const { data: { session } } = await sb.auth.getSession()
    if (session) {
        currentUser = session.user
        await loadProfile()
        updateUIForUser()
    }

    sb.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user ?? null
        if (currentUser) {
            await loadProfile()
        } else {
            currentProfile = null
        }
        updateUIForUser()
    })
}

// =====================
// SETTINGS — Theme & Lang
// =====================
const translations = {
    en: {
        nav_home: "Home",
        nav_scripts: "Scripts",
        nav_clothes: "Clothes",
        nav_private: "Private",
        hero_line_1: "THE <span class=\"accent-text\">NOIR</span>",
        hero_line_2: "EXPERIENCE",
        scroll_down: "Scroll Down",
        reviews_title: "COMMUNITY VOICES",
        reviews_subtitle: "Grab and throw to explore what they say.",
        scripts_title: "SCRIPTS",
        scripts_subtitle: "Premium, optimized resources for elite servers.",
        footer_desc: "Elevating FiveM experiences with premium resources and elite designs.",
        hero_desc_new: "Redefining the standards of premium FiveM scripts with elite craftsmanship and unrivaled performance.",
        fun_note_1: "Looking for perfect optimization? You're in the right place.",
        fun_note_2: "Take your server to the next level with Noir Store.",
        fun_note_3: "Our code quality is our signature. *purr*",
        fun_note_4: "Don't forget to join our Discord for more exclusive content.",
        fun_note_5: "Designed for the elite roleplay experience.",
        fun_note_6: "Every script is a work of art. Almost as stylish as me!",
        fun_note_7: "Only the best use Noir.",
        fun_note_8: "That sparkle in your eyes... Is it Noir or just me?",
        fun_note_9: "Premium scripts, exclusive clothes... All at Noir.",
        fun_note_10: "Which legendary content will you discover today?",
        cat_system: "System",
        cat_economy: "Economy",
        cat_illegal: "Illegal",
        cat_streetwear: "Streetwear",
        cat_luxury: "Luxury",
        cat_police: "Police",
        cat_exclusive: "Exclusive",
        card1_title: "Advanced Banking",
        card1_desc: "A complete banking overhaul with credit cards, loans, and shared accounts.",
        card2_title: "Noir Housing",
        card2_desc: "Fully dynamic housing system with furniture placement and real-estate agent tools.",
        card3_title: "Drug Empires",
        card3_desc: "Expansion pack for criminal organizations featuring labs and territories.",
        card4_title: "Noir Summer Pack",
        card4_desc: "15+ custom streetwear items for both male and female characters.",
        card5_title: "Suit & Tie Collection",
        card5_desc: "Elegant formal wear collection with 4k textures and custom models.",
        card6_title: "LSPD Uniform Pack",
        card6_desc: "Complete replacement for LSPD uniforms with tactical gear and badges.",
        card7_title: "Noir Platinum Access",
        card7_desc: "Lifetime access to all future releases and private beta testing channel.",
        rev1_text: "\"Insane optimization!\"",
        rev1_name: "Alex Rivera",
        rev2_text: "\"Crisp textures, 10/10.\"",
        rev2_name: "Jordan S.",
        rev3_text: "\"Professional support.\"",
        rev3_name: "Marcus V.",
        rev4_text: "\"Best scripts ever.\"",
        rev4_name: "Derya K."
    },
    tr: {
        nav_home: "Anasayfa",
        nav_scripts: "Scriptler",
        nav_clothes: "Kıyafetler",
        nav_private: "Özel",
        hero_line_1: "THE <span class=\"accent-text\">NOIR</span>",
        hero_line_2: "DENEYİMİ",
        scroll_down: "Aşağı Kaydır",
        reviews_title: "TOPLULUK SESLERİ",
        reviews_subtitle: "Neler söylediklerini keşfetmek için sürükleyin.",
        scripts_title: "SCRİPTLER",
        scripts_subtitle: "Seçkin sunucular için optimize edilmiş premium kaynaklar.",
        footer_desc: "Premium kaynaklar ve elit tasarımlarla FiveM deneyimini zirveye taşıyoruz.",
        hero_desc_new: "Üstün işçilik ve rakipsiz performansla premium FiveM script standartlarını yeniden tanımlıyoruz.",
        fun_note_1: "Mükemmel optimizasyon mu arıyorsun? Doğru yerdesin.",
        fun_note_2: "Noir Store ile sunucunu bir üst seviyeye taşı.",
        fun_note_3: "Kod kalitemiz, bizim imzamızdır. *purr*",
        fun_note_4: "Daha fazla özel içerik için Discord adresimize gelmeyi unutma.",
        fun_note_5: "Elite roleplay deneyimi için tasarlandı.",
        fun_note_6: "Her script, bir sanat eseridir. En az benim kadar şık!",
        fun_note_7: "Sadece en iyiler Noir kullanır.",
        fun_note_8: "Gözlerindeki bu parıltı... Noir'dan mı yoksa benden mi?",
        fun_note_9: "Premium scriptler, özel kıyafetler... Hepsi Noir'da.",
        fun_note_10: "Bugün hangi efsanevi içeriği keşfedeceksin?",
        cat_system: "Sistem",
        cat_economy: "Ekonomi",
        cat_illegal: "İllegal",
        cat_streetwear: "Sokak Giyim",
        cat_luxury: "Lüks",
        cat_police: "Polis",
        cat_exclusive: "Özel",
        card1_title: "Gelişmiş Bankacılık",
        card1_desc: "Kredi kartları, krediler ve ortak hesaplarla eksiksiz bir bankacılık sistemi.",
        card2_title: "Noir Ev Sistemi",
        card2_desc: "Mobilya yerleştirme ve emlakçı araçlarıyla tamamen dinamik konut sistemi.",
        card3_title: "Uyuşturucu İmparatorlukları",
        card3_desc: "Laboratuvarlar ve bölgeler içeren suç örgütleri için genişleme paketi.",
        card4_title: "Noir Yaz Paketi",
        card4_desc: "Hem erkek hem de kadın karakterler için 15+ özel sokak giyim ürünü.",
        card5_title: "Takım Elbise Koleksiyonu",
        card5_desc: "4k dokular ve özel modellerle zarif resmi giyim koleksiyonu.",
        card6_title: "LSPD Üniforma Paketi",
        card6_desc: "Taktik teçhizat ve rozetlerle LSPD üniformaları için eksiksiz değişim paketi.",
        card7_title: "Noir Platinum Erişim",
        card7_desc: "Tüm gelecek sürümlere ömür boyu erişim ve özel beta test kanalı.",
        rev1_text: "\"İnanılmaz optimizasyon!\"",
        rev1_name: "Alex Rivera",
        rev2_text: "\"Kusursuz dokular, 10/10.\"",
        rev2_name: "Jordan S.",
        rev3_text: "\"Profesyonel destek.\"",
        rev3_name: "Marcus V.",
        rev4_text: "\"Şimdiye kadarki en iyi scriptler.\"",
        rev4_name: "Derya K."
    },
    es: {
        nav_home: "Inicio",
        nav_scripts: "Guiones",
        nav_clothes: "Ropa",
        nav_private: "Privado",
        hero_line_1: "LA EXPERIENCIA",
        hero_line_2: "<span class=\"accent-text\">NOIR</span>",
        fun_note_1: "¿Buscas la optimización perfecta? Estás en el lugar correcto.",
        fun_note_2: "Lleva tu servidor al siguiente nivel con Noir Store.",
        fun_note_3: "Nuestra calidad de código es nuestra firma. *purr*",
        fun_note_4: "No olvides unirte a nuestro Discord para más contenido exclusivo.",
        fun_note_5: "Diseñado para la experiencia de rol de élite.",
        fun_note_6: "Cada guion es una obra de arte. ¡Casi tan elegante como yo!",
        fun_note_7: "Solo los mejores usan Noir.",
        fun_note_8: "Ese brillo en tus ojos... ¿Es Noir o solo yo?",
        fun_note_9: "Guiones premium, ropa exclusiva... Todo en Noir.",
        fun_note_10: "¿Qué contenido legendario descubrirás hoy?",
        scroll_down: "Desplazarse",
        reviews_title: "VOCES DE LA COMUNIDAD",
        reviews_subtitle: "Agarrar y lanzar para explorar.",
        scripts_title: "GUIONES",
        scripts_subtitle: "Recursos premium optimizados para servidores de élite.",
        footer_desc: "Elevando experiencias FiveM con recursos premium y diseños de élite.",
        hero_desc_new: "Redefiniendo los estándares de los guiones premium de FiveM con artesanía de élite.",
        cat_system: "Sistema",
        cat_economy: "Economía",
        cat_illegal: "Ilegal",
        cat_streetwear: "Ropa Urbana",
        cat_luxury: "Lujo",
        cat_police: "Policía",
        cat_exclusive: "Exclusivo",
        card1_title: "Banca Avanzada",
        card1_desc: "Sistema bancario completo con tarjetas de crédito, préstamos y cuentas compartidas.",
        card2_title: "Vivienda Noir",
        card2_desc: "Sistema de vivienda dinámico con colocación de muebles y herramientas inmobiliarias.",
        card3_title: "Imperios de Drogas",
        card3_desc: "Pack de expansión para organizaciones criminales con laboratorios y territorios.",
        card4_title: "Pack de Verano Noir",
        card4_desc: "Más de 15 artículos de ropa urbana exclusivos para personajes masculinos y femeninos.",
        card5_title: "Colección de Trajes",
        card5_desc: "Colección elegante de ropa formal con texturas 4k y modelos personalizados.",
        card6_title: "Pack de Uniformes LSPD",
        card6_desc: "Reemplazo completo de uniformes LSPD con equipo táctico e insignias.",
        card7_title: "Acceso Platinum Noir",
        card7_desc: "Acceso de por vida a todos los lanzamientos futuros y canal de pruebas beta.",
        rev1_text: "¡Optimización increíble!",
        rev1_name: "Alex Rivera",
        rev2_text: "Texturas nítidas, 10/10.",
        rev2_name: "Jordan S.",
        rev3_text: "Soporte profesional.",
        rev3_name: "Marcus V.",
        rev4_text: "Los mejores guiones.",
        rev4_name: "Derya K."
    },
    pt: {
        nav_home: "Início",
        nav_scripts: "Scripts",
        nav_clothes: "Roupas",
        nav_private: "Privado",
        hero_line_1: "A EXPERIÊNCIA",
        hero_line_2: "<span class=\"accent-text\">NOIR</span>",
        fun_note_1: "Procurando a otimização perfeita? Você está no lugar certo.",
        fun_note_2: "Leve seu servidor para o próximo nível com a Noir Store.",
        fun_note_3: "Nossa qualidade de código é nossa assinatura. *purr*",
        fun_note_4: "Não se esqueça de se juntar ao nosso Discord para mais conteúdo exclusivo.",
        fun_note_5: "Projetado para a experiência de roleplay de elite.",
        fun_note_6: "Cada script é uma obra de arte. Quase tão elegante quanto eu!",
        fun_note_7: "Apenas os melhores usam Noir.",
        fun_note_8: "Aquele brilho nos seus olhos... É Noir ou apenas eu?",
        fun_note_9: "Scripts premium, roupas exclusivas... Tudo na Noir.",
        fun_note_10: "Que conteúdo lendário você descobrirá hoje?",
        scroll_down: "Rolar para baixo",
        reviews_title: "VOZES DA COMUNIDADE",
        reviews_subtitle: "Agarre e jogue para explorar.",
        scripts_title: "SCRIPTS",
        scripts_subtitle: "Recursos premium otimizados para servidores de elite.",
        footer_desc: "Elevando experiências FiveM com recursos premium e designs de elite.",
        hero_desc_new: "Redefinindo os padrões de scripts premium FiveM com artesanato de elite.",
        cat_system: "Sistema",
        cat_economy: "Economia",
        cat_illegal: "Ilegal",
        cat_streetwear: "Roupa Urbana",
        cat_luxury: "Luxo",
        cat_police: "Polícia",
        cat_exclusive: "Exclusivo",
        card1_title: "Banco Avançado",
        card1_desc: "Sistema bancário completo com cartões de crédito, empréstimos e contas conjuntas.",
        card2_title: "Habitação Noir",
        card2_desc: "Sistema de habitação dinâmico com colocação de móveis e ferramentas imobiliárias.",
        card3_title: "Impérios de Drogas",
        card3_desc: "Pacote de expansão para organizações criminosas com laboratórios e territórios.",
        card4_title: "Pack de Verão Noir",
        card4_desc: "Mais de 15 itens de roupa urbana para personagens masculinos e femininos.",
        card5_title: "Coleção de Ternos",
        card5_desc: "Coleção de roupas formais elegantes com texturas 4k e modelos personalizados.",
        card6_title: "Pack de Uniformes LSPD",
        card6_desc: "Substituição completa de uniformes LSPD com equipamento táctico e distintivos.",
        card7_title: "Acesso Platinum Noir",
        card7_desc: "Acesso vitalício a todos os lançamentos futuros e canal de teste beta.",
        rev1_text: "Otimização insana!",
        rev1_name: "Alex Rivera",
        rev2_text: "Texturas nítidas, 10/10.",
        rev2_name: "Jordan S.",
        rev3_text: "Suporte profissional.",
        rev3_name: "Marcus V.",
        rev4_text: "Melhores scripts de todos.",
        rev4_name: "Derya K."
    },
    fr: {
        nav_home: "Accueil",
        nav_scripts: "Scripts",
        nav_clothes: "Vêtements",
        nav_private: "Privé",
        hero_line_1: "L'EXPÉRIENCE",
        hero_line_2: "<span class=\"accent-text\">NOIR</span>",
        fun_note_1: "Vous cherchez l'optimisation parfaite ? Vous êtes au bon endroit.",
        fun_note_2: "Faites passer votre serveur au niveau supérieur avec Noir Store.",
        fun_note_3: "Notre qualité de code est notre signature. *purr*",
        fun_note_4: "N'oubliez pas de rejoindre notre Discord pour plus de contenu exclusif.",
        fun_note_5: "Conçu pour l'expérience de roleplay d'élite.",
        fun_note_6: "Chaque script est une œuvre d'art. Presque aussi élégant que moi !",
        fun_note_7: "Seuls les meilleurs utilisent Noir.",
        fun_note_8: "Cet éclat dans vos yeux... Est-ce Noir ou juste moi ?",
        fun_note_9: "Scripts premium, vêtements exclusifs... Tout chez Noir.",
        fun_note_10: "Quel contenu légendaire découvrirez-vous aujourd'hui ?",
        scroll_down: "Défiler vers le bas",
        reviews_title: "VOIX DE LA COMMUNAUTÉ",
        reviews_subtitle: "Saisissez et lancez pour explorer.",
        scripts_title: "SCRIPTS",
        scripts_subtitle: "Ressources premium optimisées pour les serveurs d'élite.",
        footer_desc: "Élever les expériences FiveM avec des ressources premium et des designs d'élite.",
        hero_desc_new: "Redéfinir les standards des scripts FiveM premium avec un savoir-faire d'élite.",
        cat_system: "Système",
        cat_economy: "Économie",
        cat_illegal: "Illégal",
        cat_streetwear: "Mode Urbaine",
        cat_luxury: "Luxe",
        cat_police: "Police",
        cat_exclusive: "Exclusif",
        card1_title: "Banque Avancée",
        card1_desc: "Révision complète du système bancaire avec cartes de crédit, prêts et comptes partagés.",
        card2_title: "Logement Noir",
        card2_desc: "Système de logement dynamique avec placement de meubles et outils d'agent immobilier.",
        card3_title: "Empires de la Drogue",
        card3_desc: "Pack d'extension pour les organisations criminelles avec laboratoires et territoires.",
        card4_title: "Pack d'Été Noir",
        card4_desc: "Plus de 15 articles de mode urbaine pour personnages masculins et féminins.",
        card5_title: "Collection Costumes",
        card5_desc: "Collection élégante de vêtements formels avec textures 4k et modèles personnalisés.",
        card6_title: "Pack d'Uniformes LSPD",
        card6_desc: "Remplacement complet des uniformes LSPD avec équipement tactique et badges.",
        card7_title: "Accès Platinum Noir",
        card7_desc: "Accès à vie à toutes les futures versions et canal de test bêta privé.",
        rev1_text: "Optimisation incroyable !",
        rev1_name: "Alex Rivera",
        rev2_text: "Textures nettes, 10/10.",
        rev2_name: "Jordan S.",
        rev3_text: "Support professionnel.",
        rev3_name: "Marcus V.",
        rev4_text: "Meilleurs scripts.",
        rev4_name: "Derya K."
    },
    de: {
        nav_home: "Startseite",
        nav_scripts: "Skripte",
        nav_clothes: "Kleidung",
        nav_private: "Privat",
        hero_line_1: "DAS <span class=\"accent-text\">NOIR</span>",
        hero_line_2: "ERLEBNIS",
        fun_note_1: "Auf der Suche nach perfekter Optimierung? Hier bist du richtig.",
        fun_note_2: "Bringe deinen Server mit Noir Store auf das nächste Level.",
        fun_note_3: "Unsere Code-Qualität ist unsere Unterschrift. *purr*",
        fun_note_4: "Vergiss nicht, unserem Discord beizutreten für exklusive Inhalte.",
        fun_note_5: "Entwickelt für das Elite-Roleplay-Erlebnis.",
        fun_note_6: "Jedes Skript ist ein Kunstwerk. Fast so schık wie ich!",
        fun_note_7: "Nur die Besten nutzen Noir.",
        fun_note_8: "Dieses Funkeln in deinen Augen... Ist es Noir oder nur ich?",
        fun_note_9: "Premium-Skripte, exklusive Kleidung... Alles bei Noir.",
        fun_note_10: "Welchen legendären Inhalt wirst du heute entdecken?",
        scroll_down: "Scrollen",
        reviews_title: "STIMMEN DER COMMUNITY",
        reviews_subtitle: "Greifen und werfen, um zu erkunden.",
        scripts_title: "SKRIPTE",
        scripts_subtitle: "Premium-optimierte Ressourcen für Elite-Server.",
        footer_desc: "FiveM-Erlebnisse mit Premium-Ressourcen und Elite-Designs verbessern.",
        hero_desc_new: "Neudefinition der Standards für Premium-FiveM-Skripte mit Elite-Handwerkskunst.",
        cat_system: "System",
        cat_economy: "Wirtschaft",
        cat_illegal: "Illegal",
        cat_streetwear: "Streetwear",
        cat_luxury: "Luxus",
        cat_police: "Polizei",
        cat_exclusive: "Exklusiv",
        card1_title: "Erweitertes Banking",
        card1_desc: "Komplette Überarbeitung des Bankings mit Kreditkarten, Krediten und Gemeinschaftskonten.",
        card2_title: "Noir Wohnsystem",
        card2_desc: "Dynamisches Wohnsystem mit Möbelplatzierung und Immobilienmakler-Tools.",
        card3_title: "Drogenimperien",
        card3_desc: "Erweiterungspaket für kriminelle Organisationen mit Laboren und Territorien.",
        card4_title: "Noir Sommerpaket",
        card4_desc: "Über 15 exklusive Streetwear-Artikel für männliche und weibliche Charaktere.",
        card5_title: "Anzug-Kollektion",
        card5_desc: "Elegante formelle Kleidungskollektion mit 4k-Texturen und individuellen Modellen.",
        card6_title: "LSPD Uniformpaket",
        card6_desc: "Kompletter Ersatz für LSPD-Uniformen mit taktischer Ausrüstung und Dienstmarken.",
        card7_title: "Noir Platin Zugang",
        card7_desc: "Lebenslanger Zugriff auf alle zukünftigen Versionen und privaten Beta-Testkanal.",
        rev1_text: "Wahnsinnige Optimierung!",
        rev1_name: "Alex Rivera",
        rev2_text: "Gestochen scharfe Texturen, 10/10.",
        rev2_name: "Jordan S.",
        rev3_text: "Professioneller Support.",
        rev3_name: "Marcus V.",
        rev4_text: "Beste Skripte aller Zeiten.",
        rev4_name: "Derya K."
    }
};

window.setTheme = (theme) => {
    document.body.classList.remove('theme-light', 'theme-blue');
    if (theme !== 'dark') document.body.classList.add(`theme-${theme}`);
    
    // Update UI buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(theme));
    });
    
    localStorage.setItem('noir-theme', theme);
}

window.setLang = (lang) => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(lang));
    });
    localStorage.setItem('noir-lang', lang);
    updateTranslations(lang);
}

function updateTranslations(lang) {
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });
}

// =====================
// AUTH — Login (Secure Proxy)
// =====================
window.handleLogin = async (e) => {
    e.preventDefault()
    const email = document.getElementById('loginEmail').value.trim()
    const pass = document.getElementById('loginPassword').value
    const errEl = document.getElementById('loginError')
    errEl.textContent = ''
    errEl.style.color = '#ff6b6b'

    const data = await authRequest('token?grant_type=password', { email, password: pass })
    if (data.error) { errEl.textContent = data.error_description || data.error; return }

    // Set session in client
    await sb.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
    });

    closeModal('authModal')
}

// =====================
// AUTH — Register (Secure Proxy)
// =====================
window.handleRegister = async (e) => {
    e.preventDefault()
    const first = document.getElementById('regFirst').value.trim()
    const last = document.getElementById('regLast').value.trim()
    const email = document.getElementById('regEmail').value.trim()
    const pass = document.getElementById('regPassword').value
    const errEl = document.getElementById('registerError')
    errEl.textContent = ''
    errEl.style.color = '#ff6b6b'

    const data = await authRequest('signup', { email, password: pass })
    if (data.error) { errEl.textContent = data.error_description || data.error; return }

    if (data.user) {
        // Update profile via backend proxy
        const session = await sb.auth.getSession();
        await apiRequest('profiles?id=eq.' + data.user.id, 'PATCH', 
            { first_name: first, last_name: last },
            session.data?.session?.access_token
        );
    }

    errEl.style.color = '#4eff91'
    errEl.textContent = 'Check your email to confirm your account!'
}

// =====================
// AUTH — Social OAuth
// =====================
window.socialLogin = async (provider) => {
    await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.href }
    })
}

// =====================
// AUTH — Logout
// =====================
window.handleLogout = async () => {
    await sb.auth.signOut()
    closeModal('profileModal')
}

// =====================
// PROFILE (Secure Proxy)
// =====================
async function loadProfile() {
    if (!currentUser) return
    const session = await sb.auth.getSession();
    const data = await apiRequest('profiles?id=eq.' + currentUser.id, 'GET', null, session.data?.session?.access_token);
    currentProfile = Array.isArray(data) ? data[0] : data;
}

window.updateProfile = async (e) => {
    e.preventDefault()
    if (!currentUser) return
    const first = document.getElementById('editFirst').value.trim()
    const last = document.getElementById('editLast').value.trim()
    const errEl = document.getElementById('profileError')

    const session = await sb.auth.getSession();
    const data = await apiRequest('profiles?id=eq.' + currentUser.id, 'PATCH',
        { first_name: first, last_name: last },
        session.data?.session?.access_token
    );
    if (data.error) { errEl.style.color = '#ff6b6b'; errEl.textContent = data.error.message || data.error; return }

    currentProfile = { ...currentProfile, first_name: first, last_name: last }
    updateUIForUser()
    errEl.style.color = '#4eff91'
    errEl.textContent = 'Profile updated!'
    setTimeout(() => errEl.textContent = '', 2500)
}

function getAvatarUrl() {
    return currentUser?.user_metadata?.avatar_url ||
           currentUser?.user_metadata?.picture ||
           null
}

function refreshProfileModal() {
    if (!currentProfile && !currentUser) return
    const full = `${currentProfile?.first_name || ''} ${currentProfile?.last_name || ''}`.trim() || 'Noir User'
    const initials = ((currentProfile?.first_name?.[0] || '') + (currentProfile?.last_name?.[0] || '')).toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'N'
    document.getElementById('profileName').textContent = full
    document.getElementById('profileEmail').textContent = currentUser?.email || ''

    const avatarEl = document.getElementById('profileAvatar')
    const avatarUrl = getAvatarUrl()
    if (avatarUrl) {
        avatarEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    } else {
        avatarEl.textContent = initials
    }

    document.getElementById('editFirst').value = currentProfile?.first_name || ''
    document.getElementById('editLast').value = currentProfile?.last_name || ''
}

// =====================
// WALLET (Secure Proxy)
// =====================
window.addFunds = async (amount) => {
    if (!currentUser || !currentProfile) return
    const newBalance = (currentProfile.balance || 0) + amount
    const session = await sb.auth.getSession();
    const token = session.data?.session?.access_token;

    const updateRes = await apiRequest('profiles?id=eq.' + currentUser.id, 'PATCH',
        { balance: newBalance }, token);
    if (updateRes.error) return;

    await apiRequest('transactions', 'POST',
        { user_id: currentUser.id, description: 'Funds Added', amount },
        token);

    currentProfile.balance = newBalance
    await refreshWalletModal()

    const el = document.getElementById('fundSuccess')
    el.style.color = '#4eff91'
    el.textContent = `+$${amount.toFixed(2)} added to your wallet!`
    setTimeout(() => el.textContent = '', 2500)
}

async function refreshWalletModal() {
    if (!currentProfile) return
    const session = await sb.auth.getSession();
    const token = session.data?.session?.access_token;

    // Re-fetch fresh balance
    const data = await apiRequest('profiles?id=eq.' + currentUser.id + '&select=balance,first_name,last_name', 'GET', null, token);
    const profileData = Array.isArray(data) ? data[0] : data;
    if (profileData) currentProfile = { ...currentProfile, ...profileData }

    document.getElementById('walletBalance').textContent = (currentProfile.balance || 0).toFixed(2)
    const full = `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim().toUpperCase() || 'NOIR MEMBER'
    document.getElementById('walletUser').textContent = full

    // Fetch transactions via proxy
    const txs = await apiRequest('transactions?user_id=eq.' + currentUser.id + '&order=created_at.desc&limit=10', 'GET', null, token);

    const list = document.getElementById('transactionList')
    list.innerHTML = !txs?.length
        ? '<div class="no-transactions">No transactions yet.</div>'
        : txs.map(t =>
            `<div class="tx-item">
                <span>${t.description}</span>
                <span class="${t.amount > 0 ? 'tx-plus' : 'tx-minus'}">${t.amount > 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)}</span>
            </div>`
        ).join('')

    // Update Dropdown
    document.getElementById('popWalletBalance').textContent = (currentProfile.balance || 0).toFixed(2);
    document.getElementById('popWalletUser').textContent = full;
}

// =====================
// UI SYNC
// =====================
function updateUIForUser() {
    const userBtn = document.getElementById('userBtn')
    const walletBtn = document.getElementById('walletBtn')

    if (currentUser) {
        const avatarUrl = getAvatarUrl()
        const initials = ((currentProfile?.first_name?.[0] || '') + (currentProfile?.last_name?.[0] || '')).toUpperCase() || currentUser.email[0].toUpperCase()
        
        if (avatarUrl) {
            userBtn.innerHTML = `<img src="${avatarUrl}" alt="avatar" class="header-avatar-img">`
        } else {
            userBtn.innerHTML = `<div class="header-avatar-placeholder">${initials}</div>`
        }
        userBtn.classList.add('avatar-active');
        walletBtn.classList.add('visible')
        refreshProfileModal()
        
        // Update Popups
        document.getElementById('popName').textContent = initials.length > 1 ? initials : 'Noir User';
        if (currentProfile) {
            document.getElementById('popName').textContent = `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim() || 'Noir User';
        }
        document.getElementById('popEmail').textContent = currentUser.email;
        
        const popAvatar = document.getElementById('popAvatar');
        if (avatarUrl) {
            popAvatar.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            popAvatar.textContent = initials;
        }

        document.getElementById('editProfileItem').style.display = 'flex';
        document.getElementById('logoutItem').style.display = 'flex';
        document.getElementById('loginItem').style.display = 'none';
    } else {
        userBtn.innerHTML = `<i data-feather="user"></i>`
        userBtn.classList.remove('avatar-active')
        walletBtn.classList.remove('visible')
        
        // Reset Popups
        document.getElementById('popName').textContent = 'Noir User';
        document.getElementById('popEmail').textContent = 'Sign in to access';
        document.getElementById('popAvatar').textContent = 'N';
        
        document.getElementById('editProfileItem').style.display = 'none';
        document.getElementById('logoutItem').style.display = 'none';
        document.getElementById('loginItem').style.display = 'flex';
        
        feather.replace()
    }
}

// =====================
// CART
// =====================
window.addToCart = (btn) => {
    const card = btn.closest('.card')
    cart.push({ name: card.dataset.name, price: parseFloat(card.dataset.price) })
    renderCart()
}

window.removeFromCart = (idx) => {
    cart.splice(idx, 1)
    renderCart()
}

function renderCart() {
    const items = document.getElementById('cartItems')
    const badge = document.getElementById('cartBadge')
    const total = document.getElementById('cartTotal')

    if (!cart.length) {
        items.innerHTML = '<div class="cart-empty">Your bag is empty.</div>'
        badge.style.display = 'none'
    } else {
        items.innerHTML = cart.map((i, idx) =>
            `<div class="cart-item">
                <span>${i.name}</span>
                <div style="display:flex;align-items:center;gap:.5rem">
                    <span>$${i.price.toFixed(2)}</span>
                    <span onclick="removeFromCart(${idx})" style="cursor:pointer;color:var(--accent-color);font-size:1.2rem">×</span>
                </div>
            </div>`
        ).join('')
        badge.style.display = 'flex'
        badge.textContent = cart.length
    }
    total.textContent = cart.reduce((s, i) => s + i.price, 0).toFixed(2)
}

window.handleCheckout = async () => {
    if (!currentUser) { openModal('authModal'); return }
    if (!cart.length) return
    const total = cart.reduce((s, i) => s + i.price, 0)
    const balance = currentProfile?.balance || 0

    if (balance < total) {
        closeModal('cartDrawer')
        await refreshWalletModal()
        openModal('walletModal')
        const el = document.getElementById('fundSuccess')
        el.style.color = '#ff6b6b'
        el.textContent = 'Insufficient balance. Please add funds.'
        return
    }

    const session = await sb.auth.getSession();
    const token = session.data?.session?.access_token;

    const newBalance = balance - total
    await apiRequest('profiles?id=eq.' + currentUser.id, 'PATCH', { balance: newBalance }, token);

    // Insert transactions
    for (const item of cart) {
        await apiRequest('transactions', 'POST',
            { user_id: currentUser.id, description: item.name, amount: -item.price },
            token);
    }

    currentProfile.balance = newBalance
    cart = []
    renderCart()
    closeModal('cartDrawer')
    await refreshWalletModal()
    alert('Purchase successful! Thank you.')
}

// =====================
// SEARCH
// =====================
window.filterCards = (q) => {
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = (c.dataset.name || '').toLowerCase().includes(q.toLowerCase()) ? '' : 'none'
    })
}

// =====================
// MODAL HELPERS
// =====================
window.openModal = (id) => document.getElementById(id).classList.add('active')
window.closeModal = (id) => document.getElementById(id).classList.remove('active')
window.showView = (id) => {
    document.getElementById('loginView').style.display = id === 'loginView' ? 'block' : 'none'
    document.getElementById('registerView').style.display = id === 'registerView' ? 'block' : 'none'
}

// =====================
// HEADER BUTTONS
// =====================
function initHeaderButtons() {
    document.getElementById('searchBtn').onclick = () => {
        const bar = document.getElementById('searchBarContainer')
        bar.classList.toggle('active')
        if (bar.classList.contains('active')) document.getElementById('searchInput').focus()
    }
    
    document.getElementById('cartBtn').onclick = () => openModal('cartDrawer')
    
    document.getElementById('walletBtn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('profileDropdown').classList.remove('active');
        document.getElementById('walletDropdown').classList.toggle('active');
        if (document.getElementById('walletDropdown').classList.contains('active')) refreshWalletModal();
    }
    
    document.getElementById('userBtn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('walletDropdown').classList.remove('active');
        document.getElementById('profileDropdown').classList.toggle('active');
    }

    window.addEventListener('click', (e) => {
        // Close dropdowns when clicking outside
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.action-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('active'));
        }

        ['authModal', 'profileModal', 'walletModal', 'cartDrawer'].forEach(id => {
            const el = document.getElementById(id)
            if (e.target === el) closeModal(id)
        })
        if (!e.target.closest('.header-actions')) {
            document.getElementById('searchBarContainer').classList.remove('active')
        }
    })
}

// =====================
// CURSOR & TILT
// =====================
function initCursorAndTilt() {
    const cursor  = document.querySelector('.cursor')
    const ring    = document.getElementById('cursor-ring')
    const tiltEls = document.querySelectorAll('.hero-title')
    let rx = 0, ry = 0, mx = 0, my = 0

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY
        cursor.style.left = mx + 'px'
        cursor.style.top  = my + 'px'

        tiltEls.forEach(el => {
            const rect = el.getBoundingClientRect()
            const px = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)
            const py = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2)
            el.style.transform = `perspective(1000px) rotateX(${py * -30}deg) rotateY(${px * 30}deg)`
        })
    })

    function animateRing() {
        rx += (mx - rx) * 0.12
        ry += (my - ry) * 0.12
        if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px' }
        requestAnimationFrame(animateRing)
    }
    animateRing()

    document.querySelectorAll('button, input, a, .card, .action-btn, .social-btn, .fund-btn, .dropdown-item, .theme-btn, .lang-btn, .review-card, .logo').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width  = '20px'
            cursor.style.height = '20px'
            if (ring) {
                ring.style.width       = '50px'
                ring.style.height      = '50px'
                ring.style.borderColor = 'rgba(255,49,135,0.8)'
            }
        })
        el.addEventListener('mouseleave', () => {
            cursor.style.width  = '12px'
            cursor.style.height = '12px'
            if (ring) {
                ring.style.width       = '36px'
                ring.style.height      = '36px'
                ring.style.borderColor = 'rgba(255,49,135,0.5)'
            }
        })
    })
}

// =====================
// CANVAS STARFIELD
// =====================
function initCanvasStarfield() {
    const canvas = document.getElementById('stars-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H, stars = []

    function initStars() {
        W = canvas.width  = window.innerWidth
        H = canvas.height = window.innerHeight
        stars = Array.from({ length: 180 }, () => ({
            x:  Math.random() * W,
            y:  Math.random() * H,
            r:  Math.random() * 1.4 + 0.2,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            a:  Math.random(),
            da: (Math.random() - 0.5) * 0.008,
        }))
    }

    function drawStars() {
        ctx.clearRect(0, 0, W, H)
        for (const s of stars) {
            s.x += s.vx; s.y += s.vy
            s.a += s.da
            if (s.a < 0) { s.a = 0; s.da *= -1 }
            if (s.a > 1) { s.a = 1; s.da *= -1 }
            if (s.x < 0) s.x = W; if (s.x > W) s.x = 0
            if (s.y < 0) s.y = H; if (s.y > H) s.y = 0

            const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3)
            grd.addColorStop(0, `rgba(255,49,135,${s.a * 0.9})`)
            grd.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2)
            ctx.fillStyle = grd
            ctx.fill()

            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${s.a * 0.8})`
            ctx.fill()
        }
        requestAnimationFrame(drawStars)
    }

    window.addEventListener('resize', initStars)
    initStars()
    drawStars()
}

// =====================
// GLOW EFFECTS
// =====================
function initGlowEffects() {
    document.querySelectorAll('.card, .btn-buy, nav ul li a, .action-btn, .social-btn, .fund-btn').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect()
            el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
            el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
        })
    })
}

// =====================
// TYPEWRITER
// =====================
function initTypewriter() {
    const text = 'Premium FiveM scripts, exclusive clothing, and private resources designed for the elite roleplay communities.'
    let i = 0
    setTimeout(function type() {
        const el = document.querySelector('.hero-desc')
        if (el && i < text.length) {
            el.innerHTML += text[i++]
            setTimeout(type, 35)
        }
    }, 1200)
}
