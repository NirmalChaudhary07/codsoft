/* ============================================================
   PORTFOLIO — MAIN JAVASCRIPT
   Sections: Custom Cursor · Scroll Reveal · Active Nav Link
   ============================================================ */

// ----------------------------------------------------------
// 1. Custom Cursor
// ----------------------------------------------------------
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');

let mx = 0, my = 0;   // mouse position
let rx = 0, ry = 0;   // ring (lagged) position

// Move dot instantly
document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
});

// Animate ring with smooth lag
function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
  requestAnimationFrame(animateRing);
}
animateRing();

// Scale cursor on interactive elements
document.querySelectorAll('a, button').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform += ' scale(2)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = cursor.style.transform.replace(' scale(2)', '');
  });
});

// ----------------------------------------------------------
// 2. Scroll Reveal  (IntersectionObserver)
// ----------------------------------------------------------
const revealItems = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Also kick off skill-bar animations inside this element
        entry.target
          .querySelectorAll('.skill-bar-fill')
          .forEach((bar) => bar.classList.add('visible'));

        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

// Skill cells need their own observation so bars animate correctly
document.querySelectorAll('.skill-cell').forEach((cell) =>
  revealObserver.observe(cell)
);

// ----------------------------------------------------------
// 3. Active Navigation Link (highlight on scroll)
// ----------------------------------------------------------
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 200) {
      current = sec.id;
    }
  });

  navLinks.forEach((link) => {
    link.style.color =
      link.getAttribute('href') === '#' + current
        ? 'var(--rust)'
        : '';
  });
});
