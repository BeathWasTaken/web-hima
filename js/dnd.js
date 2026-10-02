// --- GENERIC DRAG-AND-DROP REORDER ----------------------------------------
// Reusable across admin lists (news, members, divisions, misi).
// Declared up here (before any render functions) so that
// `registerReorderable(...)` calls colocated with each renderer don't hit a
// temporal-dead-zone error.
//
// Usage:
//   1) Wrap each row in <div class="dnd-row" data-dnd-key="news" data-dnd-idx="${i}">
//        <div class="dnd-handle" draggable="true">…</div>
//        <div class="dnd-card">…content…</div>
//      </div>
//   2) Register the array+rerender via registerReorderable('news', () => db.news, renderAdminNews)
//   3) Call dndAttach(rootEl) once after rendering each list (the helper installs
//      delegated handlers so we don't re-bind per row).
const REORDER_REGISTRY = {};
function registerReorderable(key, getArray, rerender) {
    REORDER_REGISTRY[key] = { getArray, rerender };
}

let dndState = { key: null, fromIdx: null, autoScrollRAF: null, lastY: 0 };

function dndAutoScrollTick() {
    if (dndState.key === null) { dndState.autoScrollRAF = null; return; }
    const margin = 80, maxSpeed = 18, vh = window.innerHeight;
    let delta = 0;
    if (dndState.lastY < margin) delta = -maxSpeed * (margin - dndState.lastY) / margin;
    else if (dndState.lastY > vh - margin) delta = maxSpeed * (dndState.lastY - (vh - margin)) / margin;
    if (delta !== 0) window.scrollBy(0, delta);
    dndState.autoScrollRAF = requestAnimationFrame(dndAutoScrollTick);
}
function dndTrackPointer(e) { dndState.lastY = e.clientY; }

function clearDndHints() {
    document.querySelectorAll('.dnd-card').forEach(el => {
        el.classList.remove('border-t-2', 'border-b-2', 'border-t-indigo-500', 'border-b-indigo-500');
    });
}

// One-time installer for a freshly rendered list. Uses event delegation so
// dynamic content stays compatible.
function dndAttach(rootEl) {
    if (!rootEl || rootEl.dataset.dndBound === '1') return;
    rootEl.dataset.dndBound = '1';

    rootEl.addEventListener('dragstart', (e) => {
        const handle = e.target.closest('.dnd-handle');
        if (!handle) return;
        const row = handle.closest('.dnd-row');
        if (!row) return;
        dndState.key = row.dataset.dndKey;
        dndState.fromIdx = parseInt(row.dataset.dndIdx, 10);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(dndState.fromIdx)); } catch (_) {}
        row.classList.add('opacity-40');

        document.addEventListener('dragover', dndTrackPointer);
        if (!dndState.autoScrollRAF) dndState.autoScrollRAF = requestAnimationFrame(dndAutoScrollTick);
    });

    rootEl.addEventListener('dragover', (e) => {
        const card = e.target.closest('.dnd-card');
        if (!card || dndState.fromIdx === null) return;
        const row = card.closest('.dnd-row');
        if (!row || row.dataset.dndKey !== dndState.key) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const idx = parseInt(row.dataset.dndIdx, 10);
        if (idx === dndState.fromIdx) return;

        const rect = card.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        clearDndHints();
        card.classList.add(before ? 'border-t-2' : 'border-b-2', before ? 'border-t-indigo-500' : 'border-b-indigo-500');
    });

    rootEl.addEventListener('dragleave', (e) => {
        const card = e.target.closest('.dnd-card');
        if (card) card.classList.remove('border-t-2', 'border-b-2', 'border-t-indigo-500', 'border-b-indigo-500');
    });

    rootEl.addEventListener('drop', (e) => {
        const card = e.target.closest('.dnd-card');
        if (!card || dndState.fromIdx === null) return;
        const row = card.closest('.dnd-row');
        if (!row || row.dataset.dndKey !== dndState.key) return;
        e.preventDefault();

        const targetIdx = parseInt(row.dataset.dndIdx, 10);
        const rect = card.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;

        let insertAt = before ? targetIdx : targetIdx + 1;
        if (dndState.fromIdx < insertAt) insertAt -= 1;

        if (dndState.fromIdx !== targetIdx) {
            const reg = REORDER_REGISTRY[dndState.key];
            if (reg) {
                const arr = reg.getArray();
                const [moved] = arr.splice(dndState.fromIdx, 1);
                arr.splice(insertAt, 0, moved);
                // No persist here — admin must hit the section's Update button
                // to commit reorder changes.
                reg.rerender();
            }
        }
        clearDndHints();
        dndState.key = null;
        dndState.fromIdx = null;
    });

    rootEl.addEventListener('dragend', () => {
        rootEl.querySelectorAll('.dnd-row').forEach(r => r.classList.remove('opacity-40'));
        clearDndHints();
        dndState.key = null;
        dndState.fromIdx = null;
        document.removeEventListener('dragover', dndTrackPointer);
        if (dndState.autoScrollRAF) {
            cancelAnimationFrame(dndState.autoScrollRAF);
            dndState.autoScrollRAF = null;
        }
    });
}

// Reusable HTML for the side handle.
function dndHandle() {
    return `
        <div class="dnd-handle flex-shrink-0 w-7 rounded-2xl bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center cursor-grab active:cursor-grabbing transition select-none"
             draggable="true" title="Tarik untuk mengubah urutan">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
        </div>`;
}

// Generic up/down move (used by buttons inside each card).
function dndMove(key, idx, delta) {
    const reg = REORDER_REGISTRY[key];
    if (!reg) return;
    const arr = reg.getArray();
    const target = idx + delta;
    if (target < 0 || target >= arr.length) return;
    const [moved] = arr.splice(idx, 1);
    arr.splice(target, 0, moved);
    // In-memory only — admin must press the section's Update button to save.
    reg.rerender();
}
