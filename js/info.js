/* ============================================
   VaultDrop — Info Modals Logic
   Handles: About Us, Privacy Policy, Contact
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('infoModal');
    const modalTitle = document.getElementById('infoTitle');
    const modalBody = document.getElementById('infoBody');
    const closeBtn = document.getElementById('closeInfoModal');
    
    if (!modal) return;
  
    const contentMap = {
      'privacy': {
        title: 'Privacy Policy',
        body: '<p>We respect your privacy. This website does not collect personal data except for basic analytics and file uploads. Google AdSense may use cookies to show ads.</p>'
      },
      'about': {
        title: 'About Us',
        body: '<p>VaultDrop is a secure file sharing platform that allows users to upload and share files quickly without login.</p>'
      },
      'contact': {
        title: 'Contact',
        body: '<p>Email: <a href="mailto:thelocalgrowthstudio@gmail.com" style="color:var(--accent); text-decoration: none;">thelocalgrowthstudio@gmail.com</a></p>'
      }
    };
  
    function openInfoModal(type) {
      if (contentMap[type]) {
        modalTitle.textContent = contentMap[type].title;
        modalBody.innerHTML = contentMap[type].body;
        modal.classList.add('is-open');
      }
    }
  
    function closeInfo() {
      modal.classList.remove('is-open');
    }
  
    document.getElementById('linkPrivacy')?.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('privacy'); });
    document.getElementById('linkAbout')?.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('about'); });
    document.getElementById('linkContact')?.addEventListener('click', (e) => { e.preventDefault(); openInfoModal('contact'); });
    
    closeBtn?.addEventListener('click', closeInfo);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeInfo();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeInfo();
    });
  });
  
