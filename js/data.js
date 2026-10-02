// --- DATA STATE (LOCAL STORAGE) ---
const defaultDB = {
    hero: { title: "Elevating Student Innovation to The Next Level.", desc: "Wadah integrasi mahasiswa untuk berinovasi, berkolaborasi, dan menciptakan solusi digital bagi masyarakat luas." },
    visi: "Menjadikan Himpunan Mahasiswa Program Studi Teknologi Permainan sebagai wadah yang kreatif dan inovatif dalam mengembangkan potensi serta karya mahasiswa, juga mempersiapkan mahasiswa yang siap menghadapi dunia profesional.",
    misi: [
        "Meningkatkan keterlibatan mahasiswa.",
        "Mendorong dan meningkatkan kepercayaan diri mahasiswa.",
        "Aliansi dan kerjasama.",
        "Meningkatkan kompetensi mahasiswa.",
        "Membangun lingkungan organisasi yang aktif, kolaboratif, dan inspiratif."
    ],
    events: [
        { id: 1, title: "Grand Launching HIMA PRO", date: "2024-12-20", time: "09:00", endTime: "11:00" },
        { id: 2, title: "Tech Workshop Series #1", date: "2024-12-25", time: "13:00", endTime: "16:00" }
    ],
    news: [
        { id: 1,  title: "HIMA Menang Lomba Nasional",                tag: "Prestasi", img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-12-10",
          body: "Tim HIMA Teknologi Permainan kembali mengukir prestasi membanggakan dengan meraih juara pertama dalam ajang kompetisi game development tingkat nasional.\n\nKompetisi yang diikuti oleh lebih dari 50 universitas di Indonesia ini menjadi panggung yang tepat untuk menunjukkan kualitas mahasiswa STMM. Tim mengembangkan sebuah game adventure 2D dengan mekanik unik yang berhasil memikat juri.\n\nKemenangan ini bukan hanya soal trofi, tapi juga validasi bahwa kurikulum dan ekosistem belajar di STMM mampu menghasilkan talenta game development kelas atas. Kami akan terus mendorong mahasiswa untuk berinovasi dan berkompetisi di kancah yang lebih luas." },
        { id: 2,  title: "Kolaborasi dengan Google Cloud",            tag: "Partner",  img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-11-28",
          body: "HIMA Teknologi Permainan resmi menjalin kerja sama strategis dengan Google Cloud untuk mendukung pengembangan game berbasis cloud.\n\nKolaborasi ini mencakup pelatihan eksklusif, akses ke kredit Google Cloud Platform, dan mentoring langsung dari engineer Google. Anggota HIMA aktif akan mendapat prioritas untuk mengikuti program tersebut.\n\nIni adalah langkah penting untuk membawa mahasiswa ke level industri yang sesungguhnya, di mana cloud computing menjadi tulang punggung game multiplayer modern." },
        { id: 3,  title: "Hackathon Internal Diikuti 200 Mahasiswa",  tag: "Event",    img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-11-15",
          body: "Hackathon internal HIMA tahun ini berhasil menarik partisipasi 200 mahasiswa STMM dari berbagai jurusan.\n\nDilaksanakan selama 48 jam non-stop, peserta dibagi ke dalam 50 tim untuk membangun prototype game dari nol. Tema yang diangkat tahun ini adalah \"Game untuk Pendidikan\", mendorong peserta untuk menciptakan solusi edukatif yang menyenangkan.\n\nAcara ditutup dengan presentasi 10 tim terbaik di hadapan juri industri. Tiga tim teratas mendapat hadiah berupa lisensi software, mentoring eksklusif, dan kesempatan inkubasi." },
        { id: 4,  title: "Tim Game Lolos Inkubator Kemenparekraf",    tag: "Prestasi", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-11-05",
          body: "Salah satu tim binaan HIMA berhasil lolos seleksi program inkubator yang diselenggarakan oleh Kementerian Pariwisata dan Ekonomi Kreatif (Kemenparekraf).\n\nProgram inkubasi ini memberikan akses pendanaan, mentoring intensif, dan jaringan distribusi global selama 6 bulan. Tim yang lolos akan mengembangkan game indie mereka menjadi produk siap pasar." },
        { id: 5,  title: "Workshop Unity 3D Bersama Industri",        tag: "Workshop", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-10-22",
          body: "Workshop Unity 3D yang menghadirkan praktisi dari studio game ternama berlangsung selama dua hari di kampus STMM.\n\nMateri mencakup pipeline produksi 3D, optimasi performa, hingga deployment ke berbagai platform. Peserta mendapat kesempatan langsung mempraktikkan setiap modul." },
        { id: 6,  title: "Open Recruitment Pengurus 2024",            tag: "Internal", img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-10-10",
          body: "HIMA membuka pendaftaran pengurus baru periode 2024-2025. Kami mencari mahasiswa yang passionate di bidang game development, desain, atau manajemen organisasi.\n\nPendaftaran dapat dilakukan melalui form yang telah disediakan. Seleksi mencakup tes wawancara dan presentasi portofolio." },
        { id: 7,  title: "Riset AI dengan Lab Kampus",                tag: "Riset",    img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-09-30",
          body: "Anggota HIMA bergabung dengan proyek riset AI di Lab Kampus untuk mengeksplorasi penggunaan machine learning dalam NPC behavior.\n\nProyek ini bertujuan menciptakan AI yang lebih natural dan adaptif untuk game RPG, dengan pendekatan reinforcement learning." },
        { id: 8,  title: "Kunjungan Industri ke Niantic Studio",      tag: "Kunjungan",img: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-09-15",
          body: "30 anggota HIMA berkesempatan mengunjungi studio Niantic untuk melihat langsung pipeline produksi game AR.\n\nKunjungan ini memberikan insight tentang location-based gaming, technical art untuk AR, dan bagaimana studio besar mengelola tim engineering yang tersebar." },
        { id: 9,  title: "Game Demo Day Diikuti 30 Tim",              tag: "Event",    img: "https://images.unsplash.com/photo-1556438064-2d7646166914?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-08-25",
          body: "Game Demo Day tahun ini menghadirkan 30 tim mahasiswa yang memamerkan game in-progress mereka.\n\nPengunjung dapat mencoba langsung setiap demo dan memberikan feedback. Tiga game terbaik berdasarkan voting penonton mendapat penghargaan khusus." },
        { id: 10, title: "MoU dengan Asosiasi Game Indonesia",        tag: "Partner",  img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-08-10",
          body: "Penandatanganan MoU resmi antara HIMA dan Asosiasi Game Indonesia (AGI) menjadi tonggak baru dalam ekosistem game lokal.\n\nKerja sama ini membuka akses anggota HIMA untuk mengikuti event AGI, mendapatkan publikasi di platform mereka, dan terhubung dengan studio anggota asosiasi." },
        { id: 11, title: "Beasiswa Eksklusif untuk Anggota Aktif",    tag: "Internal", img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-07-20",
          body: "HIMA bekerja sama dengan beberapa sponsor untuk menyediakan beasiswa eksklusif bagi anggota aktif.\n\nBeasiswa mencakup biaya kuliah parsial, lisensi software profesional, dan akses ke konferensi internasional. Pendaftaran dibuka melalui portal anggota." },
        { id: 12, title: "Talkshow Karir di Industri Game",           tag: "Talkshow", img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=400",
          author: "Tim Redaksi HIMA", publishedAt: "2024-07-05",
          body: "Talkshow karir menghadirkan tiga praktisi senior dari industri game lokal dan global.\n\nDiskusi mencakup jenjang karir, skill yang paling dicari, hingga tips untuk lulusan baru yang ingin masuk ke industri game. Sesi ditutup dengan QnA dan networking santai." }
    ],
    divisions: [
        { id: "core",     name: "Inti",        color: "#4f46e5" },
        { id: "tech",     name: "Teknologi",   color: "#2563eb" },
        { id: "creative", name: "Kreatif",     color: "#db2777" },
        { id: "media",    name: "Media",       color: "#d97706" }
    ],
    members: [
        { id: 1, name: "Rizky Pratama",     role: "Ketua Umum",         divisionId: "core",     photo: "" },
        { id: 2, name: "Anindya Larasati",  role: "Sekretaris",         divisionId: "core",     photo: "" },
        { id: 3, name: "Dimas Aditya",      role: "Lead Developer",     divisionId: "tech",     photo: "" },
        { id: 4, name: "Sherina Putri",     role: "Frontend Engineer",  divisionId: "tech",     photo: "" },
        { id: 5, name: "Bagas Wirayudha",   role: "UI/UX Designer",     divisionId: "creative", photo: "" },
        { id: 6, name: "Maya Anggraini",    role: "Illustrator",        divisionId: "creative", photo: "" },
        { id: 7, name: "Fariz Ramadhan",    role: "Content Strategist", divisionId: "media",    photo: "" },
        { id: 8, name: "Kirana Salsabila",  role: "Social Media",       divisionId: "media",    photo: "" }
    ],
    advisors: [
        { id: 1, name: "Dr. Bambang Sutrisno, M.Kom.", title: "Pembina Utama", expertise: "Game Engineering & AI", photo: "" },
        { id: 2, name: "Dr. Ratih Wulandari, M.Sn.",   title: "Pembina Kreatif", expertise: "Game Art & Visual Design", photo: "" }
    ],
    gameCategories: [
        { id: 'arcade',    name: 'Arcade'    },
        { id: 'puzzle',    name: 'Puzzle'    },
        { id: 'rpg',       name: 'RPG'       },
        { id: 'casual',    name: 'Kasual'    },
        { id: 'simulation',name: 'Simulasi'  },
        { id: 'strategy',  name: 'Strategi'  }
    ],
    games: [
        {
            id: 1, title: "Aether Realms", developer: "Studio Polaris", categoryId: 'rpg',
            tagline: "Petualangan epic di dunia paralel.",
            description: "Aether Realms adalah ARPG buatan mahasiswa Teknologi Permainan dengan sistem combat real-time dan dunia terbuka.",
            icon: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=200",
            banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
            screenshots: [
                "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600",
                "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=600",
                "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600"
            ],
            rating: 4.7, downloads: 12500, size: "85 MB", version: "1.2.0",
            platforms: ['windows', 'android'],
            featured: true, link: ""
        },
        {
            id: 2, title: "Pixel Pirates", developer: "Dimas Aditya", categoryId: 'arcade',
            tagline: "Bajak laut piksel berburu harta karun.",
            description: "Aksi arcade 2D dengan kontrol satu jari. Dirilis sebagai proyek mahasiswa semester 5.",
            icon: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=200",
            banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200",
            screenshots: [
                "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=600",
                "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=600"
            ],
            rating: 4.5, downloads: 8400, size: "32 MB", version: "0.9.4",
            platforms: ['android', 'ios'],
            featured: false, link: ""
        },
        {
            id: 3, title: "Mind Maze", developer: "Sherina Putri", categoryId: 'puzzle',
            tagline: "Teka-teki yang bikin kamu mikir.",
            description: "100+ level puzzle logika dengan estetika minimalis. Cocok untuk waktu santai.",
            icon: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=200",
            banner: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=1200",
            screenshots: [
                "https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=600",
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"
            ],
            rating: 4.8, downloads: 22000, size: "18 MB", version: "2.1.0",
            platforms: ['android', 'ios', 'web'],
            featured: true, link: ""
        },
        {
            id: 4, title: "Cafe Tycoon STMM", developer: "Tim Kreatif HIMA", categoryId: 'simulation',
            tagline: "Bangun cafe impianmu di kampus.",
            description: "Simulasi bisnis cafe dengan latar kampus STMM. Resep, customer, dan event spesial setiap minggu.",
            icon: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=200",
            banner: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200",
            screenshots: [
                "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600",
                "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=600"
            ],
            rating: 4.3, downloads: 5600, size: "120 MB", version: "1.0.2",
            platforms: ['windows', 'mac'],
            featured: false, link: ""
        },
        {
            id: 5, title: "Rune Tactics", developer: "Bagas Wirayudha", categoryId: 'strategy',
            tagline: "Strategi turn-based dengan rune kuno.",
            description: "Game taktik 6v6 dengan unit, rune, dan map yang bisa di-craft komunitas.",
            icon: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=200",
            banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
            screenshots: [
                "https://images.unsplash.com/photo-1556438064-2d7646166914?q=80&w=600",
                "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=600"
            ],
            rating: 4.6, downloads: 9800, size: "210 MB", version: "1.4.1",
            platforms: ['windows', 'android', 'ios'],
            featured: true, link: ""
        },
        {
            id: 6, title: "Doodle Run", developer: "Maya Anggraini", categoryId: 'casual',
            tagline: "Lari nonstop dengan gaya doodle.",
            description: "Endless runner dengan visual sketsa pensil dan musik chiptune.",
            icon: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=200",
            banner: "https://images.unsplash.com/photo-1556438064-2d7646166914?q=80&w=1200",
            screenshots: [
                "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600"
            ],
            rating: 4.2, downloads: 3400, size: "24 MB", version: "0.7.0",
            platforms: ['android'],
            featured: false, link: ""
        }
    ],
    // userRoles: lookup keyed by lowercased kampus email → role.
    // Anyone signed in with @mail.mmtc.ac.id but NOT in this map is treated
    // as 'visitor'. The bootstrap developer below cannot be deleted in the
    // Developer Menu UI (`isBootstrapDeveloper` guards that).
    userRoles: {
        '02524147443@mail.mmtc.ac.id': 'developer'
    }
};

let db = JSON.parse(localStorage.getItem('hima_super_db')) || defaultDB;
let currentUser = JSON.parse(sessionStorage.getItem('hima_user')) || null;

// Map of legacy named colors → hex equivalent (Tailwind 600 shades).
// Declared up here so the migration below can use it before later code runs.
const LEGACY_COLOR_MAP = {
    indigo: '#4f46e5',
    blue:   '#2563eb',
    pink:   '#db2777',
    amber:  '#d97706',
    emerald:'#059669',
    rose:   '#e11d48',
    slate:  '#475569'
};

// Migrate legacy data so new fields exist for old localStorage entries
(function migrateData() {
    let changed = false;

    // Events
    db.events = (db.events || []).map(ev => {
        const next = { ...ev };
        if (next.date && !/^\d{4}-\d{2}-\d{2}$/.test(next.date)) { next.date = ""; changed = true; }
        if (next.time && /WIB/i.test(next.time)) { next.time = next.time.replace(/\s*WIB/i, "").trim(); changed = true; }
        if (next.endTime === undefined) { next.endTime = ""; changed = true; }
        if (next.endTime && /WIB/i.test(next.endTime)) { next.endTime = next.endTime.replace(/\s*WIB/i, "").trim(); changed = true; }
        return next;
    });

    // Visi & Misi (replaces deprecated `inovasi`)
    if (typeof db.visi !== 'string') { db.visi = defaultDB.visi; changed = true; }
    if (!Array.isArray(db.misi) || db.misi.length === 0) { db.misi = [...defaultDB.misi]; changed = true; }
    if ('inovasi' in db) { delete db.inovasi; changed = true; }

    // News: ensure default seed exists, and assign stable ids if missing
    if (!Array.isArray(db.news) || db.news.length === 0) {
        db.news = JSON.parse(JSON.stringify(defaultDB.news));
        changed = true;
    }
    // Build a title→default-news map so we can backfill body/author for entries
    // that exist in localStorage from before the article-detail feature shipped.
    const defaultNewsByTitle = new Map(defaultDB.news.map(n => [n.title, n]));
    db.news = db.news.map((n, i) => {
        const next = { ...n };
        if (typeof next.id !== 'number') { next.id = Date.now() + i; changed = true; }
        if (typeof next.tag !== 'string') { next.tag = 'Berita'; changed = true; }
        if (typeof next.img !== 'string') { next.img = ''; changed = true; }
        if (typeof next.body !== 'string') { next.body = ''; changed = true; }
        if (typeof next.author !== 'string') { next.author = ''; changed = true; }
        if (typeof next.publishedAt !== 'string') { next.publishedAt = ''; changed = true; }
        // Backfill from defaults when the user hasn't written content yet.
        if ((!next.body || !next.author || !next.publishedAt) && defaultNewsByTitle.has(next.title)) {
            const seed = defaultNewsByTitle.get(next.title);
            if (!next.body && seed.body) { next.body = seed.body; changed = true; }
            if (!next.author && seed.author) { next.author = seed.author; changed = true; }
            if (!next.publishedAt && seed.publishedAt) { next.publishedAt = seed.publishedAt; changed = true; }
        }
        return next;
    });
    // If a previously deployed copy seeded with the old 2-entry dataset is still
    // in localStorage, top it up with the new defaults (preserve user additions).
    if (db.news.length < defaultDB.news.length) {
        const seenTitles = new Set(db.news.map(n => n.title));
        defaultDB.news.forEach((n, i) => {
            if (!seenTitles.has(n.title)) {
                db.news.push({ ...n, id: Date.now() + 1000 + i });
                changed = true;
            }
        });
    }

    // Members & Divisions
    if (!Array.isArray(db.divisions) || db.divisions.length === 0) {
        db.divisions = JSON.parse(JSON.stringify(defaultDB.divisions));
        changed = true;
    }
    if (!Array.isArray(db.members)) {
        db.members = JSON.parse(JSON.stringify(defaultDB.members));
        changed = true;
    }
    // Faculty advisors (dosen pembina) — seed defaults if missing, otherwise
    // make sure each entry has the expected fields.
    if (!Array.isArray(db.advisors)) {
        db.advisors = JSON.parse(JSON.stringify(defaultDB.advisors));
        changed = true;
    } else {
        db.advisors = db.advisors.map((a, i) => {
            const next = { ...a };
            if (typeof next.id !== 'number') { next.id = Date.now() + 3000 + i; changed = true; }
            if (typeof next.name !== 'string') { next.name = ''; changed = true; }
            if (typeof next.title !== 'string') { next.title = ''; changed = true; }
            if (typeof next.expertise !== 'string') { next.expertise = ''; changed = true; }
            if (typeof next.photo !== 'string') { next.photo = ''; changed = true; }
            return next;
        });
    }
    // Reset orphan divisionId references to first available division (or empty if none).
    const validDivIds = new Set(db.divisions.map(d => d.id));
    db.members = db.members.map(m => {
        if (m.divisionId && !validDivIds.has(m.divisionId)) { changed = true; return { ...m, divisionId: "" }; }
        return m;
    });
    // Migrate legacy named division colors (e.g. "indigo") to hex.
    db.divisions = db.divisions.map(d => {
        if (d.color && !/^#/.test(String(d.color))) {
            changed = true;
            return { ...d, color: LEGACY_COLOR_MAP[d.color] || '#475569' };
        }
        return d;
    });

    // Games & game categories
    if (!Array.isArray(db.gameCategories) || db.gameCategories.length === 0) {
        db.gameCategories = JSON.parse(JSON.stringify(defaultDB.gameCategories));
        changed = true;
    }
    if (!Array.isArray(db.games)) {
        db.games = JSON.parse(JSON.stringify(defaultDB.games));
        changed = true;
    }
    // Top-up: jika seed sebelumnya berbeda jumlah, ambil game baru dari default
    if (db.games.length < defaultDB.games.length) {
        const seenTitles = new Set(db.games.map(g => g.title));
        defaultDB.games.forEach((g, i) => {
            if (!seenTitles.has(g.title)) {
                db.games.push({ ...g, id: Date.now() + 2000 + i });
                changed = true;
            }
        });
    }
    // Reset orphan categoryId references
    const validCatIds = new Set(db.gameCategories.map(c => c.id));
    // Build a title→default-game map so we can backfill platforms[] for games
    // that exist in localStorage from before the platform feature shipped.
    const defaultGameByTitle = new Map(defaultDB.games.map(g => [g.title, g]));
    db.games = db.games.map(g => {
        const next = { ...g };
        if (!Array.isArray(next.screenshots)) { next.screenshots = []; changed = true; }
        if (typeof next.featured !== 'boolean') { next.featured = false; changed = true; }
        if (!Array.isArray(next.platforms)) { next.platforms = []; changed = true; }
        // If platforms[] is empty AND we have a known seed for this title,
        // copy the default platforms so the filter chips actually match data.
        if (next.platforms.length === 0 && defaultGameByTitle.has(next.title)) {
            const seed = defaultGameByTitle.get(next.title);
            if (Array.isArray(seed.platforms) && seed.platforms.length) {
                next.platforms = [...seed.platforms];
                changed = true;
            }
        }
        if (typeof next.rating !== 'number') { next.rating = 0; changed = true; }
        if (typeof next.downloads !== 'number') { next.downloads = 0; changed = true; }
        if (next.categoryId && !validCatIds.has(next.categoryId)) { next.categoryId = ''; changed = true; }
        return next;
    });

    // User roles map. Always ensure the bootstrap developer is present so
    // the user with the seed account never loses access.
    if (!db.userRoles || typeof db.userRoles !== 'object') {
        db.userRoles = JSON.parse(JSON.stringify(defaultDB.userRoles));
        changed = true;
    }
    for (const [email, role] of Object.entries(defaultDB.userRoles)) {
        if (db.userRoles[email] !== role) {
            db.userRoles[email] = role;
            changed = true;
        }
    }

    if (changed) localStorage.setItem('hima_super_db', JSON.stringify(db));
})();
