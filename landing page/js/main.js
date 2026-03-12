/* ============================================================
   LUMINARY — MAIN JAVASCRIPT
   Sections:
   1. Scroll Reveal (IntersectionObserver)
   2. Header shrink on scroll
   3. Smooth active nav highlighting
   ============================================================ */

// ----------------------------------------------------------
// 1. Scroll Reveal
// ----------------------------------------------------------
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

revealEls.forEach((el) => revealObserver.observe(el));

// ----------------------------------------------------------
// 2. Header: add 'scrolled' class when user scrolls down
// ----------------------------------------------------------
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ----------------------------------------------------------
// 3. Active nav link highlighting on scroll
// ----------------------------------------------------------
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.style.color = isActive ? 'var(--text)' : '';
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach((sec) => sectionObserver.observe(sec));
