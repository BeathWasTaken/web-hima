// --- DEVELOPER MENU ---------------------------------------------------------
// Manage which @mail.mmtc.ac.id accounts get elevated roles (admin/developer).
// All edits flow through `db.userRoles`; changes commit immediately to keep
// behaviour predictable for a security-sensitive surface.

function renderDeveloper() {
    // Hard guard: only role=developer may view this page. Anyone else is
    // bounced to home so there's nothing to hint at the menu's existence.
    if (!currentUser || currentUser.role !== 'developer') {
        navigate('home');
        return;
    }

    const list = document.getElementById('dev-role-list');
    const countEl = document.getElementById('dev-list-count');
    if (!list) return;

    const entries = Object.entries(db.userRoles || {})
        .sort((a, b) => a[0].localeCompare(b[0]));

    if (countEl) countEl.innerText = `${entries.length} akun`;

    if (entries.length === 0) {
        list.innerHTML = `
            <div class="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <p class="text-sm font-bold text-slate-500">Belum ada akun terdaftar.</p>
            </div>`;
        return;
    }

    list.innerHTML = entries.map(([email, role]) => {
        const isBootstrap = isBootstrapDeveloper(email);
        const isCurrent = (currentUser.email || '').toLowerCase() === email;

        // Disable role/delete controls for the bootstrap developer so the
        // seeded account can never be locked out.
        const lockedReason = isBootstrap
            ? 'Akun developer utama tidak bisa diubah.'
            : (isCurrent ? 'Tidak bisa mengubah akun yang sedang login.' : '');
        const locked = !!lockedReason;

        const isDev = role === 'developer';
        const toneCls = isDev
            ? 'bg-fuchsia-50 text-fuchsia-700'
            : 'bg-indigo-50 text-indigo-700';

        return `
            <div class="flex flex-wrap items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition">
                <!-- Avatar swatch (initial of first segment of email) -->
                <span class="w-10 h-10 rounded-xl ${isDev ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-indigo-100 text-indigo-700'} font-extrabold text-sm flex items-center justify-center flex-shrink-0 uppercase">
                    ${(email[0] || '?').toUpperCase()}
                </span>

                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-bold text-slate-800 text-sm truncate font-mono">${email}</p>
                        ${isBootstrap ? '<span class="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Bootstrap</span>' : ''}
                        ${isCurrent && !isBootstrap ? '<span class="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Anda</span>' : ''}
                    </div>
                    ${lockedReason ? `<p class="text-[10px] text-slate-400 mt-0.5">${lockedReason}</p>` : ''}
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">

                    <!-- Role Dropdown -->
                    <div class="relative role-user-dropdown">

                        <button
                            type="button"
                            ${locked ? 'disabled' : ''}
                            onclick="toggleUserRoleDropdown(this)"
                            class="min-w-[130px] flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent ${toneCls} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                            <span class="role-label">
                                ${isDev ? 'Developer' : 'Administrator'}
                            </span>

                            <svg
                                class="role-arrow w-3.5 h-3.5 opacity-60 transition-transform duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="m6 9 6 6 6-6"
                                />
                            </svg>
                        </button>

                        <!-- Menu -->
                        <div class="role-user-menu hidden absolute right-0 z-50 mt-2 w-[150px] p-1.5 bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/60">

                            <button
                                type="button"
                                onclick="changeUserRole(this, '${email.replace(/'/g, "\\'")}', 'admin')"
                                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                            >
                                <span>Administrator</span>

                                <svg
                                    class="${role === 'admin' ? '' : 'hidden'} w-3.5 h-3.5 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="m5 12 4 4L19 7"
                                    />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onclick="changeUserRole(this, '${email.replace(/'/g, "\\'")}', 'developer')"
                                class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 transition"
                            >
                                <span>Developer</span>

                                <svg
                                    class="${role === 'developer' ? '' : 'hidden'} w-3.5 h-3.5 text-fuchsia-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="m5 12 4 4L19 7"
                                    />
                                </svg>
                            </button>

                        </div>
                    </div>

                    <!-- Delete -->
                    <button
                        onclick="deleteUserRole('${email.replace(/'/g, "\\'")}')"
                        ${locked ? 'disabled' : ''}
                        class="w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
                        title="Hapus"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
                        </svg>
                    </button>

                </div>
            </div>`;
    }).join('');
}

// Add a new email → role binding. Validates kampus domain + uniqueness, then
// commits immediately. Default role is admin; user can change it via select.
async function addUserRole() {
    const emailInput = document.getElementById('dev-new-email');
    const roleSelect = document.getElementById('dev-new-role');
    if (!emailInput || !roleSelect) return;

    const email = (emailInput.value || '').trim().toLowerCase();
    const role = roleSelect.value;

    if (!email) {
        await showAlert('Masukkan email yang ingin diberi akses.', { title: 'Email Kosong', icon: 'warn' });
        return;
    }
    if (!email.endsWith(ALLOWED_LOGIN_DOMAIN)) {
        await showAlert(`Email harus berakhiran ${ALLOWED_LOGIN_DOMAIN}.`, {
            title: 'Domain Tidak Valid', icon: 'warn'
        });
        return;
    }
    if (db.userRoles && db.userRoles[email]) {
        await showAlert('Email tersebut sudah terdaftar. Ubah role-nya lewat dropdown di daftar bawah.', {
            title: 'Sudah Terdaftar', icon: 'warn'
        });
        return;
    }

    if (!db.userRoles) db.userRoles = {};
    db.userRoles[email] = role;
    persistUserRoles();
    emailInput.value = '';
    renderDeveloper();
    showAlert(`${email} sekarang ${role === 'admin' ? 'Administrator' : 'Developer'}.`, {
        title: 'Akses Ditambahkan', icon: 'success'
    });
}

function setUserRole(email, role) {
    if (!db.userRoles) return;
    if (isBootstrapDeveloper(email)) return; // never demote bootstrap dev

    db.userRoles[email] = role;
    persistUserRoles();
    renderDeveloper();
}

async function deleteUserRole(email) {
    if (isBootstrapDeveloper(email)) return; // protected
    if ((currentUser.email || '').toLowerCase() === email) return; // protect self

    const ok = await showConfirm(`Hapus akses untuk ${email}?`, {
        title: 'Hapus Akses?', danger: true, okLabel: 'Hapus', cancelLabel: 'Batal'
    });
    if (!ok) return;

    if (db.userRoles) delete db.userRoles[email];
    persistUserRoles();
    renderDeveloper();
}

// Single localStorage write helper so role changes are atomic + handle quota.
function persistUserRoles() {
    try {
        localStorage.setItem('hima_super_db', JSON.stringify(db));
    } catch (err) {
        showAlert('Gagal menyimpan perubahan ke browser. Coba bersihkan storage.', {
            title: 'Penyimpanan Penuh', icon: 'warn'
        });
    }
}
