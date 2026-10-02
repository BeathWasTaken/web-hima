// --- GOOGLE CALENDAR ---
let pendingGCalUrl = null;

function buildGCalUrl(ev) {
    // Format yyyymmddThhmmss (local) — passing &ctz preserves intent.
    const dateStr = (ev.date || '').replace(/-/g, '');
    const startTime = ev.time || '09:00';
    const startLocal = dateStr ? `${dateStr}T${startTime.replace(':', '')}00` : '';

    // End time: pakai endTime kalau ada, kalau tidak default +1 jam dari start.
    let endLocal = '';
    if (dateStr) {
        if (ev.endTime) {
            endLocal = `${dateStr}T${ev.endTime.replace(':', '')}00`;
        } else {
            const [h, m] = startTime.split(':').map(Number);
            const endH = String((h + 1) % 24).padStart(2, '0');
            endLocal = `${dateStr}T${endH}${String(m).padStart(2, '0')}00`;
        }
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: ev.title || 'Agenda HIMA PRO',
        details: 'Agenda dari HIMA PRO Portal.',
        ctz: 'Asia/Jakarta'
    });
    if (startLocal && endLocal) params.set('dates', `${startLocal}/${endLocal}`);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function openGCalModal(eventId) {
    const ev = db.events.find(e => String(e.id) === String(eventId));
    if (!ev) return;

    pendingGCalUrl = buildGCalUrl(ev);

    document.getElementById('gcal-modal-desc').innerText = ev.title;
    document.getElementById('gcal-modal-meta').innerText =
        `${formatEventDate(ev.date)}${(ev.time || ev.endTime) ? ' • ' + formatEventTimeRange(ev.time, ev.endTime) : ''}`;

    const modal = document.getElementById('gcal-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeGCalModal() {
    pendingGCalUrl = null;
    const modal = document.getElementById('gcal-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function confirmGCalRedirect() {
    if (pendingGCalUrl) window.open(pendingGCalUrl, '_blank', 'noopener,noreferrer');
    closeGCalModal();
}

// --- RENDERERS ---

// Run-once flag for the hero typing animation. We only animate the first
// time the user lands on Home; subsequent re-renders (after switching pages)
// just snap to the final state so the user isn't watching it again.
let _heroTypedOnce = false;
let _heroTypeTimer = null;

// Render the hero headline. On the very first home render, characters
// progressively transfer from a hidden "ghost" span into the visible
// "typed" span so the layout never shifts mid-animation. The ghost reserves
// the final word's full size up front; the visible portion just fills in.
function renderHeroHeadline() {
    const heroTitleEl = document.getElementById('display-hero-title');
    if (!heroTitleEl) return;

    const fullText = db.hero.title || '';
    const safeFull = escapeHtml(fullText);

    // Cancel any timer from a previous animation that didn't finish before
    // the user navigated away and back (defensive — shouldn't normally hit).
    if (_heroTypeTimer) { clearInterval(_heroTypeTimer); _heroTypeTimer = null; }

    const prefersReduced = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Skip animation entirely if it has already played, or the user prefers
    // reduced motion. Render the final state directly with a blinking caret.
    if (_heroTypedOnce || prefersReduced) {
        heroTitleEl.innerHTML =
            `<span class="hero-typed">${safeFull}</span>` +
            `<span class="type-caret" aria-hidden="true"></span>`;
        return;
    }

    // Initial render: empty typed span + full ghost reserves layout, plus
    // a hidden-but-spacing caret. We toggle the caret's visibility once
    // typing completes so the headline never grows or shifts.
    heroTitleEl.innerHTML =
        `<span class="hero-typed"></span>` +
        `<span class="hero-ghost" aria-hidden="true">${safeFull}</span>` +
        `<span class="type-caret is-pending" aria-hidden="true"></span>`;

    const typedEl = heroTitleEl.querySelector('.hero-typed');
    const ghostEl = heroTitleEl.querySelector('.hero-ghost');
    let i = 0;

    const tickMs = 55;          // base cadence per character
    const pauseAt = (ch) => {   // small extra pause for natural rhythm
        if (ch === '.') return 320;
        if (ch === ',') return 180;
        if (ch === ' ') return 30;
        return 0;
    };

    const step = () => {
        if (i >= fullText.length) {
            clearInterval(_heroTypeTimer);
            _heroTypeTimer = null;
            _heroTypedOnce = true;
            // Animation finished. Mutate the existing nodes in place rather
            // than replacing innerHTML so the layout / caret position never
            // jumps: ghost is no longer needed, typed gets the full string,
            // and the caret simply drops `.is-pending` to start blinking.
            typedEl.textContent = fullText;
            ghostEl.remove();
            const caret = heroTitleEl.querySelector('.type-caret');
            if (caret) caret.classList.remove('is-pending');
            return;
        }
        const ch = fullText[i];
        // Move one character from ghost → typed.
        // Use textContent so HTML entities inside `escapeHtml` output don't
        // double-encode when they cross spans.
        typedEl.textContent += ch;
        ghostEl.textContent = fullText.slice(i + 1);
        i++;

        const extra = pauseAt(ch);
        if (extra > 0) {
            // Schedule the next character after an extra pause without
            // restarting the interval — easiest is clearing and re-arming.
            clearInterval(_heroTypeTimer);
            _heroTypeTimer = setTimeout(() => {
                _heroTypeTimer = setInterval(step, tickMs);
            }, extra);
        }
    };

    _heroTypeTimer = setInterval(step, tickMs);
}

function renderHome() {
    renderHeroHeadline();
    document.getElementById('display-hero-desc').innerText = db.hero.desc;

    // Visi & Misi
    const visiEl = document.getElementById('display-visi');
    if (visiEl) visiEl.innerText = db.visi || '—';

    const misiEl = document.getElementById('display-misi');
    if (misiEl) {
        const items = db.misi || [];
        misiEl.innerHTML = items.map((item, i) => `
            <li class="relative flex gap-4 items-start group">
                <!-- Connector line between numbered nodes (drawn by sibling positioning) -->
                ${i < items.length - 1 ? '<span aria-hidden="true" class="absolute left-[1.125rem] top-12 bottom-[-1.5rem] w-px bg-gradient-to-b from-indigo-100 to-transparent"></span>' : ''}
                <span class="relative z-10 flex-shrink-0 w-9 h-9 rounded-2xl bg-white border-2 border-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition">
                    ${String(i + 1).padStart(2, '0')}
                </span>
                <p class="text-slate-700 text-base leading-relaxed pt-1.5">${item}</p>
            </li>
        `).join('');

        // Update count label "X Mission" in header.
        const countEl = document.getElementById('display-misi-count');
        if (countEl) countEl.innerText = `${items.length} POIN MISI`;
    }

    // Animate
    startCounting();

    // Calendar
    renderCalendar();

    // Events
    renderEvents();

    // News
    renderNews();

    bindScrollReveals();
}

// --- BERITA TERKINI ---
function renderNews() {
    const grid = document.getElementById('display-news');
    if (!grid) return;

    const total = db.news.length;
    const totalPages = Math.max(1, Math.ceil(total / NEWS_PER_PAGE));
    if (newsPage >= totalPages) newsPage = totalPages - 1;
    if (newsPage < 0) newsPage = 0;

    const start = newsPage * NEWS_PER_PAGE;
    const slice = db.news.slice(start, start + NEWS_PER_PAGE);

    if (slice.length === 0) {
        grid.innerHTML = `
            <div class="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                <p class="text-sm font-bold text-slate-500">Belum ada berita.</p>
            </div>`;
        return;
    }

    // Magazine layout:
    //   - First card on the active page is the "featured" hero (full-width
    //     banner with overlaid text + tag pill).
    //   - The rest are compact horizontal cards with thumbnail + meta line.
    const [featured, ...rest] = slice;

    const featuredHTML = `
        <div class="reveal group relative cursor-pointer rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition"
             onclick="openNewsDetail(${featured.id})">
            <div class="relative aspect-[16/9] sm:aspect-[16/7] bg-slate-100">
                ${safeImage(featured.img, featured.title, 'w-full h-full transition duration-700 group-hover:scale-105')}
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent"></div>
            </div>
            <div class="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                <div class="flex items-center gap-2 mb-2 text-[10px] font-bold tracking-[0.22em] uppercase opacity-90">
                    <span class="bg-pink-500 text-white px-2.5 py-1 rounded-full">${featured.tag || 'Berita'}</span>
                    ${featured.publishedAt ? `<span class="text-white/70">${formatNewsDate(featured.publishedAt)}</span>` : ''}
                </div>
                <h4 class="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight max-w-3xl group-hover:text-pink-200 transition">
                    ${featured.title}
                </h4>
                ${featured.author ? `<p class="text-xs text-white/70 font-medium mt-2">Oleh ${featured.author}</p>` : ''}
            </div>
        </div>`;

    const restHTML = rest.map((n, i) => `
        <div class="reveal group flex items-center gap-4 p-3 rounded-2xl border border-slate-100 bg-white hover:border-pink-200 hover:bg-pink-50/30 transition cursor-pointer"
             data-reveal-delay="${(i + 1) * 60}"
             onclick="openNewsDetail(${n.id})">
            <div class="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                ${safeImage(n.img, n.title, 'w-full h-full grayscale group-hover:grayscale-0 transition duration-500')}
            </div>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-pink-600 mb-1">
                    <span>${n.tag || 'Berita'}</span>
                    ${n.publishedAt ? `<span class="text-slate-300">·</span><span class="text-slate-400 normal-case tracking-normal font-medium">${formatNewsDate(n.publishedAt)}</span>` : ''}
                </div>
                <h4 class="font-bold text-slate-800 text-sm leading-snug group-hover:text-pink-700 transition line-clamp-2">${n.title}</h4>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-pink-500 group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
        </div>`).join('');

    grid.innerHTML = featuredHTML + (restHTML ? `<div class="space-y-3 mt-4">${restHTML}</div>` : '');
    bindScrollReveals();

    // Pagination footer — always rendered so the layout/spacing below the
    // news grid stays consistent even when there's only one page of items.
    // Previous/Next stay disabled when there's nothing to navigate to.
    const pager = document.getElementById('news-pagination');
    if (pager) {
        const atStart = newsPage === 0;
        const atEnd = newsPage >= totalPages - 1;
        pager.innerHTML = `
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-slate-200/70">
                <button onclick="changeNewsPage(-1)" ${atStart ? 'disabled' : ''}
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition
                        ${atStart ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}">
                    <span>‹</span> Previous
                </button>
                <p class="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    Hal ${newsPage + 1} <span class="text-slate-300">/</span> ${totalPages}
                </p>
                <button onclick="changeNewsPage(1)" ${atEnd ? 'disabled' : ''}
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition
                        ${atEnd ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}">
                    Next <span>›</span>
                </button>
            </div>`;
    }
}

function changeNewsPage(delta) {
    const totalPages = Math.max(1, Math.ceil(db.news.length / NEWS_PER_PAGE));
    const next = newsPage + delta;
    if (next < 0 || next >= totalPages) return;
    newsPage = next;
    renderNews();
}

// --- CALENDAR ---
function changeMonth(delta) {
    calCursor.setMonth(calCursor.getMonth() + delta);

    // Keep `selectedDate` valid for the new month so the agenda list always
    // tracks something visible. If today is in the new month → use today,
    // otherwise → first day of that month.
    const y = calCursor.getFullYear();
    const m = calCursor.getMonth();
    const t = new Date();
    if (t.getFullYear() === y && t.getMonth() === m) {
        selectedDate = todayISO();
    } else {
        selectedDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    }

    renderCalendar();
    renderEvents();
}

function selectDate(iso) {
    // No toggle off — agenda below always tracks a single selected date.
    selectedDate = iso;
    renderCalendar();
    renderEvents();
}

// Jump to a specific date, switching the visible month if needed.
// Used when clicking greyed-out days from the previous/next month.
function goToDate(iso) {
    const [y, m] = iso.split('-').map(Number);
    calCursor = new Date(y, m - 1, 1);
    selectedDate = iso;
    renderCalendar();
    renderEvents();
}

function renderCalendar() {
    const title = document.getElementById('cal-title');
    const grid = document.getElementById('cal-grid');
    if (!title || !grid) return;

    const year = calCursor.getFullYear();
    const month = calCursor.getMonth();
    title.innerText = `${ID_MONTHS[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();        // 0=Sun .. 6=Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Index events for current month (used for dot indicators)
    const eventDays = new Set(
        db.events
            .filter(ev => ev.date && ev.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
            .map(ev => ev.date)
    );

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // Build cells with leading days from previous month and trailing days from next month
    // so the grid is always visually full.
    const cells = [];

    // Previous month's trailing days (greyed, click → previous month + select day)
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const prevDate = new Date(year, month - 1, 1);
        const iso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push(renderCalCell({ day, otherMonth: true, iso }));
    }

    // Current month's days
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        cells.push(renderCalCell({
            day: d,
            iso,
            hasEvent: eventDays.has(iso),
            isToday: iso === todayStr,
            isSelected: iso === selectedDate
        }));
    }

    // Next month's leading days to complete the grid (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(year, month + 1, 1);
        const iso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push(renderCalCell({ day: d, otherMonth: true, iso }));
    }

    grid.innerHTML = cells.join('');
}

// Single cell renderer for the calendar grid.
// `otherMonth` cells are greyed out and jump to that exact date when clicked.
function renderCalCell(opts) {
    if (opts.otherMonth) {
        return `
            <button type="button" onclick="goToDate('${opts.iso}')"
                class="relative aspect-square flex items-center justify-center cursor-pointer group">
                <span class="w-9 h-9 flex items-center justify-center text-sm rounded-full text-slate-300 group-hover:text-slate-500 group-hover:bg-slate-50 transition">
                    ${opts.day}
                </span>
            </button>`;
    }

    const { day, iso, hasEvent, isToday, isSelected } = opts;

    // Style priority:
    //   - today is always indigo (its color never changes, even when selected)
    //   - selected + hasEvent → keep event color, just add a ring
    //   - selected (no event) → soft grey pill
    //   - hasEvent → indigo-50 background
    //   - default → plain text + hover bg
    let pillCls = 'text-slate-700 group-hover:bg-slate-100';
    if (hasEvent && !isToday)                 pillCls = 'bg-indigo-100 text-indigo-700 font-bold group-hover:bg-indigo-200' + (isSelected ? ' ring-2 ring-offset-2 ring-indigo-200' : '');
    if (isSelected && !isToday && !hasEvent)  pillCls = 'bg-slate-200 text-slate-800 font-bold ring-2 ring-offset-2 ring-slate-300';
    if (isToday)                              pillCls = 'bg-indigo-600 text-white font-bold' + (isSelected ? ' ring-2 ring-offset-2 ring-indigo-300' : '');

    // Event marker dot rendered ABOVE the pill so it sits like a badge.
    const dotColor = isToday ? 'bg-indigo-400' : 'bg-indigo-600';

    return `
        <button type="button" onclick="selectDate('${iso}')"
            class="relative aspect-square flex items-center justify-center cursor-pointer group">
            ${hasEvent ? `<span class="absolute top-0.5 w-1 h-1 rounded-full ${dotColor}"></span>` : ''}
            <span class="w-9 h-9 flex items-center justify-center text-sm rounded-full transition ${pillCls}">
                ${day}
            </span>
        </button>`;
}

function renderEvents() {
    const cont = document.getElementById('display-events');
    if (!cont) return;

    // The agenda list always tracks the currently selected date.
    const list = db.events.filter(ev => ev.date === selectedDate);

    const isToday = selectedDate === todayISO();
    const header = `
        <div class="flex justify-between items-center">
            <p class="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Agenda • ${formatEventDate(selectedDate)}${isToday ? ' • Hari Ini' : ''}
            </p>
        </div>`;

    const items = list.length
        ? list.map(ev => `
            <div onclick="openGCalModal('${ev.id}')" class="p-6 bg-white rounded-2xl border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-indigo-600 transition">
                <div>
                    <p class="font-bold text-slate-800">${ev.title}</p>
                    <p class="text-xs text-slate-400 font-medium">${formatEventDate(ev.date)}${(ev.time || ev.endTime) ? ' • ' + formatEventTimeRange(ev.time, ev.endTime) : ''}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">→</div>
            </div>
        `).join('')
        : `<div class="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-400 font-medium">
                Tidak ada agenda pada tanggal ini.
           </div>`;

    cont.innerHTML = header + items;
}

// --- News detail page ---
// Track previous page so back button can return where the user came from.
let _previousPageId = 'home';

function openNewsDetail(id) {
    const news = db.news.find(n => n.id === id);
    if (!news) return;

    // Remember which page we came from so closeNewsDetail can return there.
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id) {
        _previousPageId = activePage.id.replace(/^page-/, '');
    }

    // Fill DOM
    document.getElementById('news-detail-title').innerText = news.title || '(Tanpa Judul)';
    const tagEl = document.getElementById('news-detail-tag');
    const tagWrap = document.getElementById('news-detail-tag-wrap');
    if (news.tag) {
        tagEl.innerText = news.tag;
        tagWrap.classList.remove('hidden');
    } else {
        tagWrap.classList.add('hidden');
    }
    document.getElementById('news-detail-author').innerText = news.author || 'Tim Redaksi HIMA';
    document.getElementById('news-detail-date').innerText = formatNewsDate(news.publishedAt);
    document.getElementById('news-detail-image').innerHTML = safeImage(news.img, news.title, 'w-full h-full');

    // Body: split paragraphs by blank line so admin can write naturally.
    const bodyEl = document.getElementById('news-detail-body');
    const text = (news.body || '').trim();
    if (text) {
        bodyEl.innerHTML = text
            .split(/\n\s*\n/)
            .map(par => `<p>${escapeHtml(par).replace(/\n/g, '<br>')}</p>`)
            .join('');
    } else {
        bodyEl.innerHTML = `<p class="italic text-slate-400">Belum ada isi artikel untuk berita ini.</p>`;
    }

    navigate('news-detail');
}

function closeNewsDetail() {
    // Return to whatever page the user was on (defaults to home).
    if (_previousPageId === 'news-detail') _previousPageId = 'home';
    navigate(_previousPageId || 'home');
}

// Format yyyy-mm-dd → "5 Juli 2024" with Indonesian month names.
function formatNewsDate(iso) {
    if (!iso) return 'Tanggal tidak diset';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
