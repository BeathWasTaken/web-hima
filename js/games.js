// --- GAMES PAGE (Play Store style) ---
function getGameCategory(id) {
    return db.gameCategories.find(c => c.id === id) || null;
}

function formatDownloads(n) {
    if (!n || n < 1000) return `${n || 0}`;
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '')}K`;
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

// Catalog of supported platforms with display label + inline-SVG icon.
// Used both by the public Games page and the admin form.
const GAME_PLATFORMS = [
    {
        id: 'windows', label: 'Windows',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5.6L11 4.5v7.1H3V5.6zm0 12.8V12h8v6.9L3 17.4zm9-13.9L21 3v8.6h-9V4.5zm0 14.4V12h9v7.4L12 19z"/></svg>'
    },
    {
        id: 'android', label: 'Android',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 9l-2 1v6a1 1 0 102 0V9zm14 0v7a1 1 0 102 0v-6l-2-1zm-2 1v8a1 1 0 01-1 1h-1v3a1 1 0 11-2 0v-3h-2v3a1 1 0 11-2 0v-3h-1a1 1 0 01-1-1v-8h10zM7.6 8l1-2 1.7-.4-.5-1.2-1.7.4L6.6 3l-1 .6L6.6 5l-2 .5.5 1.1L7.1 6l1 1.4L7.6 8zm9.7-3l1-1.5-1-.5-1.4 2-1.7-.4-.5 1.2 1.7.4 1 2 1-.6-1-1.5 2-.6-.5-1.1L17.3 5z"/></svg>'
    },
    {
        id: 'ios', label: 'iOS',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 13.2c0-2.3 1.9-3.4 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1.1 2.6-2.2.5-.7 1-1.5 1.3-2.4-1.5-.5-2-1.8-2-3.6zm-2.4-6.7c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.7-.9 2.6 1 .1 2-.6 2.5-1.2z"/></svg>'
    },
    {
        id: 'mac', label: 'macOS',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.7 12.5c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 2.9 2.4 1.2 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.3 0 2-1.2 2.7-2.4.9-1.4 1.2-2.7 1.2-2.8-.1 0-2.4-.9-2.4-3.6zM16.4 5c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/></svg>'
    },
    {
        id: 'linux', label: 'Linux',
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2 0-3 1.5-3 3.5 0 1.4.5 2 .5 3 0 1-1.5 1.5-2 3-1 3 0 5.5-1 7s-2 1.5-2 3c0 1.5 2 1.5 4 1.5 1 0 2-.3 3-.3s2 .3 3 .3c2 0 4 0 4-1.5 0-1.5-1-1.5-2-3s0-4-1-7c-.5-1.5-2-2-2-3 0-1 .5-1.6.5-3C15 3.5 14 2 12 2zm-1 4a1 1 0 100 2 1 1 0 000-2zm2 0a1 1 0 100 2 1 1 0 000-2z"/></svg>'
    },
    {
        id: 'web', label: 'Web',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>'
    }
];
const PLATFORM_MAP = Object.fromEntries(GAME_PLATFORMS.map(p => [p.id, p]));

// Inline-SVG badge cluster for a list of platform ids. `size` controls icon px.
function renderPlatformBadges(platforms, size = 14) {
    if (!Array.isArray(platforms) || platforms.length === 0) return '';
    return platforms.map(id => {
        const p = PLATFORM_MAP[id];
        if (!p) return '';
        return `<span class="inline-flex items-center justify-center text-slate-500" title="${p.label}" aria-label="${p.label}" style="width:${size}px;height:${size}px">${p.icon}</span>`;
    }).join('');
}

// Pill-style platform badge with label (used in detail modal).
function renderPlatformPills(platforms) {
    if (!Array.isArray(platforms) || platforms.length === 0) {
        return '<span class="text-xs text-slate-400 italic">Platform belum diisi.</span>';
    }
    return platforms.map(id => {
        const p = PLATFORM_MAP[id];
        if (!p) return '';
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <span style="width:14px;height:14px" class="inline-flex items-center text-slate-500">${p.icon}</span>
            ${p.label}
        </span>`;
    }).join('');
}

function renderStars(rating, size = 'sm') {
    // Discrete star renderer (full / half / empty) with text label.
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const sizeCls = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
    const full = '<svg class="' + sizeCls + ' text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>';
    const half = '<svg class="' + sizeCls + ' text-amber-400" viewBox="0 0 20 20" fill="currentColor"><defs><linearGradient id="halfg"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><path fill="url(#halfg)" d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>';
    const empty = '<svg class="' + sizeCls + ' text-slate-200" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>';
    let out = '';
    for (let i = 1; i <= 5; i++) {
        if (r >= i) out += full;
        else if (r >= i - 0.5) out += half;
        else out += empty;
    }
    return out;
}

function getSortedGames() {
    const list = [...db.games];
    const filtered = list.filter(g => {
        const catOk = activeGameCategory === 'all' || g.categoryId === activeGameCategory;
        const platOk = activeGamePlatform === 'all'
            || (Array.isArray(g.platforms) && g.platforms.includes(activeGamePlatform));
        return catOk && platOk;
    });
    switch (activeGameSort) {
        case 'rating':  return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':  return filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
        case 'popular':
        default:        return filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    }
}

// Hero carousel state
let heroCarouselIndex = 0;
let _heroAutoplayTimer = null;

function renderGames() {
    // Edit Konten Admin badge
    const adminBadge = document.getElementById('games-admin-badge');
    if (adminBadge) {
        adminBadge.classList.toggle('hidden', !(currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')));
    }

    // Resolve activeGamePlatform first so all section renderers see a valid id.
    resolveActiveGamePlatform();

    renderGamesPlatforms();
    renderGamesHero();
    renderGamesAll();
    renderGamesSuggested();
    enableHorizontalWheelScroll();
    bindScrollReveals();
}

// Pick a sensible default platform if the current one is invalid or empty.
// Order: keep current if valid → first tab with games → first tab regardless →
// 'windows' as last-resort label so the page never looks broken.
function resolveActiveGamePlatform() {
    const tabs = GAME_PLATFORMS
        .map(p => ({
            id: p.id,
            count: db.games.filter(g => Array.isArray(g.platforms) && g.platforms.includes(p.id)).length
        }))
        .filter(p => p.count > 0);

    if (tabs.some(t => t.id === activeGamePlatform)) return; // already valid

    activeGamePlatform = tabs[0]?.id
        || GAME_PLATFORMS[0]?.id
        || 'windows';
}

// Platform "tabs" along the top of the page. No "Untukmu" — only real
// platform tabs. The first one is preselected if `activeGamePlatform` is 'all'
// or doesn't match any tab.
function renderGamesPlatforms() {
    const cont = document.getElementById('games-platforms');
    if (!cont) return;

    // Build the list of platforms that actually have at least one game.
    const tabs = GAME_PLATFORMS
        .map(p => ({
            id: p.id,
            label: p.label,
            icon: p.icon,
            count: db.games.filter(g => Array.isArray(g.platforms) && g.platforms.includes(p.id)).length
        }))
        .filter(p => p.count > 0);

    // Make sure activeGamePlatform points to one of the available tabs;
    // otherwise default to the first one. (No more 'all' for platforms.)
    if (!tabs.some(t => t.id === activeGamePlatform)) {
        activeGamePlatform = tabs[0]?.id || '';
    }

    cont.innerHTML = tabs.map(it => {
        const active = activeGamePlatform === it.id;
        return `<button onclick="setGamePlatform('${it.id}')" type="button"
            class="relative inline-flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition
                ${active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'}">
            ${it.icon ? `<span style="width:14px;height:14px" class="inline-flex items-center">${it.icon}</span>` : ''}
            <span>${it.label}</span>
            ${active ? `<span class="absolute left-3 right-3 -bottom-px h-[3px] rounded-t-full bg-emerald-600"></span>` : ''}
        </button>`;
    }).join('');
}

// Helper: list of games available on the active platform (always filter).
function gamesOnActivePlatform() {
    if (!activeGamePlatform) return [];
    return db.games.filter(g => Array.isArray(g.platforms) && g.platforms.includes(activeGamePlatform));
}

// --- Section partitioning -----------------------------------------------
// Each Games-page section pulls a slice from the platform's games. The slices
// are deliberately non-overlapping so a single game shows up exactly once on
// the page (Editor's Choice → Populer → Disarankan).
const HERO_LIMIT = 5;
const POPULAR_LIMIT = 3;

function heroGames() {
    const platformGames = gamesOnActivePlatform();
    const featured = platformGames.filter(g => g.featured);
    return (featured.length ? featured : platformGames).slice(0, HERO_LIMIT);
}

// "Populer": 3 game terbaru pada platform aktif, di antara mereka diurutkan
// berdasarkan rating tertinggi. Strategi: ambil pool top-N terbaru (by id desc),
// lalu sort by rating desc. Hero entries tidak dimasukkan di sini.
function popularGames() {
    const heroIds = new Set(heroGames().map(g => g.id));
    // Take a generous pool of recent games, then re-rank by rating.
    const recentPool = [...gamesOnActivePlatform()]
        .filter(g => !heroIds.has(g.id))
        .sort((a, b) => (b.id || 0) - (a.id || 0))
        .slice(0, Math.max(POPULAR_LIMIT * 2, POPULAR_LIMIT));
    return recentPool
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, POPULAR_LIMIT);
}

// "Disarankan untukmu": semua game tersisa pada platform aktif setelah Hero
// dan Populer di-keluarkan. Diurutkan dari install terbanyak.
function suggestedGames() {
    const usedIds = new Set([...heroGames(), ...popularGames()].map(g => g.id));
    return [...gamesOnActivePlatform()]
        .filter(g => !usedIds.has(g.id))
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
}

// Editor's Choice carousel: filtered to active platform, with prev/next arrows
// and a smooth slide animation.
function renderGamesHero() {
    const cont = document.getElementById('games-hero');
    if (!cont) return;

    const slides = heroGames();

    if (slides.length === 0) {
        cont.innerHTML = `
            <div class="rounded-[2rem] md:rounded-[3rem] p-12 bg-white border border-dashed border-slate-200 text-center">
                <p class="text-sm font-bold text-slate-500">Belum ada game di platform ini.</p>
            </div>`;
        return;
    }

    // Clamp current index when the list shrinks (e.g. switching platform).
    if (heroCarouselIndex >= slides.length) heroCarouselIndex = 0;

    const trackHTML = slides.map(g => `
        <div class="games-hero-slide shrink-0 w-full relative cursor-pointer group" onclick="openGameDetail(${g.id})">
            <div class="absolute inset-0">
                ${safeImage(g.banner || g.icon, g.title, 'w-full h-full')}
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/55 to-slate-900/10"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent"></div>

            <div class="relative z-10 p-6 md:p-10 lg:p-14 min-h-[280px] md:min-h-[360px] flex flex-col justify-end text-white">
                <div class="flex items-end gap-4 md:gap-5">
                    <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-lg">
                        ${safeImage(g.icon, g.title, 'w-full h-full')}
                    </div>
                    <div class="min-w-0 flex-1">
                        <h2 class="text-2xl md:text-4xl font-extrabold tracking-tight mb-1 truncate">${g.title}</h2>
                        <p class="text-sm md:text-base opacity-90 line-clamp-2 max-w-2xl">${g.tagline || g.developer || ''}</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-3 md:gap-5 mt-6">
                    <button type="button" onclick="event.stopPropagation(); openGameDetail(${g.id})"
                        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-extrabold hover:bg-slate-100 transition shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.84A1 1 0 005 3.7v12.6a1 1 0 001.555.832l9.5-6.3a1 1 0 000-1.664l-9.5-6.3a1 1 0 00-.255-.026z"/></svg>
                        Lihat Detail
                    </button>
                    <div class="flex items-center gap-3 text-xs md:text-sm font-bold">
                        <span class="inline-flex items-center gap-1 text-amber-300">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>
                            <span class="text-white">${(g.rating || 0).toFixed(1)}</span>
                        </span>
                        <span class="text-white/40">·</span>
                        <span class="text-white/80">${formatDownloads(g.downloads)}+ install</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const showArrows = slides.length > 1;
    cont.innerHTML = `
        <div class="reveal group/hero relative rounded-2xl md:rounded-[1.25rem] shadow-xl shadow-slate-200/60 bg-slate-900">
            <div class="overflow-hidden rounded-2xl md:rounded-[1.25rem]">
                <div id="games-hero-track" class="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                     style="transform: translateX(-${heroCarouselIndex * 100}%);">
                    ${trackHTML}
                </div>
            </div>

            ${showArrows ? `
                <!-- Side arrows that straddle the banner's left/right edges so
                     half of the button hangs outside the banner — pure Play
                     Store-feel. They fade in on hover. -->
                <button type="button" onclick="event.stopPropagation(); heroCarouselGo(-1)"
                    class="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-slate-900 shadow-xl ring-1 ring-slate-900/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95
                           opacity-0 group-hover/hero:opacity-100 focus-visible:opacity-100"
                    aria-label="Sebelumnya">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button type="button" onclick="event.stopPropagation(); heroCarouselGo(1)"
                    class="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-slate-900 shadow-xl ring-1 ring-slate-900/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95
                           opacity-0 group-hover/hero:opacity-100 focus-visible:opacity-100"
                    aria-label="Berikutnya">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <!-- Page indicator dots -->
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                    ${slides.map((_, i) => `
                        <button type="button" onclick="event.stopPropagation(); heroCarouselSet(${i}); restartHeroAutoplay();"
                            data-hero-dot="${i}"
                            class="h-1.5 rounded-full transition-all ${i === heroCarouselIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/75'}"
                            aria-label="Slide ${i + 1}"></button>
                    `).join('')}
                </div>
            ` : ''}
        </div>`;

    // Kick off (or refresh) the auto-advance loop now that the markup is live.
    restartHeroAutoplay();
}

// Move the carousel by `delta` slides with wrap-around.
function heroCarouselGo(delta) {
    const slides = heroGames();
    if (slides.length === 0) return;
    const next = (heroCarouselIndex + delta + slides.length) % slides.length;
    heroCarouselSet(next);
    // Manual nav resets the autoplay countdown so the user gets a full window
    // before the next auto-advance.
    restartHeroAutoplay();
}

function heroCarouselSet(index) {
    heroCarouselIndex = index;
    // Slide the track and update dot indicators in place — no re-render so
    // the CSS transition can actually animate from current to new translate.
    const track = document.getElementById('games-hero-track');
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('[data-hero-dot]').forEach(dot => {
        const i = parseInt(dot.dataset.heroDot, 10);
        const isActive = i === index;
        dot.className = `h-1.5 rounded-full transition-all ${isActive ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/75'}`;
    });
}

// Internal: advance one slide on autoplay (no manual-reset side effect).
function _heroAutoplayTick() {
    const slides = heroGames();
    if (slides.length <= 1) return;
    const next = (heroCarouselIndex + 1) % slides.length;
    heroCarouselSet(next);
}

// (Re)start the auto-advance timer. Called from initial render and after
// every user interaction so they always see a fresh full-length pause.
function restartHeroAutoplay() {
    stopHeroAutoplay();
    if (heroGames().length <= 1) return; // nothing to cycle
    _heroAutoplayTimer = setInterval(_heroAutoplayTick, HERO_AUTOPLAY_MS);
}

function stopHeroAutoplay() {
    if (_heroAutoplayTimer) {
        clearInterval(_heroAutoplayTimer);
        _heroAutoplayTimer = null;
    }
}

function heroCarouselSet(index) {
    heroCarouselIndex = index;
    // Slide the track and update dot indicators in place — no re-render so
    // the CSS transition can actually animate from current to new translate.
    const track = document.getElementById('games-hero-track');
    if (track) track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('[data-hero-dot]').forEach(dot => {
        const i = parseInt(dot.dataset.heroDot, 10);
        const isActive = i === index;
        dot.className = `h-1.5 rounded-full transition-all ${isActive ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`;
    });
}

// Suggested for you: top installed games on active platform (excluding hero).
function renderGamesSuggested() {
    const cont = document.getElementById('games-suggested');
    const titleEl = document.getElementById('games-suggested-title');
    if (!cont) return;

    const platformLabel = PLATFORM_MAP[activeGamePlatform]?.label || '';
    if (titleEl) titleEl.innerText = platformLabel
        ? `Disarankan untukmu di ${platformLabel}`
        : 'Disarankan untukmu';

    const list = suggestedGames();
    if (list.length === 0) { cont.innerHTML = '<p class="text-sm text-slate-400 italic px-1">Belum ada rekomendasi lain di platform ini.</p>'; return; }

    cont.innerHTML = list.map(g => {
        const cat = getGameCategory(g.categoryId);
        return `
            <div onclick="openGameDetail(${g.id})"
                class="reveal snap-start shrink-0 w-36 sm:w-40 cursor-pointer group">
                <div class="relative w-full aspect-square rounded-3xl overflow-hidden mb-3 border border-slate-100 group-hover:shadow-lg transition">
                    ${safeImage(g.icon, g.title, 'w-full h-full')}
                </div>
                <p class="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition">${g.title}</p>
                <p class="text-[11px] text-slate-400 truncate">${cat ? cat.name : '—'}</p>
                <div class="flex items-center gap-1 mt-1 text-[11px] font-bold text-slate-700">
                    <span>${(g.rating || 0).toFixed(1)}</span>
                    <svg class="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>
                </div>
            </div>`;
    }).join('');
}

// "Populer" — curated popular list shown as detailed cards (banner + icon
// overlap + meta). Uses popularGames() so EC and Suggested entries are
// excluded; this section never duplicates them.
function renderGamesAll() {
    const cont = document.getElementById('games-all');
    const titleEl = document.getElementById('games-all-title');
    if (!cont) return;

    if (titleEl) titleEl.innerText = 'Populer';

    const list = popularGames();
    if (list.length === 0) {
        cont.innerHTML = `
            <div class="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                <p class="text-sm font-bold text-slate-500">Belum ada game lain di kategori ini.</p>
            </div>`;
        return;
    }

    cont.innerHTML = list.map(g => {
        const cat = getGameCategory(g.categoryId);
        return `
            <div onclick="openGameDetail(${g.id})"
                class="reveal cursor-pointer group rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition">
                <!-- Banner -->
                <div class="relative aspect-[16/8] bg-slate-100">
                    ${safeImage(g.banner || g.icon, g.title, 'w-full h-full')}
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    ${g.featured ? `
                        <span class="absolute top-3 left-3 inline-flex items-center gap-1 bg-amber-400/95 text-amber-900 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow">
                            ★ Featured
                        </span>` : ''}
                    ${(g.platforms && g.platforms.length) ? `
                        <div class="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-slate-600 px-2.5 py-1 rounded-full shadow-sm">
                            ${renderPlatformBadges(g.platforms, 12)}
                        </div>` : ''}
                </div>
                <!-- Body: icon + title + genre/rating + install -->
                <div class="p-5 flex items-start gap-4">
                    <div class="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 -mt-12 shadow-md flex-shrink-0 bg-white">
                        ${safeImage(g.icon, g.title, 'w-full h-full')}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="font-extrabold text-slate-800 truncate group-hover:text-emerald-700 transition">${g.title}</p>
                        <p class="text-xs text-slate-500 font-medium truncate">${g.developer || '—'}</p>
                        <div class="flex items-center gap-2 mt-2 text-xs">
                            ${cat ? `<span class="font-bold text-slate-600">${cat.name}</span><span class="text-slate-300">·</span>` : ''}
                            <span class="inline-flex items-center gap-0.5 font-bold text-slate-700">
                                ${(g.rating || 0).toFixed(1)}
                                <svg class="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>
                            </span>
                            <span class="text-slate-300">·</span>
                            <span class="text-slate-500">${formatDownloads(g.downloads)} install</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function setGamePlatform(id) {
    activeGamePlatform = id;
    // Switching platform resets the hero carousel position so the user lands
    // on the first slide of the new platform's featured list.
    heroCarouselIndex = 0;
    renderGamesPlatforms();
    renderGamesHero();
    renderGamesAll();
    renderGamesSuggested();
    enableHorizontalWheelScroll();
    bindScrollReveals();
}

function setGameSort(sort) {
    activeGameSort = sort;
    document.querySelectorAll('.games-sort').forEach(b => {
        b.classList.toggle('bg-slate-900', b.dataset.sort === sort);
        b.classList.toggle('text-white', b.dataset.sort === sort);
        b.classList.toggle('border-slate-900', b.dataset.sort === sort);
        b.classList.toggle('bg-white', b.dataset.sort !== sort);
        b.classList.toggle('text-slate-600', b.dataset.sort !== sort);
        b.classList.toggle('border-slate-200', b.dataset.sort !== sort);
    });
    renderGamesAll();
    bindScrollReveals();
}

// --- Game detail modal ---
// Track which page the user came from so the Game Detail back button can
// restore that page rather than always sending them to home.
let _gameDetailPreviousPage = 'games';
let activeGameDetailId = null;

function openGameDetail(id) {
    const g = db.games.find(x => x.id === id);
    if (!g) return;

    // Remember origin page so closing returns the user to where they were.
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id) {
        const prev = activePage.id.replace(/^page-/, '');
        // Don't store the detail page as its own back-target.
        if (prev !== 'game-detail') _gameDetailPreviousPage = prev;
    }

    activeGameDetailId = id;
    navigate('game-detail');
}

function renderGameDetail() {
    const id = activeGameDetailId;
    if (id == null) return;
    const g = db.games.find(x => x.id === id);
    if (!g) return;
    const cat = getGameCategory(g.categoryId);

    const setText = (sel, val) => { const el = document.getElementById(sel); if (el) el.innerText = val; };
    const setHTML = (sel, val) => { const el = document.getElementById(sel); if (el) el.innerHTML = val; };

    setHTML('gd-banner', safeImage(g.banner || g.icon, g.title, 'w-full h-full'));
    // The header has separate desktop and mobile DOM trees so the layout can
    // be tuned independently. Fill both copies with the same data.
    const iconHTML = safeImage(g.icon, g.title, 'w-full h-full');
    setHTML('gd-icon', iconHTML);
    setHTML('gd-icon-mobile', iconHTML);

    const titleText = g.title || '(Tanpa Judul)';
    setText('gd-title', titleText);
    setText('gd-title-mobile', titleText);

    const devText = g.developer || 'Unknown Developer';
    setText('gd-developer', devText);
    setText('gd-developer-mobile', devText);

    const catText = cat ? cat.name : 'Tanpa Kategori';
    setText('gd-category', catText);
    setText('gd-category-mobile', catText);

    setText('gd-rating-num', (g.rating || 0).toFixed(1));
    setText('gd-downloads', `${formatDownloads(g.downloads)}+`);
    setText('gd-size', g.size || '—');
    setText('gd-version', g.version || '—');

    // Inline mini platform badges next to the rating row.
    const platformsRow = document.getElementById('gd-platforms-row');
    if (platformsRow) {
        platformsRow.innerHTML = (g.platforms && g.platforms.length)
            ? renderPlatformBadges(g.platforms, 14)
            : '';
    }

    // Tagline + description block.
    setText('gd-tagline', g.tagline || '');
    setText('gd-description', g.description || 'Belum ada deskripsi untuk game ini.');

    // Full platform pills.
    setHTML('gd-platforms', renderPlatformPills(g.platforms));

    // Screenshots carousel.
    const sc = document.getElementById('gd-screenshots');
    if (sc) {
        sc.innerHTML = (g.screenshots || []).map(src => `
            <div class="snap-start shrink-0 w-64 aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-100">
                ${safeImage(src, g.title, 'w-full h-full')}
            </div>`).join('') || `<p class="text-sm text-slate-400 italic">Belum ada screenshot.</p>`;
    }

    // Install button: there are two copies (mobile + desktop). Sync state on
    // both so whichever the user sees behaves correctly.
    ['gd-install', 'gd-install-mobile'].forEach(id => {
        const installBtn = document.getElementById(id);
        if (!installBtn) return;
        if (g.link) {
            installBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            installBtn.dataset.href = g.link;
        } else {
            installBtn.classList.add('opacity-50', 'cursor-not-allowed');
            installBtn.dataset.href = '';
        }
    });

    enableHorizontalWheelScroll();
}

function closeGameDetail() {
    activeGameDetailId = null;
    navigate(_gameDetailPreviousPage || 'games');
}

function gameInstallClick() {
    // Both desktop and mobile install buttons share the same handler. Pick
    // whichever has its href set (they're kept in sync on render).
    const btn = document.getElementById('gd-install') || document.getElementById('gd-install-mobile');
    const href = btn?.dataset.href;
    if (!href) {
        showAlert('Tautan instal belum diatur untuk game ini.', { title: 'Belum Tersedia', icon: 'warn' });
        return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
}

// Nudge the screenshots carousel by ~one card width in `direction`
// (-1 = left, 1 = right). Uses smooth scrolling so the move animates.
function scrollScreenshots(direction) {
    const track = document.getElementById('gd-screenshots');
    if (!track) return;
    // Each card is 16rem (w-64) + 12px gap. Nudge by full card to mimic
    // a one-step "page" without overshooting.
    const firstChild = track.querySelector('div, img');
    const step = firstChild ? firstChild.offsetWidth + 12 : 280;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
}
