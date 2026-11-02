/**
 * Talk.me UI Interactions & Reveal Observer
 */

function initUIInteractions() {
  // 1. Reveal on scroll (Apple cinematic reveal)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    revealObserver.observe(el);
  });

  // 2. Responsive Mobile Menu Drawer
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });
  }

  // Close mobile drawer when link clicked
  document.querySelectorAll('.mobile-menu-drawer .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileDrawer) mobileDrawer.classList.remove('open');
    });
  });

  // 3. FAQs Accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('active');
      const icon = btn.querySelector('span:last-child');
      if (icon) {
        icon.textContent = item.classList.contains('active') ? '−' : '+';
      }
    });
  });

  // 4. Contact Form submit listener
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentDict = typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang] 
        ? TRANSLATIONS[currentLang].contact 
        : null;
      const alertMsg = currentDict && currentDict.alertMsg 
        ? currentDict.alertMsg 
        : 'Mensaje recibido. El equipo técnico te contactará en breve.';
      alert(alertMsg);
      contactForm.reset();
    });
  }
}
