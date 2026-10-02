// --- APP MODAL (replaces native alert / confirm / prompt) ---
// All modals share #app-modal in index.html. We swap copy, icon, and action
// buttons per call. Returns a Promise that resolves with the user's choice:
//   showAlert(...)   → resolves to true when dismissed
//   showConfirm(...) → resolves to true (confirm) or false (cancel)
//   showPrompt(...)  → resolves to the entered string, or null when cancelled
const APP_MODAL_ICONS = {
    info:    { bg: 'bg-indigo-50',  text: 'text-indigo-600',  svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-600', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
    warn:    { bg: 'bg-amber-50',   text: 'text-amber-600',   svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>' },
    danger:  { bg: 'bg-red-50',     text: 'text-red-600',     svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>' },
    question:{ bg: 'bg-indigo-50',  text: 'text-indigo-600',  svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' }
};

let _appModalResolve = null;
let _appModalKeyHandler = null;

function _renderAppIcon(kind) {
    const conf = APP_MODAL_ICONS[kind] || APP_MODAL_ICONS.info;
    const iconEl = document.getElementById('app-modal-icon');
    iconEl.className = `w-16 h-16 mb-5 rounded-2xl flex items-center justify-center ${conf.bg} ${conf.text}`;
    iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${conf.svg}</svg>`;
}

function _closeAppModal(value) {
    const modal = document.getElementById('app-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (_appModalKeyHandler) {
        document.removeEventListener('keydown', _appModalKeyHandler);
        _appModalKeyHandler = null;
    }
    const resolve = _appModalResolve;
    _appModalResolve = null;
    if (resolve) resolve(value);
}

function _openAppModal({ icon = 'info', title, message = '', input = null, actions }) {
    const modal = document.getElementById('app-modal');
    document.getElementById('app-modal-title').innerText = title;
    document.getElementById('app-modal-message').innerText = message;
    _renderAppIcon(icon);

    // Input field (for prompt)
    const inputEl = document.getElementById('app-modal-input');
    if (input) {
        inputEl.classList.remove('hidden');
        inputEl.value = input.value || '';
        inputEl.placeholder = input.placeholder || '';
        inputEl.type = input.type || 'text';
    } else {
        inputEl.classList.add('hidden');
        inputEl.value = '';
    }

    // Action buttons
    const actionsEl = document.getElementById('app-modal-actions');
    actionsEl.innerHTML = '';
    actions.forEach(a => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const tone = a.tone || 'neutral';
        const toneCls = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
            danger:  'bg-red-600 text-white hover:bg-red-700',
            neutral: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }[tone] || 'bg-slate-100 text-slate-700 hover:bg-slate-200';
        btn.className = `flex-1 py-3 rounded-2xl font-bold text-sm transition ${toneCls}`;
        btn.innerText = a.label;
        btn.addEventListener('click', () => {
            const val = a.value !== undefined ? a.value : (a.role === 'submit' ? inputEl.value : false);
            _closeAppModal(val);
        });
        actionsEl.appendChild(btn);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Focus input or last action
    setTimeout(() => {
        if (input) inputEl.focus();
        else actionsEl.querySelector('button:last-child')?.focus();
    }, 50);

    // Keyboard: Escape → cancel, Enter → primary/submit
    _appModalKeyHandler = (e) => {
        if (e.key === 'Escape') {
            const cancelAction = actions.find(a => a.role === 'cancel');
            _closeAppModal(cancelAction ? (cancelAction.value !== undefined ? cancelAction.value : false) : false);
        } else if (e.key === 'Enter') {
            const submit = actions.find(a => a.role === 'submit') || actions.find(a => a.tone === 'primary' || a.tone === 'danger');
            if (submit) {
                const val = submit.value !== undefined ? submit.value : (submit.role === 'submit' ? inputEl.value : true);
                _closeAppModal(val);
            }
        }
    };
    document.addEventListener('keydown', _appModalKeyHandler);
}

function showAlert(message, { title = 'Pemberitahuan', icon = 'info', okLabel = 'OK' } = {}) {
    return new Promise(resolve => {
        _appModalResolve = resolve;
        _openAppModal({
            icon, title, message,
            actions: [{ label: okLabel, tone: 'primary', value: true, role: 'submit' }]
        });
    });
}

function showConfirm(message, { title = 'Konfirmasi', icon = 'question', okLabel = 'Ya', cancelLabel = 'Batal', danger = false } = {}) {
    return new Promise(resolve => {
        _appModalResolve = resolve;
        _openAppModal({
            icon: danger ? 'danger' : icon, title, message,
            actions: [
                { label: cancelLabel, tone: 'neutral', value: false, role: 'cancel' },
                { label: okLabel, tone: danger ? 'danger' : 'primary', value: true, role: 'submit' }
            ]
        });
    });
}

function showPrompt(message, { title = 'Masukan', icon = 'info', placeholder = '', defaultValue = '', okLabel = 'Simpan', cancelLabel = 'Batal' } = {}) {
    return new Promise(resolve => {
        _appModalResolve = resolve;
        _openAppModal({
            icon, title, message,
            input: { value: defaultValue, placeholder },
            actions: [
                { label: cancelLabel, tone: 'neutral', value: null, role: 'cancel' },
                { label: okLabel, tone: 'primary', role: 'submit' }
            ]
        });
    });
}
