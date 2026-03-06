/* ============================================= */
/*  GLOBAL STATE                                 */
/* ============================================= */
let scale = 1, translateX = 0, translateY = 0;
let isDragging = false, startX, startY;
let currentIndex = 0, currentGroup = '';
let groupedImages = {};

/* DOM refs */
let modal, zoomWrapper, popupImg, closeBtn, prevBtn, nextBtn;
let modalCaption = null;

/* Utility */
const $ = (s, r = document) => r.querySelector(s);

/* ============================================= */
/*  FLIPPABLE (unchanged)                        */
/* ============================================= */
/*function flipImage(el) { el.classList.toggle('flipped'); }*/

/* ============================================= */
/*  INITIALISE                                   */
/* ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // modal refs

  modal       = $('.modal');
  modalCaption = $('.modal-caption', modal);
  zoomWrapper = $('.zoom-wrapper', modal);
  popupImg    = $('img', zoomWrapper);
  closeBtn    = $('.close', modal);
  prevBtn     = $('.nav-arrow.prev', modal);
  nextBtn     = $('.nav-arrow.next', modal);

  // ---- BUILD groupedImages (one entry per data-group) ----
  document.querySelectorAll('.zoom-group').forEach(groupEl => {
    const groupName = groupEl.dataset.group;
    if (!groupedImages[groupName]) groupedImages[groupName] = [];

    groupEl.querySelectorAll('.zoom img').forEach(img => {
      groupedImages[groupName].push({ src: img.src, alt: img.alt || '' ,caption: img.dataset.caption || img.alt || ''});
    });
  });

  // ---- SHOW ONLY FIRST thumbnail of each group ----
  Object.entries(groupedImages).forEach(([group, imgs]) => {
    const containers = document.querySelectorAll(`.zoom-group[data-group="${group}"] .zoom`);
    containers.forEach((c, i) => {
      if (i === 0) {
        c.classList.add('visible');
        c.querySelector('img').addEventListener('click', e => {
          e.stopPropagation();
          openModalByIndex(group, 0);
        });
      } else {
        c.classList.add('hidden');
      }
    });
  });

  // ---- navigation ----
  if (prevBtn) prevBtn.addEventListener('click', () => changeImage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeImage(1));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // click outside / ESC
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ---- zoom & pan (guarded) ----
  if (zoomWrapper && popupImg) {
    zoomWrapper.style.cursor = 'grab';

    zoomWrapper.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(Math.max(scale + delta, 1), 5);
      updateTransform();
    });

    zoomWrapper.addEventListener('mousedown', e => {
      if (scale <= 1) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      zoomWrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      if (zoomWrapper) zoomWrapper.style.cursor = 'grab';
    });
  }

  updateArrows();
});

/* ============================================= */
/*  CORE FUNCTIONS                               */
/* ============================================= */


function updateCaption() {
  if (!modalCaption) return;
  const items = groupedImages[currentGroup];
  if (!items || !items[currentIndex]) {
    modalCaption.textContent = '';
    return;
  }
  modalCaption.textContent = items[currentIndex].caption || items[currentIndex].alt || 'Untitled';
}

function openModalByIndex(groupName, idx) {
  const items = groupedImages[groupName];
  if (!items?.length || !modal || !popupImg) return;

  currentGroup = groupName;
  currentIndex = Math.max(0, Math.min(idx, items.length - 1));

  popupImg.src = items[currentIndex].src;
  popupImg.alt = items[currentIndex].alt;
  modal.style.display = 'flex';   // flex centers the image
  resetZoom();
  updateArrows();
  updateCaption();
}

function changeImage(dir) {
  const items = groupedImages[currentGroup];
  if (!items) return;
  currentIndex = (currentIndex + dir + items.length) % items.length;
  popupImg.src = items[currentIndex].src;
  popupImg.alt = items[currentIndex].alt;
  resetZoom();
  updateArrows();
  updateCaption();
}

function closeModal() {
  if (!modal) return;
  modal.style.display = 'none';
  popupImg.src = '';
  currentGroup = '';
  resetZoom();
}

function resetZoom() {
  scale = 1; translateX = 0; translateY = 0; isDragging = false;
  if (zoomWrapper) zoomWrapper.style.cursor = 'grab';
  updateTransform();
}

function updateTransform() {
  if (!popupImg) return;
  popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function updateArrows() {
  const count = groupedImages[currentGroup]?.length || 0;
  const show = count > 1;
  if (prevBtn) prevBtn.style.display = show ? 'block' : 'none';
  if (nextBtn) nextBtn.style.display = show ? 'block' : 'none';
}

// For Tabs
document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.list-group-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to the clicked tab
            this.classList.add('active');

            // Hide all tab panes
            tabPanes.forEach(pane => pane.classList.remove('active'));
            // Show the corresponding tab pane
            const target = document.querySelector(this.getAttribute('href'));
            target.classList.add('active');
        });
    });
});

// Select all the tabs and content divs
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content');

// Function to clear active classes and hide all content
function clearActiveClasses() {
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.style.display = 'none');
}

// Function to activate the clicked tab and show the corresponding content
function activateTab(tab) {
    const targetId = tab.getAttribute('data-target'); // Get the target content ID

    // Clear previous active states
    clearActiveClasses();

    // Activate the clicked tab
    tab.classList.add('active');

    // Show the corresponding content
    document.querySelector(targetId).style.display = 'block';
}

// Add click event listeners to all tabs
tabs.forEach(tab => {
    tab.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent default link behavior
        activateTab(this); // Activate the clicked tab
    });
});

// Initialize the first tab as active (in case JavaScript loads late)
document.addEventListener('DOMContentLoaded', () => {
    activateTab(document.querySelector('.tab.active'));
});
