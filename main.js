/**
 * main.js — interacciones del clon de surinder.design
 *
 * El sitio original usa Framer Motion (React) para las animaciones de scroll
 * y Embla Carousel para el carrusel de certificaciones. Aquí replico el mismo
 * comportamiento visual con IntersectionObserver + CSS y un carrusel manual
 * en vanilla JS, sin depender de React.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* Movemos el dialog de "How I help" a body: así no hereda ningún
   * stacking context de su sección (position/transform/opacity de los
   * ancestros .reveal) y siempre queda por encima del nav fijo. */
  const serviceDialogEl = document.getElementById('serviceDialog');
  if (serviceDialogEl) document.body.appendChild(serviceDialogEl);

  /* ---------------------------------------------------------------------
   * 1) Scroll reveal — equivalente a whileInView de Framer Motion.
   *    Cada sección con la clase .reveal se anima a opacidad 1 / y:0
   *    la primera vez que entra en el viewport.
   * ------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    // Progressive enhancement: solo ocultamos las secciones DESPUÉS de
    // confirmar que el observer está listo para revelarlas de nuevo.
    // Si algo falla más abajo, nunca dejamos contenido invisible.
    revealEls.forEach((el) => el.classList.add('js-reveal'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
    revealEls.forEach((el) => io.observe(el));

    // Red de seguridad: si por lo que sea una sección se queda sin
    // revelar (p.ej. una captura de página completa sin scroll real,
    // o un timing raro del navegador), la forzamos visible igual.
    window.addEventListener('load', () => {
      setTimeout(() => {
        revealEls.forEach((el) => el.classList.add('is-visible'));
      }, 4000);
    });
  }
  // Sin JS o con "reduce motion": las secciones se quedan visibles desde
  // el HTML/CSS por defecto (no se añade .js-reveal), así que no hace falta
  // ninguna acción adicional aquí.

  /* ---------------------------------------------------------------------
   * 2) "How I help": panel deslizante (dialog), no acordeón.
   *    En el sitio real cada tarjeta es un dialog-trigger de Radix UI que
   *    abre un panel blanco de ancho fijo deslizando desde la derecha,
   *    con overlay oscuro detrás. Aquí un único panel se reutiliza y se
   *    rellena con el contenido de la tarjeta clicada (icono, título,
   *    frase destacada, precio/plazo y enlace).
   * ------------------------------------------------------------------- */
  const serviceDialog = document.getElementById('serviceDialog');
  if (serviceDialog) {
    const panel = serviceDialog.querySelector('.service-dialog-panel');
    const iconEl = serviceDialog.querySelector('.service-dialog-icon');
    const eyebrowEl = serviceDialog.querySelector('.service-dialog-eyebrow');
    const bodyEl = serviceDialog.querySelector('.service-dialog-body');
    let lastTrigger = null;

    const openDialog = (card) => {
      lastTrigger = card.querySelector('.service-toggle');
      iconEl.src = card.querySelector('.service-icon').src;
      eyebrowEl.textContent = card.querySelector('h3').textContent;
      bodyEl.innerHTML = '';
      bodyEl.appendChild(card.querySelector('.service-dialog-source').content.cloneNode(true));
      serviceDialog.classList.add('is-open');
      serviceDialog.setAttribute('aria-hidden', 'false');
      panel.querySelector('.service-dialog-close').focus();
      document.body.style.overflow = 'hidden';
    };
    const closeDialog = () => {
      serviceDialog.classList.remove('is-open');
      serviceDialog.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    };

    document.querySelectorAll('.service-card').forEach((card) => {
      card.addEventListener('click', () => openDialog(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDialog(card); }
      });
    });
    serviceDialog.querySelectorAll('[data-dialog-close]').forEach((el) => {
      el.addEventListener('click', closeDialog);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && serviceDialog.classList.contains('is-open')) closeDialog();
    });
  }

  /* ---------------------------------------------------------------------
   * 3) Carrusel de certificaciones.
   *    Scroll nativo con snap + botones prev/next (el original usa Embla
   *    Carousel; este scroll manual reproduce el mismo gesto de arrastre
   *    y flechas sin añadir una dependencia externa).
   * ------------------------------------------------------------------- */
  const certCarousel = document.getElementById('certCarousel');
  const prevBtn = document.querySelector('.cert-nav-prev');
  const nextBtn = document.querySelector('.cert-nav-next');
  if (certCarousel && prevBtn && nextBtn) {
    const scrollByCard = (dir) => {
      const card = certCarousel.querySelector('.cert-card');
      const gap = 20;
      const distance = (card ? card.offsetWidth : 300) + gap;
      certCarousel.scrollBy({ left: dir * distance, behavior: 'smooth' });
    };
    prevBtn.addEventListener('click', () => scrollByCard(-1));
    nextBtn.addEventListener('click', () => scrollByCard(1));
  }

  /* ---------------------------------------------------------------------
   * 4) Toggle de pricing (Design only / Design + code).
   *    En esta primera versión solo cambia el estado visual del toggle;
   *    los precios "+code" reales se conectan cuando integremos el
   *    contenido definitivo.
   * ------------------------------------------------------------------- */
  const priceToggleBtns = document.querySelectorAll('.price-toggle-btn');
  priceToggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      priceToggleBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* ---------------------------------------------------------------------
   * 5) Tabs de categorías del FAQ.
   * ------------------------------------------------------------------- */
  const faqTabs = document.querySelectorAll('.faq-tab');
  const faqPanels = document.querySelectorAll('.faq-panel');
  faqTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      faqTabs.forEach((t) => t.classList.remove('active'));
      faqPanels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.faq-panel[data-panel="${target}"]`).classList.add('active');
    });
  });

  /* ---------------------------------------------------------------------
   * 6) Acordeón de FAQ: solo una pregunta abierta a la vez dentro del
   *    panel activo (comportamiento tipo Radix Accordion).
   * ------------------------------------------------------------------- */
  document.querySelectorAll('.faq-panel').forEach((panel) => {
    const items = panel.querySelectorAll('.faq-item');
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          items.forEach((other) => {
            if (other !== item) other.open = false;
          });
        }
      });
    });
  });

  /* ---------------------------------------------------------------------
   * 7) Formulario de newsletter — placeholder sin backend.
   * ------------------------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = newsletterForm.querySelector('button');
      const original = btn.textContent;
      btn.textContent = '¡Gracias!';
      setTimeout(() => { btn.textContent = original; }, 2500);
      newsletterForm.reset();
    });
  }

  /* ---------------------------------------------------------------------
   * 8) Nav: resaltar el link activo según la sección visible.
   * ------------------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.nav-links a, .bottom-nav a');
  const sections = Array.from(navLinks)
    .map((a) => a.getAttribute('href'))
    .filter((href) => href && href.length > 1 && href.startsWith('#'))
    .map((href) => document.querySelector(href))
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }
});
