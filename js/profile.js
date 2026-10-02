// --- PROFILE PAGE ---------------------------------------------------------
// Track previous page so closeProfile() can return the user where they came
// from (Home, Anggota, Games, etc.) rather than always sending them to home.
let _profilePreviousPage = 'home';

function renderProfile() {
    // Not signed in → bounce to login. Profile data needs currentUser.
    if (!currentUser) {
        navigate('login');
        return;
    }

    // Remember origin so the back button can restore it.
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id) {
        const prev = activePage.id.replace(/^page-/, '');
        if (prev !== 'profile') _profilePreviousPage = prev;
    }

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    // Avatar: use the stored picture URL, fall back to a generated initials
    // avatar if the user has no picture or if the picture URL fails to load.
    // The error handler is attached BEFORE setting `src` so that a 404 that
    // resolves immediately (cached) still triggers the swap.
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
        const initials = encodeURIComponent((currentUser.name || 'User').trim() || 'User');
        const fallback = `https://ui-avatars.com/api/?name=${initials}&background=4F46E5&color=fff&bold=true&size=200`;
        // Reset state so a re-render starts from a clean slate.
        delete avatarEl.dataset.fallback;
        avatarEl.removeAttribute('loading');           // eager load → onerror fires reliably
        avatarEl.onerror = () => {
            if (avatarEl.dataset.fallback === '1') return;
            avatarEl.dataset.fallback = '1';
            avatarEl.src = fallback;
        };
        // Also catch the case where the request "succeeds" but returns a
        // zero-pixel image (some 3rd-party hosts answer 200 with empty body).
        avatarEl.onload = () => {
            if (!avatarEl.naturalWidth && avatarEl.dataset.fallback !== '1') {
                avatarEl.dataset.fallback = '1';
                avatarEl.src = fallback;
            }
        };
        avatarEl.src = currentUser.picture || fallback;
    }

    setText('profile-name', currentUser.name || 'Pengguna');
    setText('profile-email', currentUser.email || '');

    // Status pill: maps role → human-readable label. Admin and developer
    // both get the elevated star badge on the avatar; visitor does not.
    const isAdmin = currentUser.role === 'admin';
    const isDeveloper = currentUser.role === 'developer';
    const isElevated = isAdmin || isDeveloper;

    let statusLabel = 'Anggota';
    if (isDeveloper) statusLabel = 'Developer';
    else if (isAdmin) statusLabel = 'Administrator';
    else if (currentUser.role === 'visitor') statusLabel = 'Visitor';
    setText('profile-status', statusLabel);

    const badgeEl = document.getElementById('profile-role-badge');
    if (badgeEl) {
        badgeEl.classList.toggle('hidden', !isElevated);
        // Color the badge differently for developer vs admin so it's visible
        // at a glance without checking the status pill.
        badgeEl.classList.toggle('bg-fuchsia-500', isDeveloper);
        badgeEl.classList.toggle('text-white', isDeveloper);
        badgeEl.classList.toggle('bg-amber-400', !isDeveloper);
        badgeEl.classList.toggle('text-amber-900', !isDeveloper);
        // Update the badge label text inside the existing svg-anchored span.
        // We rebuild the inner content so dev gets a different label.
        if (isDeveloper) {
            badgeEl.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>Dev';
        } else {
            badgeEl.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.7l5.9-.9z"/></svg>Admin';
        }
    }

    // Provider: detect from email host. Demo admins use a hardcoded host;
    // anything ending in google domain → Google; otherwise generic Email.
    let provider = 'Email';
    const email = (currentUser.email || '').toLowerCase();
    if (email.includes('@hima.pro')) provider = 'Demo Admin';
    else if (email.endsWith('@gmail.com') || email.endsWith('@google.com')) provider = 'Google';
    setText('profile-provider', provider);

    setText('profile-session', 'Aktif');

    // Show the admin-tools card only for admins.
    // Show the admin-tools card for both admin and developer roles.
    const adminTools = document.getElementById('profile-admin-tools');
    if (adminTools) adminTools.classList.toggle('hidden', !isElevated);
}

function closeProfile() {
    navigate(_profilePreviousPage || 'home');
}
