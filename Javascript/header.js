// Fetch and inject the header HTML, then attach event listeners after it's inserted.
const headerElement = document.getElementById("header");
if (!headerElement) {
  console.warn('No #header element found in document — header import skipped.');
} else {
  fetch("header.html")
    .then((response) => response.text())
    .then((html) => {
      headerElement.innerHTML = html;
      // Now that the header markup is present in the DOM, attach event listeners.
      attachHeaderEventListeners();
    })
    .catch((err) => console.error('Failed to load header.html:', err));
}

// Fallback: in case header markup is already present server-side, attach on DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
  // Try to attach if header markup was already present server-side. attachHeaderEventListeners
  // returns true when it found the menu/buttons and attached listeners.
  attachHeaderEventListeners();
});

function attachHeaderEventListeners() {
  const menu = document.querySelector('.menu');
  const openMenuBtn = document.querySelector('.header-right .open-menu-btn');
  const closeMenuBtn = document.querySelector('.close-menu-btn');

  if (!menu || !openMenuBtn || !closeMenuBtn) {
    // silently return false so callers can decide whether to retry.
    return false;
  }

  // Open hamburger menu
  openMenuBtn.addEventListener('click', () => {
    menu.classList.add('open');
  });

  // Close hamburger menu
  closeMenuBtn.addEventListener('click', () => {
    menu.classList.remove('open');
  });

  // Close menu when clicking any link in mobile/tablet view
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 840) {
        menu.classList.remove('open');
      }
    });
  });

  // Optional: Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 840 &&
      !menu.contains(e.target) &&
      !openMenuBtn.contains(e.target)
    ) {
      menu.classList.remove('open');
    }
  });

  // Optional: Close menu on window resize if moving to desktop view
  window.addEventListener('resize', () => {
    if (window.innerWidth > 840) {
      menu.classList.remove('open');
    }
  });
  return true;
}
