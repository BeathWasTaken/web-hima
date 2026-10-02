// --- HELPERS ---
const ID_MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const ID_MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

// Render an image wrapped in a skeleton shimmer that stays visible until the
// image fully loads, and persists if the image is missing or broken.
//
// `wrapperCls` styles the outer box (size, rounded corners, etc).
// `imgCls`     extra classes on the <img> (rare; sizing is already 100% via CSS).
//
// Performance:
//   - `loading="lazy"` defers off-screen image fetch until they near the viewport.
//   - `decoding="async"` lets the browser decode in parallel with paint.
function safeImage(src, alt = "", wrapperCls = "", imgCls = "") {
    const safeSrc = (src || '').replace(/"/g, '&quot;');
    const safeAlt = (alt || '').replace(/"/g, '&quot;');
    if (!safeSrc) {
        // No URL at all → render an empty skeleton box
        return `<div class="img-skel ${wrapperCls}"></div>`;
    }
    return `
        <div class="img-skel ${wrapperCls}">
            <img src="${safeSrc}" alt="${safeAlt}" class="${imgCls}"
                loading="lazy" decoding="async"
                onload="this.parentElement.classList.add('is-loaded')"
                onerror="this.parentElement.classList.add('is-failed')">
        </div>`;
}

// Minimal HTML escape so plain-text article bodies stay safe in innerHTML.
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Default selected date = today's ISO so the agenda list under the calendar
// shows today's events on first load instead of all events.
function todayISO() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

function formatEventDate(iso) {
    if (!iso) return "Tanggal belum diatur";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return `${d.getDate()} ${ID_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatEventTime(t) {
    if (!t) return "";
    return `${t} WIB`;
}

function formatEventTimeRange(start, end) {
    if (!start && !end) return "";
    if (start && end) return `${start} - ${end} WIB`;
    return formatEventTime(start || end);
}

// Calendar state
let calCursor = new Date();
calCursor.setDate(1);

let selectedDate = todayISO();

// Anggota page state
let activeDivisionFilter = "all";

// Games page state
let activeGameCategory = "all";
let activeGamePlatform = "all";
let activeGameSort = "popular"; // 'popular' | 'rating' | 'newest'

// Auto-advance: cycle the hero carousel every N ms. Reset whenever the user
// interacts (prev/next/dot click) so the auto rotation always gives a fresh
// full-length window after a manual move.
const HERO_AUTOPLAY_MS = 6000;

// Admin: track which game cards are expanded (showing the full edit form).
// Stored as a Set of game ids so the state survives sort/filter re-renders.
const expandedAdminGameIds = new Set();

function toggleAdminGameExpand(id) {
    if (expandedAdminGameIds.has(id)) expandedAdminGameIds.delete(id);
    else expandedAdminGameIds.add(id);
    renderAdminGames();
}

// Same expand/collapse pattern for News, Members, and Divisions admin lists.
const expandedAdminNewsIds = new Set();
const expandedAdminMemberIds = new Set();
const expandedAdminAdvisorIds = new Set();
const expandedAdminDivisionIds = new Set();

function toggleAdminNewsExpand(id) {
    if (expandedAdminNewsIds.has(id)) expandedAdminNewsIds.delete(id);
    else expandedAdminNewsIds.add(id);
    renderAdminNews();
}

function toggleAdminMemberExpand(id) {
    if (expandedAdminMemberIds.has(id)) expandedAdminMemberIds.delete(id);
    else expandedAdminMemberIds.add(id);
    renderAdminMembers();
}

function toggleAdminAdvisorExpand(id) {
    if (expandedAdminAdvisorIds.has(id)) expandedAdminAdvisorIds.delete(id);
    else expandedAdminAdvisorIds.add(id);
    renderAdminAdvisors();
}

function toggleAdminDivisionExpand(id) {
    if (expandedAdminDivisionIds.has(id)) expandedAdminDivisionIds.delete(id);
    else expandedAdminDivisionIds.add(id);
    renderAdminDivisions();
}

// Reusable chevron icon HTML used by every collapsible admin row.
function expandChevron(open) {
    return `
        <svg xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9l6 6 6-6"/>
        </svg>`;
}

// Berita Terkini pagination state (max 6 per page).
const NEWS_PER_PAGE = 6;
let newsPage = 0;

// --- ANGGOTA PAGE ---
function getDivision(id) {
    return db.divisions.find(d => d.id === id) || null;
}

// Normalize whatever was saved (legacy name OR hex) into a #rrggbb string.
function normalizeHex(value, fallback = '#475569') {
    if (!value) return fallback;
    const v = String(value).trim();
    if (LEGACY_COLOR_MAP[v]) return LEGACY_COLOR_MAP[v];
    // 3-digit shorthand
    let m = v.match(/^#([0-9a-f]{3})$/i);
    if (m) {
        const [r, g, b] = m[1].split('');
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    // 6-digit
    m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) return ('#' + m[1]).toLowerCase();
    return fallback;
}

// Returns { r, g, b } from #rrggbb.
function hexToRgb(hex) {
    const h = normalizeHex(hex);
    return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}

// Mix the given hex color toward white by `amount` (0..1) to produce a soft tint.
// e.g. tint('#4f46e5', 0.9) ≈ a Tailwind-50 equivalent.
function tintHex(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Pick a readable text color (dark or light) for the given background hex.
// Uses YIQ contrast.
function readableOn(hex) {
    const { r, g, b } = hexToRgb(hex);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 165 ? '#1e293b' /* slate-800 */ : '#ffffff';
}

// Build inline-style snippets for a division's accent color. Keeps render code
// concise: each helper returns a partial `style="..."` string.
function divisionTone(color) {
    const hex = normalizeHex(color);
    return {
        grey: `color: #a19c9c`,
        // soft chip background + colored text (used for tags/badges)
        chip:  `background-color:${tintHex(hex, 0.86)};color:${hex};`,
        // a small dot indicator
        dot:   `background-color:${hex};`,
        // ring around avatar (very soft)
        ring:  `--tw-ring-color:${tintHex(hex, 0.86)};box-shadow:0 0 0 2px #FCFCFC;`,
        // solid fill
        solid: `background-color:${hex};`,
        // raw values in case the caller needs them
        hex
    };
}

function memberAvatarUrl(m) {
    if (m.photo) return m.photo;
    const initials = encodeURIComponent(m.name || 'Anggota');
    return `https://ui-avatars.com/api/?name=${initials}&background=EEF2FF&color=4F46E5&bold=true&size=200`;
}

// --- Faculty advisors (dosen pembina) ---
// Public: render the row at the top of the Anggota page so the academic
// figureheads always appear before the student membership grid.
function advisorAvatarUrl(a) {
    if (a.photo) return a.photo;
    const initials = encodeURIComponent(a.name || 'Dosen');
    return `https://ui-avatars.com/api/?name=${initials}&background=4F46E5&color=ffffff&bold=true&size=200`;
}

// --- SCROLL REVEAL ---------------------------------------------------------
// Fade + slide-up animation triggered when an element enters the viewport.
// Apply class `.reveal` (defined in styles.css) on any element you want to
// animate. Helper auto-attaches an IntersectionObserver, so dynamically
// rendered content (admin lists, news cards, etc.) also picks it up.
let _revealObserver = null;

function getRevealObserver() {
    if (_revealObserver) return _revealObserver;
    if (typeof IntersectionObserver === 'undefined') return null;

    _revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                _revealObserver.unobserve(entry.target);
            }
        }
    }, {
        root: null,
        rootMargin: '0px 0px -10% 0px', // trigger slightly before fully in view
        threshold: 0.05
    });
    return _revealObserver;
}

// Find every `.reveal` element that hasn't been observed yet and start
// watching it. Cheap to call repeatedly; uses `data-reveal-bound` flag.
function bindScrollReveals() {
    const obs = getRevealObserver();
    if (!obs) {
        // No IntersectionObserver support → reveal everything immediately.
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        return;
    }
    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('.reveal').forEach(el => {
        if (el.dataset.revealBound === '1') return;
        el.dataset.revealBound = '1';

        // Stagger via inline transition-delay if the element provides
        // `data-reveal-delay` (in ms). Keeps lists feeling cascading.
        const delay = el.dataset.revealDelay;
        if (delay) el.style.transitionDelay = `${delay}ms`;

        // If the element is already inside the viewport at bind time
        // (common for above-the-fold content), reveal it on the next frame
        // instead of waiting for an intersection event that won't fire
        // because no scroll happens.
        const rect = el.getBoundingClientRect();
        const inView = rect.top < vh && rect.bottom > 0;
        if (inView) {
            requestAnimationFrame(() => el.classList.add('is-visible'));
        } else {
            obs.observe(el);
        }
    });
}

// Convert vertical mouse-wheel scroll into horizontal scroll on any container
// marked with class `.hscroll`. Lets desktop users browse horizontal carousels
// without using the trackpad swipe.
function enableHorizontalWheelScroll() {
    document.querySelectorAll('.hscroll').forEach(el => {
        if (el.dataset.hscrollBound === '1') return;
        el.dataset.hscrollBound = '1';
        el.addEventListener('wheel', (e) => {
            // Only intercept when user is using a vertical wheel (mouse) and the
            // container actually has horizontal overflow available.
            const canScrollH = el.scrollWidth > el.clientWidth;
            if (!canScrollH) return;
            // Trackpads often send horizontal deltaX already — let those pass.
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            if (e.deltaY === 0) return;

            e.preventDefault();
            el.scrollBy({ left: e.deltaY, behavior: 'auto' });
        }, { passive: false });
    });
}

function toggleRoleDropdown() {
    const menu = document.getElementById('role-dropdown-menu');
    const arrow = document.getElementById('role-arrow');

    menu.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
}

function selectRole(value, label) {
    document.getElementById('dev-new-role').value = value;
    document.getElementById('role-selected-text').textContent = label;

    document.querySelectorAll('.role-check').forEach(check => {
        check.classList.add('hidden');

        if (check.dataset.role === value) {
            check.classList.remove('hidden');
        }
    });

    document.getElementById('role-dropdown-menu').classList.add('hidden');
    document.getElementById('role-arrow').classList.remove('rotate-180');
}

function toggleUserRoleDropdown(button) {
    const dropdown = button.closest('.role-user-dropdown');
    const menu = dropdown.querySelector('.role-user-menu');
    const arrow = dropdown.querySelector('.role-arrow');

    document.querySelectorAll('.role-user-menu').forEach(item => {
        if (item !== menu) {
            item.classList.add('hidden');
        }
    });

    document.querySelectorAll('.role-arrow').forEach(item => {
        if (item !== arrow) {
            item.classList.remove('rotate-180');
        }
    });

    menu.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
}

function changeUserRole(button, email, role) {
    setUserRole(email, role);

    const dropdown = button.closest('.role-user-dropdown');

    if (dropdown) {
        dropdown.querySelector('.role-user-menu').classList.add('hidden');
        dropdown.querySelector('.role-arrow').classList.remove('rotate-180');
    }
}

document.addEventListener('click', function (event) {
    if (!event.target.closest('.role-user-dropdown')) {

        document.querySelectorAll('.role-user-menu').forEach(menu => {
            menu.classList.add('hidden');
        });

        document.querySelectorAll('.role-arrow').forEach(arrow => {
            arrow.classList.remove('rotate-180');
        });
    }
});

document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('role-dropdown');

    if (!dropdown.contains(event.target)) {
        document.getElementById('role-dropdown-menu').classList.add('hidden');
        document.getElementById('role-arrow').classList.remove('rotate-180');
    }
});

function startCounting() {
    const counters = document.querySelectorAll(".counter");

    counters.forEach(counter => {
        const target = Number(counter.dataset.target);
        const suffix = counter.dataset.suffix || "";
        const duration = 1500;

        const startTime = performance.now();

        function animate(currentTime) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const value = Math.floor(progress * target);

            counter.textContent = value + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                counter.textContent = target + suffix;
            }
        }

        requestAnimationFrame(animate);
    });
}