// --- CORE NAVIGATION ---
async function navigate(pageId, updateUrl = true) {
    // No-op when the user clicks a nav button for the page they're already on.
    // Otherwise we'd flash the loader and re-run the renderer for nothing,
    // which also briefly resets carousels/sticky scroll positions.
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === `page-${pageId}`) {
        // Special-case home: if the user clicks "Beranda" while already on
        // home, scroll them back to the top section like a soft refresh.
        if (pageId === 'home' && typeof goToSection === 'function') {
            goToSection('section-beranda');
        }
        return;
    }

    // Guard: leaving the admin panel with unsaved edits should prompt the
    // user to confirm. `confirmDiscardIfDirty` is no-op outside admin.
    const onAdmin = activePage && activePage.id === 'page-admin';
    const leavingAdmin = onAdmin && pageId !== 'admin';
    if (leavingAdmin && typeof confirmDiscardIfDirty === 'function') {
        if (!await confirmDiscardIfDirty()) return;
    }

    showLoader(pageId);
    // Pause hero autoplay during navigation; pages that need it (Games)
    // will restart the timer when their renderer runs.
    stopHeroAutoplay();
    setTimeout(() => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${pageId}`).classList.add('active');

        if(pageId === 'home') renderHome();
        if(pageId === 'anggota') renderAnggota();
        if(pageId === 'games') renderGames();
        if(pageId === 'game-detail') renderGameDetail();
        if(pageId === 'admin') renderAdmin();
        if(pageId === 'developer') renderDeveloper();
        if(pageId === 'profile') renderProfile();

        hideLoader();
        window.scrollTo(0,0);
        updateActiveNav(pageId);
        updateAuthUI();

        if (updateUrl) {
            history.pushState(
                {},
                "",
                pageId === "home" ? "/" : "/" + pageId
            );
        }
    }, 700);
}

// Show the skeleton loader, swapping in the variant matching the destination page.
function showLoader(pageId) {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const variants = loader.querySelectorAll('[data-skeleton]');
    variants.forEach(el => el.classList.add('hidden'));
    // Map navigate() pageIds to skeleton variant keys; fallback to home.
    const map = { home: 'home', anggota: 'anggota', games: 'games', 'game-detail': 'game', 'news-detail': 'news', profile: 'profile', developer: 'developer', login: 'login', admin: 'admin' };
    const key = map[pageId] || 'home';
    const target = loader.querySelector(`[data-skeleton="${key}"]`);
    if (target) target.classList.remove('hidden');
    loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
}

// Toggle active state on top navbar links to indicate the current page.
function updateActiveNav(pageId) {
    console.log(pageId);
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('is-active'));
    if (pageId === 'home' || pageId === 'news-detail') {
        const beranda = document.getElementById('nav-beranda');
        if (beranda) beranda.classList.add('is-active');
    }
    if (pageId === 'anggota') {
        const anggota = document.getElementById('nav-anggota');
        if (anggota) anggota.classList.add('is-active');
    }
    if (pageId === 'games' || pageId === 'game-detail') {
        const games = document.getElementById('nav-games');
        if (games) games.classList.add('is-active');
    }
    if (pageId === 'developer') {
        const dev = document.getElementById('nav-developer');
        if (dev) dev.classList.add('is-active');
    }
    // Highlight the entire user-info pill when the user is on /profile.
    const userInfo = document.getElementById('user-info');
    if (userInfo) userInfo.classList.toggle('is-active', pageId === 'profile');

    // Mirror active state in the mobile drawer.
    document.querySelectorAll('.mobile-nav-link').forEach(el => el.classList.remove('is-active'));
    const mobileMap = { home: 'beranda', anggota: 'anggota', games: 'games', developer: 'developer' };
    const mobileTarget = mobileMap[pageId];
    if (mobileTarget) {
        const el = document.querySelector(`.mobile-nav-link[data-page="${mobileTarget}"]`);
        if (el) el.classList.add('is-active');
    }
}

// --- MOBILE NAV DRAWER ---------------------------------------------------
let _mobileMenuKeyHandler = null;

function toggleMobileMenu(open) {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    if (open) {
        menu.classList.remove('hidden');
        // Listen for Escape so the drawer also closes via keyboard.
        _mobileMenuKeyHandler = (e) => { if (e.key === 'Escape') toggleMobileMenu(false); };
        document.addEventListener('keydown', _mobileMenuKeyHandler);
    } else {
        menu.classList.add('hidden');
        if (_mobileMenuKeyHandler) {
            document.removeEventListener('keydown', _mobileMenuKeyHandler);
            _mobileMenuKeyHandler = null;
        }
    }
}

// Single entry point used by the drawer menu items: closes the drawer first
// (so the user sees the destination, not the menu fading away mid-transition),
// then routes — `beranda` is special because it's a section on the home page.
function mobileNavGo(target) {
    toggleMobileMenu(false);
    if (target === 'beranda') {
        goToSection('section-beranda');
    } else {
        navigate(target);
    }
}

// Scroll to a specific section on the home page with a slide-up reveal animation.
// If we're on a different page, switch to home first, then animate.
function goToSection(sectionId) {
    const homePage = document.getElementById('page-home');
    const homeIsActive = homePage && homePage.classList.contains('active');

    const animate = () => {
        const target = document.getElementById(sectionId);
        if (!target) return;

        // Restart the reveal animation
        target.classList.remove('section-rise', 'section-glow');
        // Force reflow so the animation can re-trigger
        void target.offsetWidth;
        target.classList.add('section-rise', 'section-glow');

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Clean up animation classes after they finish
        setTimeout(() => target.classList.remove('section-rise', 'section-glow'), 1300);
    };

    if (homeIsActive) {
        animate();
    } else {
        navigate('home');
        // Wait for the page transition + render to settle
        setTimeout(animate, 750);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    let page = location.pathname.substring(1);

    if (!page) page = "home";

    navigate(page, false);
});

window.addEventListener("popstate", () => {
    let page = location.pathname.substring(1);

    if (!page) page = "home";

    navigate(page, false);
});