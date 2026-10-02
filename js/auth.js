// --- AUTH & GOOGLE LOGIC ---

// Only Google accounts under this domain are allowed to sign in. Anyone
// else gets a friendly rejection. Lowercase comparison so capitalisation
// in the JWT email field doesn't matter.
const ALLOWED_LOGIN_DOMAIN = '@mail.mmtc.ac.id';

// Bootstrap developer: hardcoded so the original developer account can never
// be locked out via the Developer Menu UI. Compared lowercase.
const BOOTSTRAP_DEVELOPER_EMAIL = '02524147443@mail.mmtc.ac.id';

// Look up a kampus email's role from the persisted `db.userRoles` map.
// Returns 'visitor' as the default for any kampus account not explicitly
// promoted to admin or developer.
function lookupRole(email) {
    const key = (email || '').toLowerCase();
    if (db && db.userRoles && db.userRoles[key]) return db.userRoles[key];
    return 'visitor';
}

function isBootstrapDeveloper(email) {
    return (email || '').toLowerCase() === BOOTSTRAP_DEVELOPER_EMAIL;
}

function onGoogleSignIn(response) {
    const data = parseJwt(response.credential);
    const email = (data.email || '').toLowerCase();

    // Gate: only kampus emails may sign in. Everyone else is denied access.
    if (!email.endsWith(ALLOWED_LOGIN_DOMAIN)) {
        showAlert(
            `Login dibatasi untuk akun ${ALLOWED_LOGIN_DOMAIN}. Akun yang kamu pakai tidak diizinkan masuk ke portal ini.`,
            { title: 'Akses Ditolak', icon: 'warn', okLabel: 'Mengerti' }
        );
        return;
    }

    // Resolve role from the userRoles map. Bootstrap developer is always
    // 'developer' regardless of what the map says.
    const role = isBootstrapDeveloper(email) ? 'developer' : lookupRole(email);

    currentUser = {
        name: data.name,
        email: data.email,
        picture: data.picture,
        role
    };
    sessionStorage.setItem('hima_user', JSON.stringify(currentUser));
    navigate('home');
}

function logout() {
    sessionStorage.removeItem('hima_user');
    currentUser = null;
    location.reload();
}

// Generate an initials-based avatar URL (same service the Anggota page uses).
// Examples: "Achmad Radit" → "AR", "Tim Redaksi HIMA" → "TR" (first 2 words).
function userInitialsAvatar(name) {
    const safeName = encodeURIComponent((name || 'User').trim() || 'User');
    return `https://ui-avatars.com/api/?name=${safeName}&background=4F46E5&color=fff&bold=true&size=128`;
}

function updateAuthUI() {
    const loginBtn = document.getElementById('btn-login');
    const userInfo = document.getElementById('user-info');
    const badge = document.getElementById('admin-edit-badge');

    if (currentUser) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');

        const avatarEl = document.getElementById('user-avatar');
        const fallback = userInitialsAvatar(currentUser.name);
        // Attach error/load handlers BEFORE setting src so a fast-failing
        // image (e.g. cached 404) still triggers the swap.
        delete avatarEl.dataset.fallback;
        avatarEl.removeAttribute('loading'); // eager so handlers fire reliably
        avatarEl.onerror = () => {
            if (avatarEl.dataset.fallback === '1') return;
            avatarEl.dataset.fallback = '1';
            avatarEl.src = fallback;
        };
        avatarEl.onload = () => {
            // Some hosts return 200 with an empty body — treat as failure.
            if (!avatarEl.naturalWidth && avatarEl.dataset.fallback !== '1') {
                avatarEl.dataset.fallback = '1';
                avatarEl.src = fallback;
            }
        };
        avatarEl.src = currentUser.picture || fallback;

        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-email').innerText = currentUser.email;
        if (currentUser.role === 'admin' || currentUser.role === 'developer') {
            badge.classList.remove('hidden');
        }

        // Show the Developer nav buttons (desktop + mobile drawer) only when
        // the signed-in user is a developer. Visitors and admins do not see
        // them at all.
        const isDev = currentUser.role === 'developer';
        const devNav = document.getElementById('nav-developer');
        if (devNav) devNav.classList.toggle('hidden', !isDev);
        const devNavMobile = document.getElementById('mobile-nav-developer');
        if (devNavMobile) devNavMobile.classList.toggle('hidden', !isDev);
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        badge.classList.add('hidden');
        const devNav = document.getElementById('nav-developer');
        if (devNav) devNav.classList.add('hidden');
        const devNavMobile = document.getElementById('mobile-nav-developer');
        if (devNavMobile) devNavMobile.classList.add('hidden');
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}
