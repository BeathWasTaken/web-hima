// Initial Load
window.onload = async () => {
    let pageId = location.pathname.substring(1) || 'home';

    if(pageId === 'home') renderHome();
    if(pageId === 'anggota') renderAnggota();
    if(pageId === 'games') renderGames();
    if(pageId === 'game-detail') renderGameDetail();
    if(pageId === 'admin') renderAdmin();
    if(pageId === 'developer') renderDeveloper();
    if(pageId === 'profile') renderProfile();

    updateActiveNav(pageId);    
    bindScrollReveals();
    updateAuthUI();
};