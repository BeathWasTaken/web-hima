// --- ADMIN CMS LOGIC ---
// Pattern: every admin section edits `db` in-memory only. Nothing persists
// to localStorage until the user explicitly clicks "Update". `commitAdminSection`
// writes db, shows a success toast, and re-renders relevant public pages.

// --- Unsaved-changes guard ------------------------------------------------
// Snapshot of the persisted db at the moment the admin landed on the panel,
// or right after their last successful save. We compare the live `db` against
// this snapshot to detect dirty state and prompt before navigation/refresh.
let _adminBaseline = null;

// Capture the current `db` state. Called when entering admin and after each
// successful save so the next dirty-check measures from the right baseline.
function takeAdminSnapshot() {
    try { _adminBaseline = JSON.stringify(db); } catch (_) { _adminBaseline = null; }
}

// True when the in-memory db diverges from the last saved baseline.
function isAdminDirty() {
    if (!_adminBaseline) return false;
    try { return JSON.stringify(db) !== _adminBaseline; } catch (_) { return false; }
}

// Discard any unsaved changes by reloading the persisted snapshot from
// localStorage (or the default seed if absent). Re-runs the admin renderer
// so all inputs re-bind to the freshly reset values.
function discardAdminChanges() {
    try {
        const stored = localStorage.getItem('hima_super_db');
        if (stored) {
            const fresh = JSON.parse(stored);
            // Mutate `db` in-place so other modules holding a reference still see
            // the rolled-back values. Wipe extra keys, then assign the fresh ones.
            Object.keys(db).forEach(k => { delete db[k]; });
            Object.assign(db, fresh);
        }
    } catch (_) { /* noop — keep current db if storage is unreadable */ }
    takeAdminSnapshot();
}

// Show a confirmation modal whenever the user tries to leave the admin panel
// or switch sections with pending edits. Resolves true if they want to discard.
async function confirmDiscardIfDirty() {
    if (!isAdminDirty()) return true;
    const ok = await showConfirm(
        'Ada perubahan yang belum disimpan. Lanjutkan dan buang perubahan tersebut?',
        { title: 'Perubahan Belum Disimpan', danger: true, okLabel: 'Buang Perubahan', cancelLabel: 'Tetap Edit' }
    );
    if (ok) discardAdminChanges();
    return ok;
}

// `beforeunload` warns the user before refresh / close-tab when there are
// unsaved edits. Browser shows its own native generic dialog because custom
// messages have been deprecated for this event.
window.addEventListener('beforeunload', (e) => {
    if (isAdminDirty()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

function commitAdminSection(label) {
    try {
        localStorage.setItem('hima_super_db', JSON.stringify(db));
    } catch (err) {
        showAlert('Gagal menyimpan perubahan ke browser. Coba kurangi gambar atau bersihkan storage.', {
            title: 'Penyimpanan Penuh', icon: 'warn'
        });
        return;
    }
    // Move the baseline forward so subsequent edits compare against the
    // freshly-saved state, not the pre-edit snapshot.
    takeAdminSnapshot();
    showAlert(`Perubahan ${label} berhasil disimpan.`, { title: 'Tersimpan', icon: 'success' });
}

function renderAdmin() {
    // Both admin and developer roles can access the admin panel.
    // Developers are effectively superusers and inherit all admin powers.
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) {
        navigate('login');
        return;
    }

    // Take a snapshot of db on entry so the dirty-check has a baseline.
    takeAdminSnapshot();

    // Highlight default (hero) sidebar button on first render. If a section
    // is already active (e.g. user clicked "Anggota" badge to open admin),
    // we leave it as-is so deep-links keep their highlight.
    if (!document.querySelector('.admin-nav.is-active')) {
        const heroBtn = document.getElementById('admin-nav-hero');
        if (heroBtn) heroBtn.classList.add('is-active');
    }

    // Fill Hero
    document.getElementById('inp-hero-title').value = db.hero.title;
    document.getElementById('inp-hero-desc').value = db.hero.desc;

    // Fill Visi & Misi
    const visiInp = document.getElementById('inp-visi');
    if (visiInp) visiInp.value = db.visi || '';
    renderAdminMisi();

    // Fill Events
    const evList = document.getElementById('admin-event-list');
    evList.innerHTML = db.events.map((ev, idx) => `
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div class="flex justify-between items-center gap-3">
                <input type="text" value="${ev.title}" onchange="updateEvent(${idx}, 'title', this.value)"
                    class="flex-1 p-2 rounded-lg border bg-white text-sm font-bold">
                <button onclick="deleteEvent(${idx})" class="text-red-500 text-xs font-bold whitespace-nowrap">Hapus</button>
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</label>
                    <input type="date" value="${ev.date || ''}" onchange="updateEvent(${idx}, 'date', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mulai</label>
                    <input type="time" value="${ev.time || ''}" onchange="updateEvent(${idx}, 'time', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selesai</label>
                    <input type="time" value="${ev.endTime || ''}" onchange="updateEvent(${idx}, 'endTime', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
            </div>
        </div>
    `).join('');

    // Fill Divisions
    renderAdminDivisions();

    // Fill Members
    renderAdminMembers();

    // Fill Advisors (Dosen Pembina)
    renderAdminAdvisors();

    // Fill News
    renderAdminNews();

    // Fill Games
    renderAdminGames();
    renderAdminGameCategories();
}

async function setAdminSection(id) {
    // Guard sidebar navigation: prompt if the user has unsaved edits in the
    // current section before swapping. They can choose to discard or stay.
    if (!await confirmDiscardIfDirty()) return;

    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`admin-${id}`);
    if (target) target.classList.remove('hidden');

    // Highlight the matching sidebar button.
    document.querySelectorAll('.admin-nav').forEach(b => b.classList.remove('is-active'));
    const navBtn = document.getElementById(`admin-nav-${id}`);
    if (navBtn) navBtn.classList.add('is-active');

    // Games tree behavior:
    //   - If the active section is one of Games' children, expand the tree
    //     and highlight the parent so the active branch is visible.
    //   - Otherwise, collapse the Games tree so it doesn't stay open while
    //     the user is browsing unrelated sections (Berita, Anggota, etc.).
    const isGamesChild = id === 'games-categories' || id === 'games-list';
    if (isGamesChild) {
        setAdminGamesTreeOpen(true);
        const parent = document.getElementById('admin-nav-games');
        if (parent) parent.classList.add('is-active');
    } else {
        setAdminGamesTreeOpen(false);
    }

    // After successful switch, refresh the snapshot so the new section's
    // current state becomes the new dirty-check baseline.
    takeAdminSnapshot();
}

// Open/close the Games tree branch in the admin sidebar. Used both by the
// parent button (manual toggle) and by setAdminSection (auto-expand).
function setAdminGamesTreeOpen(open) {
    const children = document.getElementById('admin-nav-games-children');
    const chev = document.getElementById('admin-nav-games-chev');
    if (!children) return;
    children.classList.toggle('hidden', !open);
    if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Click handler for the parent "Games" tree node. If the tree is closed,
// open it AND jump to the Categories sub-section by default. If it's
// already open and the user clicks again, just collapse the branch.
function toggleAdminGamesTree() {
    const children = document.getElementById('admin-nav-games-children');
    const isOpen = children && !children.classList.contains('hidden');
    if (isOpen) {
        // Collapse — but only if the user isn't already viewing one of the
        // Games sub-sections (otherwise we'd hide the active branch).
        const onChild = document.getElementById('admin-games-categories')?.classList.contains('hidden') === false
                     || document.getElementById('admin-games-list')?.classList.contains('hidden') === false;
        if (!onChild) {
            setAdminGamesTreeOpen(false);
            return;
        }
    }
    setAdminGamesTreeOpen(true);
    setAdminSection('games-categories');
}

// --- Visi & Misi admin helpers ---
function renderAdminMisi() {
    const list = document.getElementById('admin-misi-list');
    if (!list) return;
    list.innerHTML = (db.misi || []).map((item, idx) => `
        <div class="dnd-row flex items-stretch gap-2" data-dnd-key="misi" data-dnd-idx="${idx}">
            ${dndHandle()}
            <div class="dnd-card flex-1 flex gap-2 items-start p-2 bg-slate-50 rounded-2xl border border-slate-200 transition">
                <span class="mt-1 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center flex-shrink-0">${String(idx + 1).padStart(2, '0')}</span>
                <textarea rows="2" onchange="updateMisi(${idx}, this.value)" class="flex-1 p-3 rounded-xl border bg-white text-sm">${item}</textarea>
                <div class="flex flex-col gap-1 mt-1 flex-shrink-0">
                    <button onclick="dndMove('misi', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                        class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                        title="Naikkan">↑</button>
                    <button onclick="dndMove('misi', ${idx}, 1)" ${idx === db.misi.length - 1 ? 'disabled' : ''}
                        class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === db.misi.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                        title="Turunkan">↓</button>
                </div>
                <button onclick="deleteMisi(${idx})" class="mt-1 text-red-500 text-xs font-bold flex-shrink-0">Hapus</button>
            </div>
        </div>
    `).join('');
    dndAttach(list);
}
registerReorderable('misi', () => db.misi, renderAdminMisi);

function updateMisi(idx, val) {
    db.misi[idx] = val;
    // In-memory only — admin commits via Visi & Misi Update button.
}

function addMisi() {
    if (!Array.isArray(db.misi)) db.misi = [];
    db.misi.push("Misi baru");
    renderAdminMisi();
}

function deleteMisi(idx) {
    db.misi.splice(idx, 1);
    renderAdminMisi();
}

function updateEvent(idx, field, val) {
    db.events[idx][field] = val;
    // In-memory only — admin commits via Agenda Update button.
}

// Hero + Visi & Misi share the same Update button. Reads inputs, copies into
// `db`, then commits via the central helper.
function saveHeroData() {
    db.hero.title = document.getElementById('inp-hero-title').value;
    db.hero.desc = document.getElementById('inp-hero-desc').value;
    commitAdminSection('Beranda');
}

function saveVisiMisiData() {
    const visiInp = document.getElementById('inp-visi');
    if (visiInp) db.visi = visiInp.value;
    // Misi rows are already mirrored into db by updateMisi() per keystroke.
    commitAdminSection('Visi & Misi');
}

// One Update button per data section. Each commits the in-memory `db` and
// re-renders relevant admin UI to reflect the saved state.
function saveEventsData()        { commitAdminSection('Agenda'); renderAdmin(); }
function saveDivisionsData()     { commitAdminSection('Divisi'); renderAdmin(); }
function saveMembersData()       { commitAdminSection('Anggota'); renderAdmin(); }
function saveAdvisorsData()      { commitAdminSection('Dosen Pembina'); renderAdmin(); }
function saveNewsData()          { commitAdminSection('Berita'); renderAdmin(); }
function saveGameCategoriesData(){ commitAdminSection('Kategori Game'); renderAdmin(); }
function saveGamesData()         { commitAdminSection('Games'); renderAdmin(); }

async function addEvent() {
    const title = await showPrompt('Beri judul untuk agenda baru:', {
        title: 'Tambah Agenda', placeholder: 'Nama agenda', okLabel: 'Tambah'
    });
    if (!title) return;
    db.events.push({ id: Date.now(), title, date: "", time: "", endTime: "" });
    // In-memory only. User must press the Update button to persist.
    renderAdmin();
}

async function deleteEvent(idx) {
    const ev = db.events[idx];
    const ok = await showConfirm(`Agenda "${ev.title}" akan dihapus dan tidak dapat dikembalikan.`, {
        title: 'Hapus Agenda?', danger: true, okLabel: 'Hapus', cancelLabel: 'Batal'
    });
    if (!ok) return;
    db.events.splice(idx, 1);
    renderAdmin();
}

// --- ADMIN: DIVISIONS ---
// Quick-pick palette shown next to the color picker so users get sensible defaults.
const DIVISION_COLOR_PRESETS = [
    '#4f46e5', '#2563eb', '#0ea5e9', '#0d9488',
    '#059669', '#65a30d', '#d97706', '#e11d48',
    '#db2777', '#9333ea', '#475569', '#1e293b'
];

function renderAdminDivisions() {
    const list = document.getElementById('admin-division-list');
    if (!list) return;
    list.innerHTML = db.divisions.map((div, idx) => {
        const isExpanded = expandedAdminDivisionIds.has(div.id);
        const t = divisionTone(div.color);
        const hex = t.hex;
        const usage = db.members.filter(m => m.divisionId === div.id).length;
        const presetSwatches = DIVISION_COLOR_PRESETS.map(c => `
            <button type="button" onclick="setDivisionColor(${idx}, '${c}')"
                class="w-6 h-6 rounded-md border ${c.toLowerCase() === hex.toLowerCase() ? 'border-slate-900 ring-2 ring-offset-1 ring-slate-300' : 'border-slate-200 hover:border-slate-400'} transition"
                style="background-color:${c}" title="${c}"></button>
        `).join('');

        const headerHTML = `
            <button type="button" onclick="toggleAdminDivisionExpand('${div.id}')"
                class="flex-1 flex items-center gap-3 text-left min-w-0">
                <span class="w-9 h-9 rounded-xl flex-shrink-0" style="${t.solid}"></span>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 truncate">${div.name || '(Tanpa nama)'}</p>
                    <p class="text-[11px] text-slate-400 truncate font-mono uppercase">${div.id} · ${hex}</p>
                </div>
                <span class="hidden sm:inline text-[11px] font-bold text-slate-500 flex-shrink-0">${usage} anggota</span>
                <span class="hidden sm:inline text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md bg-slate-100 flex-shrink-0">#${idx + 1}</span>
                ${expandChevron(isExpanded)}
            </button>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="event.stopPropagation(); dndMove('divisions', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Naikkan">↑</button>
                <button onclick="event.stopPropagation(); dndMove('divisions', ${idx}, 1)" ${idx === db.divisions.length - 1 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === db.divisions.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Turunkan">↓</button>
                <button onclick="event.stopPropagation(); deleteDivision(${idx})" class="text-red-500 text-xs font-bold whitespace-nowrap pl-1">Hapus</button>
            </div>`;

        const bodyHTML = !isExpanded ? '' : `
            <div class="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-200 space-y-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Divisi</label>
                    <input type="text" value="${div.name}" onchange="updateDivision(${idx}, 'name', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm font-bold">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warna Aksen</label>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        <input type="color" value="${hex}" oninput="setDivisionColor(${idx}, this.value)"
                            class="w-12 h-10 rounded-lg border border-slate-200 bg-white cursor-pointer p-1 flex-shrink-0">
                        <input id="div-hex-${idx}" type="text" value="${hex}"
                            onchange="setDivisionColor(${idx}, this.value)"
                            placeholder="#4f46e5"
                            class="flex-1 min-w-[120px] p-2 rounded-lg border border-slate-200 bg-white text-sm font-mono uppercase">
                        <span class="text-[10px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg flex-shrink-0" style="${t.chip}">Preview</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5 mt-2">${presetSwatches}</div>
                </div>
                <p class="text-[11px] text-slate-400">${usage} anggota terdaftar di divisi ini.</p>
            </div>`;

        return `
            <div class="dnd-row flex items-stretch gap-3" data-dnd-key="divisions" data-dnd-idx="${idx}">
                ${dndHandle()}
                <div class="dnd-card flex-1 min-w-0 bg-slate-50 rounded-2xl border border-slate-200 transition">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        ${headerHTML}
                    </div>
                    ${bodyHTML}
                </div>
            </div>`;
    }).join('');
    dndAttach(list);
}
registerReorderable('divisions', () => db.divisions, renderAdminDivisions);

// Update a division's color from any input source (picker, hex field, preset swatch).
// Validates the value before staging so a half-typed hex doesn't break rendering.
function setDivisionColor(idx, value) {
    const next = normalizeHex(value, db.divisions[idx]?.color || '#475569');
    db.divisions[idx].color = next;
    // In-memory only — admin commits via Divisi Update button.
    renderAdminDivisions();
    renderAdminMembers();
}

function updateDivision(idx, field, val) {
    if (field === 'color') return setDivisionColor(idx, val);
    db.divisions[idx][field] = val;
    renderAdminDivisions();
    renderAdminMembers();
}

async function addDivision() {
    const name = await showPrompt('Beri nama divisi baru yang akan tampil sebagai filter di halaman Anggota.', {
        title: 'Tambah Divisi', placeholder: 'Contoh. Marketing', okLabel: 'Tambah'
    });
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `div-${Date.now()}`;
    if (db.divisions.some(d => d.id === id)) {
        await showAlert('Divisi dengan ID serupa sudah ada. Pakai nama lain.', {
            title: 'Tidak Bisa Ditambahkan', icon: 'warn', okLabel: 'Mengerti'
        });
        return;
    }
    const usedColors = new Set(db.divisions.map(d => normalizeHex(d.color)));
    const color = DIVISION_COLOR_PRESETS.find(c => !usedColors.has(c.toLowerCase())) || '#475569';
    db.divisions.push({ id, name, color });
    renderAdminDivisions();
    renderAdminMembers();
}

async function deleteDivision(idx) {
    const div = db.divisions[idx];
    if (!div) return;
    const inUse = db.members.filter(m => m.divisionId === div.id).length;
    const msg = inUse
        ? `Divisi "${div.name}" akan dihapus. ${inUse} anggota di divisi ini akan menjadi tanpa divisi.`
        : `Divisi "${div.name}" akan dihapus.`;
    const ok = await showConfirm(msg, {
        title: 'Hapus Divisi?', danger: true, okLabel: 'Hapus', cancelLabel: 'Batal'
    });
    if (!ok) return;
    db.divisions.splice(idx, 1);
    db.members = db.members.map(m => m.divisionId === div.id ? { ...m, divisionId: "" } : m);
    renderAdminDivisions();
    renderAdminMembers();
}

// --- ADMIN: MEMBERS ---
function renderAdminMembers() {
    const list = document.getElementById('admin-member-list');
    if (!list) return;
    if (db.members.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-400 italic">Belum ada anggota.</p>`;
        return;
    }
    list.innerHTML = db.members.map((m, idx) => {
        const isExpanded = expandedAdminMemberIds.has(m.id);
        const div = getDivision(m.divisionId);
        const t = div ? divisionTone(div.color) : null;

        const divOpts = [
            `<option value="" ${!m.divisionId ? 'selected' : ''}>— Tanpa Divisi —</option>`,
            ...db.divisions.map(d => `<option value="${d.id}" ${d.id === m.divisionId ? 'selected' : ''}>${d.name}</option>`)
        ].join('');

        const headerHTML = `
            <button type="button" onclick="toggleAdminMemberExpand(${m.id})"
                class="flex-1 flex items-center gap-3 text-left min-w-0">
                ${safeImage(memberAvatarUrl(m), m.name, 'w-12 h-12 rounded-2xl flex-shrink-0')}
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 truncate">${m.name || '(Tanpa nama)'}</p>
                    <p class="text-[11px] text-slate-400 truncate">${m.role || 'Anggota'}</p>
                </div>
                ${div ? `<span class="hidden sm:inline text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full flex-shrink-0" style="${t.chip}">${div.name}</span>` : `<span class="hidden sm:inline text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md bg-slate-100 flex-shrink-0">Tanpa Divisi</span>`}
                <span class="hidden sm:inline text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md bg-slate-100 flex-shrink-0">#${idx + 1}</span>
                ${expandChevron(isExpanded)}
            </button>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="event.stopPropagation(); dndMove('members', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Naikkan">↑</button>
                <button onclick="event.stopPropagation(); dndMove('members', ${idx}, 1)" ${idx === db.members.length - 1 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === db.members.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Turunkan">↓</button>
                <button onclick="event.stopPropagation(); deleteMember(${idx})" class="text-red-500 text-xs font-bold whitespace-nowrap pl-1">Hapus</button>
            </div>`;

        const bodyHTML = !isExpanded ? '' : `
            <div class="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-200 space-y-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama</label>
                    <input type="text" value="${m.name}" placeholder="Nama" onchange="updateMember(${idx}, 'name', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm font-bold">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan</label>
                        <input type="text" value="${m.role || ''}" onchange="updateMember(${idx}, 'role', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Divisi</label>
                        <select onchange="updateMember(${idx}, 'divisionId', this.value)" class="w-full p-2 rounded-lg border bg-white text-sm">${divOpts}</select>
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Foto (opsional)</label>
                    <input type="text" value="${m.photo || ''}" placeholder="https://..." onchange="updateMember(${idx}, 'photo', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
            </div>`;

        return `
            <div class="dnd-row flex items-stretch gap-3" data-dnd-key="members" data-dnd-idx="${idx}">
                ${dndHandle()}
                <div class="dnd-card flex-1 min-w-0 bg-slate-50 rounded-2xl border border-slate-200 transition">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        ${headerHTML}
                    </div>
                    ${bodyHTML}
                </div>
            </div>`;
    }).join('');
    dndAttach(list);
}
registerReorderable('members', () => db.members, renderAdminMembers);

// --- ADMIN: ADVISORS (Dosen Pembina) ---
function renderAdminAdvisors() {
    const list = document.getElementById('admin-advisor-list');
    if (!list) return;
    if (!Array.isArray(db.advisors) || db.advisors.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-400 italic">Belum ada dosen pembina.</p>`;
        return;
    }
    list.innerHTML = db.advisors.map((a, idx) => {
        const isExpanded = expandedAdminAdvisorIds.has(a.id);

        const headerHTML = `
            <button type="button" onclick="toggleAdminAdvisorExpand(${a.id})"
                class="flex-1 flex items-center gap-3 text-left min-w-0">
                ${safeImage(advisorAvatarUrl(a), a.name, 'w-12 h-12 rounded-2xl flex-shrink-0')}
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 truncate">${a.name || '(Tanpa Nama)'}</p>
                    <p class="text-[11px] text-indigo-600 truncate font-bold">${a.title || 'Dosen Pembina'}</p>
                </div>
                ${a.expertise ? `<span class="hidden sm:inline text-[10px] font-bold text-slate-500 truncate max-w-[12rem] flex-shrink-0">${a.expertise}</span>` : ''}
                <span class="hidden sm:inline text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md bg-slate-100 flex-shrink-0">#${idx + 1}</span>
                ${expandChevron(isExpanded)}
            </button>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="event.stopPropagation(); dndMove('advisors', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Naikkan">↑</button>
                <button onclick="event.stopPropagation(); dndMove('advisors', ${idx}, 1)" ${idx === db.advisors.length - 1 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === db.advisors.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Turunkan">↓</button>
                <button onclick="event.stopPropagation(); deleteAdvisor(${idx})" class="text-red-500 text-xs font-bold whitespace-nowrap pl-1">Hapus</button>
            </div>`;

        const bodyHTML = !isExpanded ? '' : `
            <div class="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-200 space-y-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                    <input type="text" value="${a.name}" placeholder="Dr. Nama Lengkap, M.Kom."
                        onchange="updateAdvisor(${idx}, 'name', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm font-bold">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan</label>
                        <input type="text" value="${a.title || ''}" placeholder="Pembina Utama"
                            onchange="updateAdvisor(${idx}, 'title', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bidang Keahlian</label>
                        <input type="text" value="${a.expertise || ''}" placeholder="Game Engineering"
                            onchange="updateAdvisor(${idx}, 'expertise', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Foto (opsional)</label>
                    <input type="text" value="${a.photo || ''}" placeholder="https://..."
                        onchange="updateAdvisor(${idx}, 'photo', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
            </div>`;

        return `
            <div class="dnd-row flex items-stretch gap-3" data-dnd-key="advisors" data-dnd-idx="${idx}">
                ${dndHandle()}
                <div class="dnd-card flex-1 min-w-0 bg-slate-50 rounded-2xl border border-slate-200 transition">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        ${headerHTML}
                    </div>
                    ${bodyHTML}
                </div>
            </div>`;
    }).join('');
    dndAttach(list);
}
registerReorderable('advisors', () => db.advisors, renderAdminAdvisors);

function updateAdvisor(idx, field, val) {
    if (!Array.isArray(db.advisors) || !db.advisors[idx]) return;
    db.advisors[idx][field] = val;
    // In-memory only — admin commits via Dosen Pembina Update button.
}

async function addAdvisor() {
    const name = await showPrompt('Masukkan nama lengkap dosen pembina baru.', {
        title: 'Tambah Dosen Pembina', placeholder: 'Dr. Nama Lengkap, M.Kom.', okLabel: 'Tambah'
    });
    if (!name) return;
    if (!Array.isArray(db.advisors)) db.advisors = [];
    const newAdvisor = { id: Date.now(), name, title: 'Dosen Pembina', expertise: '', photo: '' };
    db.advisors.push(newAdvisor);
    expandedAdminAdvisorIds.add(newAdvisor.id);
    renderAdminAdvisors();
}

async function deleteAdvisor(idx) {
    const a = db.advisors[idx];
    if (!a) return;
    const ok = await showConfirm(`Hapus dosen pembina "${a.name}"?`, {
        title: 'Hapus Dosen Pembina?', danger: true, okLabel: 'Hapus', cancelLabel: 'Batal'
    });
    if (!ok) return;
    db.advisors.splice(idx, 1);
    renderAdminAdvisors();
}

function updateMember(idx, field, val) {
    db.members[idx][field] = val;
    // In-memory only — admin commits via Anggota Update button.
}

async function addMember() {
    const name = await showPrompt('Masukkan nama anggota yang akan ditambahkan.', {
        title: 'Tambah Anggota', placeholder: 'Nama lengkap', okLabel: 'Tambah'
    });
    if (!name) return;
    const defaultDiv = db.divisions[0]?.id || "";
    db.members.push({ id: Date.now(), name, role: "Anggota", divisionId: defaultDiv, photo: "" });
    renderAdminMembers();
    renderAdminDivisions();
}

async function deleteMember(idx) {
    const m = db.members[idx];
    const ok = await showConfirm(`Anggota "${m.name}" akan dihapus dari daftar.`, {
        title: 'Hapus Anggota?', danger: true, okLabel: 'Hapus', cancelLabel: 'Batal'
    });
    if (!ok) return;
    db.members.splice(idx, 1);
    renderAdminMembers();
    renderAdminDivisions();
}

// --- ADMIN: NEWS ---
function renderAdminNews() {
    const list = document.getElementById('admin-news-list');
    if (!list) return;
    if (db.news.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-400 italic">Belum ada berita.</p>`;
        return;
    }
    list.innerHTML = db.news.map((n, idx) => {
        const isExpanded = expandedAdminNewsIds.has(n.id);
        const headerHTML = `
            <button type="button" onclick="toggleAdminNewsExpand(${n.id})"
                class="flex-1 flex items-center gap-3 text-left min-w-0">
                ${safeImage(n.img, n.title, 'w-12 h-12 rounded-xl flex-shrink-0')}
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 truncate">${n.title || '(Tanpa judul)'}</p>
                    <p class="text-[11px] text-slate-400 truncate">
                        ${n.tag || 'Tanpa tag'}${!n.img ? ' · belum ada gambar' : ''}
                    </p>
                </div>
                <span class="hidden sm:inline text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md bg-slate-100 flex-shrink-0">#${idx + 1}</span>
                ${expandChevron(isExpanded)}
            </button>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="event.stopPropagation(); dndMove('news', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Naikkan">↑</button>
                <button onclick="event.stopPropagation(); dndMove('news', ${idx}, 1)" ${idx === db.news.length - 1 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === db.news.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Turunkan">↓</button>
                <button onclick="event.stopPropagation(); deleteNews(${idx})" class="text-red-500 text-xs font-bold whitespace-nowrap pl-1">Hapus</button>
            </div>`;

        const bodyHTML = !isExpanded ? '' : `
            <div class="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-200 space-y-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul</label>
                    <input type="text" value="${n.title}" placeholder="Judul Berita"
                        onchange="updateNews(${idx}, 'title', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm font-bold">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tag / Kategori</label>
                        <input type="text" value="${n.tag || ''}" placeholder="Prestasi, Event, ..."
                            onchange="updateNews(${idx}, 'tag', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Gambar</label>
                        <input type="text" value="${n.img || ''}" placeholder="https://..."
                            onchange="updateNews(${idx}, 'img', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penulis</label>
                        <input type="text" value="${n.author || ''}" placeholder="Tim Redaksi HIMA"
                            onchange="updateNews(${idx}, 'author', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Publikasi</label>
                        <input type="date" value="${n.publishedAt || ''}"
                            onchange="updateNews(${idx}, 'publishedAt', this.value)"
                            class="w-full p-2 rounded-lg border bg-white text-sm">
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Isi Artikel</label>
                    <textarea rows="8" placeholder="Tulis artikel di sini... Pisahkan paragraf dengan baris kosong."
                        onchange="updateNews(${idx}, 'body', this.value)"
                        class="w-full p-3 rounded-lg border bg-white text-sm leading-relaxed resize-y">${n.body || ''}</textarea>
                    <p class="text-[10px] text-slate-400 mt-1">Pisahkan tiap paragraf dengan satu baris kosong agar tampil rapi di halaman detail.</p>
                </div>
            </div>`;

        return `
            <div class="dnd-row flex items-stretch gap-3" data-dnd-key="news" data-dnd-idx="${idx}">
                ${dndHandle()}
                <div class="dnd-card flex-1 min-w-0 bg-slate-50 rounded-2xl border border-slate-200 transition">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        ${headerHTML}
                    </div>
                    ${bodyHTML}
                </div>
            </div>`;
    }).join('');
    dndAttach(list);
}
registerReorderable('news', () => db.news, renderAdminNews);

function updateNews(idx, field, val) {
    db.news[idx][field] = val;
    // In-memory only — admin commits via Berita Update button.
}

async function addNews() {
    const title = await showPrompt('Beri judul untuk berita baru. Detail tag dan gambar bisa diisi setelahnya.', {
        title: 'Tambah Berita', placeholder: 'Judul berita', okLabel: 'Tambah'
    });
    if (!title) return;
    db.news.unshift({ id: Date.now(), title, tag: "Berita", img: "" });
    newsPage = 0;
    renderAdminNews();
}

async function deleteNews(idx) {
    const n = db.news[idx];
    const ok = await showConfirm(`Berita "${n.title}" akan dihapus dari beranda.`, {
        title: 'Hapus Berita?', danger: true, okLabel: 'Hapus', cancelLabel: 'Batal'
    });
    if (!ok) return;
    db.news.splice(idx, 1);
    renderAdminNews();
}

// --- ADMIN: GAMES ---
function renderAdminGameCategories() {
    const list = document.getElementById('admin-game-category-list');
    if (!list) return;
    if (db.gameCategories.length === 0) {
        list.innerHTML = `
            <div class="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p class="text-sm font-bold text-slate-500">Belum ada kategori game.</p>
                <p class="text-xs text-slate-400 mt-1">Tambah kategori untuk mengelompokkan game di publikasi.</p>
            </div>`;
        return;
    }
    list.innerHTML = db.gameCategories.map((cat, idx) => {
        const usage = db.games.filter(g => g.categoryId === cat.id).length;
        return `
            <div class="dnd-row flex items-stretch gap-2" data-dnd-key="gameCategories" data-dnd-idx="${idx}">
                ${dndHandle()}
                <div class="dnd-card flex-1 flex flex-wrap items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition">
                    <!-- Inline-editable name takes full available width. -->
                    <input type="text" value="${cat.name}" onchange="updateGameCategory(${idx}, 'name', this.value)"
                        placeholder="Nama kategori"
                        class="flex-1 min-w-[8rem] px-3 py-2 rounded-lg bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-extrabold text-slate-800 transition">

                    <!-- Toolbar: usage count + reorder + delete grouped on the right. -->
                    <div class="flex items-center gap-1 flex-shrink-0 ml-auto">
                        <span class="text-[11px] font-bold text-slate-400 whitespace-nowrap pr-2">
                            ${usage} game
                        </span>
                        <button onclick="dndMove('gameCategories', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                            class="w-8 h-8 rounded-lg text-slate-500 transition ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 hover:text-slate-800'}"
                            title="Naikkan">↑</button>
                        <button onclick="dndMove('gameCategories', ${idx}, 1)" ${idx === db.gameCategories.length - 1 ? 'disabled' : ''}
                            class="w-8 h-8 rounded-lg text-slate-500 transition ${idx === db.gameCategories.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 hover:text-slate-800'}"
                            title="Turunkan">↓</button>
                        <span class="w-px h-6 bg-slate-200 mx-1"></span>
                        <button onclick="deleteGameCategory(${idx})"
                            class="w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Hapus">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join('');
    dndAttach(list);
}
registerReorderable('gameCategories', () => db.gameCategories, renderAdminGameCategories);

function updateGameCategory(idx, field, val) {
    db.gameCategories[idx][field] = val;
    // In-memory only — admin commits via Kategori Game Update button.
    renderAdminGames();
}

async function addGameCategory() {
    const name = await showPrompt('Beri nama kategori game baru.', {
        title: 'Tambah Kategori Game', placeholder: 'Misal: RPG, Kasual', okLabel: 'Tambah'
    });
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
    if (db.gameCategories.some(c => c.id === id)) {
        await showAlert('Kategori dengan ID serupa sudah ada. Pakai nama lain.', { icon: 'warn', title: 'Tidak Bisa Ditambahkan' });
        return;
    }
    db.gameCategories.push({ id, name });
    renderAdminGameCategories();
    renderAdminGames();
}

async function deleteGameCategory(idx) {
    const cat = db.gameCategories[idx];
    if (!cat) return;
    const inUse = db.games.filter(g => g.categoryId === cat.id).length;
    const msg = inUse
        ? `Kategori "${cat.name}" akan dihapus. ${inUse} game di kategori ini akan menjadi tanpa kategori.`
        : `Kategori "${cat.name}" akan dihapus.`;
    const ok = await showConfirm(msg, { title: 'Hapus Kategori?', danger: true, okLabel: 'Hapus' });
    if (!ok) return;
    db.gameCategories.splice(idx, 1);
    db.games = db.games.map(g => g.categoryId === cat.id ? { ...g, categoryId: '' } : g);
    renderAdminGameCategories();
    renderAdminGames();
}

function renderAdminGames() {
    const list = document.getElementById('admin-game-list');
    if (!list) return;
    if (db.games.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-400 italic">Belum ada game terdaftar.</p>`;
        return;
    }
    list.innerHTML = db.games.map((g, idx) => {
        const isExpanded = expandedAdminGameIds.has(g.id);
        const cat = getGameCategory(g.categoryId);

        // The compact summary header is always visible. The full edit form
        // is only rendered when the row is expanded — keeps the list scannable.
        const headerHTML = `
            <button type="button" onclick="toggleAdminGameExpand(${g.id})"
                class="flex-1 min-w-0 flex items-center gap-3 text-left">
                ${safeImage(g.icon, g.title, 'w-12 h-12 rounded-xl flex-shrink-0')}
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 truncate">${g.title || '(Tanpa judul)'}</p>
                    <p class="text-[11px] text-slate-400 truncate">
                        ${cat ? cat.name : 'Tanpa kategori'} · ${g.developer || 'Developer ?'}
                    </p>
                </div>
                <div class="hidden sm:flex items-center gap-1.5 flex-shrink-0 text-[10px] font-bold text-slate-500">
                    ${(g.platforms || []).length ? renderPlatformBadges(g.platforms, 12) : ''}
                </div>
                <span class="hidden sm:inline text-[10px] font-bold text-slate-400 px-2 py-1 rounded-md bg-slate-100 flex-shrink-0">#${idx + 1}</span>
                <svg xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </button>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="event.stopPropagation(); dndMove('games', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === 0 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Naikkan">↑</button>
                <button onclick="event.stopPropagation(); dndMove('games', ${idx}, 1)" ${idx === db.games.length - 1 ? 'disabled' : ''}
                    class="w-7 h-7 rounded-lg border text-xs font-bold transition ${idx === db.games.length - 1 ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}"
                    title="Turunkan">↓</button>
                <button onclick="event.stopPropagation(); deleteGame(${idx})" class="text-red-500 text-xs font-bold whitespace-nowrap pl-1">Hapus</button>
            </div>`;

        const bodyHTML = !isExpanded ? '' : renderAdminGameBody(g, idx);

        return `
            <div class="dnd-row flex items-stretch gap-3" data-dnd-key="games" data-dnd-idx="${idx}">
                ${dndHandle()}
                <div class="dnd-card flex-1 min-w-0 bg-slate-50 rounded-2xl border border-slate-200 transition">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        ${headerHTML}
                    </div>
                    ${bodyHTML}
                </div>
            </div>`;
    }).join('');
    dndAttach(list);
}

// Full edit form for one game. Extracted as a helper so renderAdminGames
// stays readable, and so we only build this DOM when the row is expanded.
function renderAdminGameBody(g, idx) {
    const catOpts = [
        `<option value="" ${!g.categoryId ? 'selected' : ''}>— Tanpa Kategori —</option>`,
        ...db.gameCategories.map(c => `<option value="${c.id}" ${c.id === g.categoryId ? 'selected' : ''}>${c.name}</option>`)
    ].join('');
    const screenshots = (g.screenshots || []).map((src, si) => `
        <div class="screenshot-thumb aspect-video">
            ${safeImage(src, '', 'w-full h-full')}
            <span class="order-badge">#${si + 1}</span>
            <button type="button" class="remove-btn" onclick="deleteGameScreenshot(${idx}, ${si})" title="Hapus">×</button>
        </div>
    `).join('');

    return `
        <div class="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-200 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul</label>
                    <input type="text" value="${g.title}" onchange="updateGame(${idx}, 'title', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm font-bold">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developer</label>
                    <input type="text" value="${g.developer || ''}" onchange="updateGame(${idx}, 'developer', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
            </div>

            <div class="grid grid-cols-1 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tagline</label>
                    <input type="text" value="${g.tagline || ''}" placeholder="Kalimat pendek..."
                        onchange="updateGame(${idx}, 'tagline', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi</label>
                    <textarea rows="2" placeholder="Ceritakan tentang game ini..."
                        onchange="updateGame(${idx}, 'description', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">${g.description || ''}</textarea>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
                    <select onchange="updateGame(${idx}, 'categoryId', this.value)" class="w-full p-2 rounded-lg border bg-white text-sm">${catOpts}</select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tautan Install</label>
                    <input type="text" value="${g.link || ''}" placeholder="https://play.google.com/..."
                        onchange="updateGame(${idx}, 'link', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</label>
                    <input type="number" min="0" max="5" step="0.1" value="${g.rating || 0}"
                        onchange="updateGame(${idx}, 'rating', parseFloat(this.value) || 0)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Install</label>
                    <input type="number" min="0" value="${g.downloads || 0}"
                        onchange="updateGame(${idx}, 'downloads', parseInt(this.value) || 0)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ukuran</label>
                    <input type="text" value="${g.size || ''}" placeholder="120 MB"
                        onchange="updateGame(${idx}, 'size', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versi</label>
                    <input type="text" value="${g.version || ''}" placeholder="1.0.0"
                        onchange="updateGame(${idx}, 'version', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
            </div>

            <div class="grid grid-cols-1 gap-2">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Icon</label>
                    <input type="text" value="${g.icon || ''}" placeholder="https://..."
                        onchange="updateGame(${idx}, 'icon', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Banner</label>
                    <input type="text" value="${g.banner || ''}" placeholder="https://..."
                        onchange="updateGame(${idx}, 'banner', this.value)"
                        class="w-full p-2 rounded-lg border bg-white text-sm">
                </div>
                <label class="flex items-center gap-2 mt-1">
                    <input type="checkbox" ${g.featured ? 'checked' : ''}
                        onchange="updateGame(${idx}, 'featured', this.checked)"
                        class="w-4 h-4 rounded">
                    <span class="text-xs font-bold text-slate-600">Tampilkan di Editor's Pick</span>
                </label>
            </div>

            <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Tersedia</label>
                <div class="flex flex-wrap gap-2 mt-1">
                    ${GAME_PLATFORMS.map(p => {
                        const checked = (g.platforms || []).includes(p.id);
                        return `<label class="cursor-pointer">
                            <input type="checkbox" class="peer sr-only"
                                ${checked ? 'checked' : ''}
                                onchange="toggleGamePlatform(${idx}, '${p.id}', this.checked)">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition
                                bg-white text-slate-600 border-slate-200 hover:border-slate-400
                                peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600">
                                <span style="width:14px;height:14px" class="inline-flex items-center">${p.icon}</span>
                                ${p.label}
                            </span>
                        </label>`;
                    }).join('')}
                </div>
            </div>

            <div>
                <div class="flex justify-between items-center mb-2">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Screenshots</label>
                    <span class="text-[11px] text-slate-400">${(g.screenshots || []).length} file</span>
                </div>
                <div class="screenshot-dropzone rounded-2xl p-5 text-center cursor-pointer"
                    ondragover="gameDropzoneOver(event, ${idx})"
                    ondragleave="gameDropzoneLeave(event)"
                    ondrop="gameDropzoneDrop(event, ${idx})"
                    onclick="gameDropzonePick(${idx})">
                    <div class="flex flex-col items-center gap-1.5 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.84-1.9A4.5 4.5 0 0118 16H7zm5-9v9m0 0l-3-3m3 3l3-3"/></svg>
                        <p class="text-sm font-bold text-slate-700">Tarik file gambar ke sini</p>
                        <p class="text-[11px] text-slate-400">atau klik untuk memilih dari komputer · max 5MB · multi-select didukung</p>
                    </div>
                    <input id="game-screenshot-input-${idx}" type="file" accept="image/*" multiple
                        class="hidden" onchange="gameDropzoneFileChange(${idx}, this)">
                </div>
                ${screenshots
                    ? `<div class="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">${screenshots}</div>`
                    : `<p class="mt-2 text-xs text-slate-400 italic">Belum ada screenshot.</p>`}
            </div>
        </div>`;
}
registerReorderable('games', () => db.games, renderAdminGames);

function updateGame(idx, field, val) {
    db.games[idx][field] = val;
    // In-memory only — admin commits via Games Update button.
}

// Add or remove a platform id from a game's platforms[] without re-rendering
// the whole admin list (avoids losing focus while user clicks chips quickly).
function toggleGamePlatform(idx, platformId, checked) {
    const game = db.games[idx];
    if (!game) return;
    if (!Array.isArray(game.platforms)) game.platforms = [];
    const has = game.platforms.includes(platformId);
    if (checked && !has) game.platforms.push(platformId);
    else if (!checked && has) game.platforms = game.platforms.filter(p => p !== platformId);
}

function updateGameScreenshot(idx, si, val) {
    db.games[idx].screenshots[si] = val;
}

function addGameScreenshot(idx) {
    if (!Array.isArray(db.games[idx].screenshots)) db.games[idx].screenshots = [];
    db.games[idx].screenshots.push('');
    renderAdminGames();
}

function deleteGameScreenshot(idx, si) {
    db.games[idx].screenshots.splice(si, 1);
    renderAdminGames();
}

// --- Game screenshots: file-based input -----------------------------------
// Convert a File into a data: URL so it can be embedded in localStorage and
// rendered via <img src="...">. Limited to images and a soft 5MB cap to keep
// localStorage usage sane.
const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) return reject(new Error(`"${file.name}" bukan file gambar.`));
        if (file.size > SCREENSHOT_MAX_BYTES) return reject(new Error(`"${file.name}" lebih dari 5MB.`));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Gagal membaca file.'));
        reader.readAsDataURL(file);
    });
}

async function addGameScreenshotFiles(idx, fileList) {
    if (!fileList || fileList.length === 0) return;
    const game = db.games[idx];
    if (!game) return;
    if (!Array.isArray(game.screenshots)) game.screenshots = [];

    const errors = [];
    const accepted = [];
    for (const f of Array.from(fileList)) {
        try {
            const dataUrl = await readFileAsDataURL(f);
            accepted.push(dataUrl);
        } catch (err) {
            errors.push(err.message || String(err));
        }
    }
    if (accepted.length) {
        game.screenshots.push(...accepted);
        // In-memory only — admin commits via Games Update button. The button's
        // commit handler surfaces a quota-exceeded error if storage is full.
        renderAdminGames();
    }
    if (errors.length) {
        await showAlert(errors.join('\n'), { title: 'Beberapa file dilewati', icon: 'warn' });
    }
}

// Wired via inline ondrop handlers in the rendered HTML.
function gameDropzoneOver(e, idx) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('is-dragover');
}
function gameDropzoneLeave(e) {
    e.currentTarget.classList.remove('is-dragover');
}
function gameDropzoneDrop(e, idx) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('is-dragover');
    const files = e.dataTransfer && e.dataTransfer.files;
    addGameScreenshotFiles(idx, files);
}
function gameDropzonePick(idx) {
    document.getElementById(`game-screenshot-input-${idx}`)?.click();
}
function gameDropzoneFileChange(idx, input) {
    addGameScreenshotFiles(idx, input.files);
    input.value = ''; // allow picking the same file again
}

async function addGame() {
    const title = await showPrompt('Beri judul untuk game baru. Detail lain bisa diisi setelahnya.', {
        title: 'Tambah Game', placeholder: 'Judul game', okLabel: 'Tambah'
    });
    if (!title) return;
    const defaultCat = db.gameCategories[0]?.id || '';
    db.games.unshift({
        id: Date.now(),
        title, developer: '', categoryId: defaultCat,
        tagline: '', description: '',
        icon: '', banner: '', screenshots: [],
        rating: 0, downloads: 0, size: '', version: '',
        platforms: [],
        featured: false, link: ''
    });
    renderAdminGames();
}

async function deleteGame(idx) {
    const g = db.games[idx];
    const ok = await showConfirm(`Game "${g.title}" akan dihapus dari publikasi.`, {
        title: 'Hapus Game?', danger: true, okLabel: 'Hapus'
    });
    if (!ok) return;
    db.games.splice(idx, 1);
    renderAdminGames();
}
