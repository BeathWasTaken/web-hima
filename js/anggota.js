function renderAdvisors() {
    const cont = document.getElementById('anggota-advisors');
    if (!cont) return;
    const list = db.advisors || [];
    if (list.length === 0) {
        cont.innerHTML = '';
        return;
    }
    // Compact 1–3 column grid; advisors are usually few.
    const cols = list.length === 1 ? 'md:grid-cols-1 md:max-w-md md:mx-auto'
              : list.length === 2 ? 'md:grid-cols-2'
                                  : 'md:grid-cols-3';
    cont.innerHTML = `
        <div class="flex items-end justify-between mb-5">
            <div class="space-y-1">
                <h3 class="text-2xl font-extrabold text-slate-800">Dosen Pembina</h3>
            </div>
            <p class="text-[10px] font-bold tracking-widest uppercase text-slate-400 hidden sm:block">${list.length} Pembina</p>
        </div>
        <div class="grid grid-cols-1 ${cols} gap-4">
            ${list.map(a => `
                <div class="reveal flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition">
                    <div class="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden ring-4 ring-indigo-50">
                        ${safeImage(advisorAvatarUrl(a), a.name, 'w-full h-full')}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="font-extrabold text-slate-800 truncate">${a.name || '(Tanpa Nama)'}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="border-t border-slate-200 mt-10"></div>`;
}

function renderAnggota() {
    // Edit Konten Admin badge visibility
    const adminBadge = document.getElementById('anggota-admin-badge');
    if (adminBadge) {
        adminBadge.classList.toggle('hidden', !(currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')));
    }

    // Faculty advisors (above the filter chips)
    renderAdvisors();

    // Filter chips
    const filterCont = document.getElementById('anggota-filters');
    if (filterCont) {
        const allActive = activeDivisionFilter === 'all';
        const chips = [
            `<button onclick="setDivisionFilter('all')" class="px-4 py-3 rounded-xl text-xs font-bold transition border ${allActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}">
                Semua <span class="ml-1 opacity-60">${db.members.length}</span>
            </button>`,
            ...db.divisions.map(div => {
                const t = divisionTone(div.color);
                const active = activeDivisionFilter === div.id;
                const count = db.members.filter(m => m.divisionId === div.id).length;
                return `<button onclick="setDivisionFilter('${div.id}')" class="px-4 py-3 rounded-xl text-xs font-bold transition border flex items-center gap-2 ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}">
                    ${div.name}
                    <span class="opacity-60">${count}</span>
                </button>`;
            })
        ].join('');
        filterCont.innerHTML = chips;
    }

    // Member grid
    const grid = document.getElementById('anggota-grid');
    if (!grid) return;

    const list = activeDivisionFilter === 'all'
        ? db.members
        : db.members.filter(m => m.divisionId === activeDivisionFilter);

    if (list.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                <p class="text-sm font-bold text-slate-500">Belum ada anggota di kategori ini.</p>
                <p class="text-xs text-slate-400 mt-1">Tambahkan via panel Admin.</p>
            </div>`;
        return;
    }

    grid.innerHTML = list.map((m, i) => {
        const div = getDivision(m.divisionId);
        const t = div ? divisionTone(div.color) : divisionTone('#475569');
        return `
            <div class="reveal bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all" data-reveal-delay="${(i % 4) * 60}">
                <div class="w-24 h-24 mx-auto mb-5 rounded-2xl" style="${t.ring}">
                    ${safeImage(memberAvatarUrl(m), m.name, 'w-full h-full rounded-2xl')}
                </div>
                <p class="text-center font-extrabold text-slate-800">${m.name}</p>
                <p class="text-center text-xs text-slate-500 font-medium mt-1">${m.role || '-'}</p>
                <div class="mt-4 flex justify-center">
                    <span class="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full" style="${t.grey}">
                        ${div ? div.name : 'Tanpa Divisi'}
                    </span>
                </div>
            </div>`;
    }).join('');
    bindScrollReveals();
}

function setDivisionFilter(id) {
    activeDivisionFilter = id;
    renderAnggota();
}
