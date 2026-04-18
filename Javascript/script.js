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
/*  FLIPPABLE                                    */
/* ============================================= */
function flipImage(el) {
  el.classList.toggle('flipped');
}

/* ============================================= */
/*  INITIALISE                                   */
/* ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // modal refs
  modal = $('.modal');
  modalCaption = $('.modal-caption', modal);
  zoomWrapper = $('.zoom-wrapper', modal);
  popupImg = $('img', zoomWrapper);
  closeBtn = $('.close', modal);
  prevBtn = $('.nav-arrow.prev', modal);
  nextBtn = $('.nav-arrow.next', modal);

  // BUILD groupedImages (one entry per data-group)
  document.querySelectorAll('.zoom-group').forEach(groupEl => {
    const groupName = groupEl.dataset.group;
    // RESET (important)
    groupedImages[groupName] = [];
    Array.from(groupEl.children).forEach(zoomDiv => {
      const img = zoomDiv.querySelector("img");
      if (img) {
        groupedImages[groupName].push({
          src: img.src,
          alt: img.alt || '',
          caption: img.dataset.caption || img.alt || ''
        });
      }
    });
  });

  // DEBUG: Log first 2 groups sample
  console.log('DEBUG groupedImages sample:', JSON.stringify(
    Object.fromEntries(Object.entries(groupedImages).slice(0, 2)),
    null, 2
  ));


  // SHOW ONLY FIRST thumbnail of each group
  // NOTE: Do NOT add another addEventListener here — the inline onclick on each
  // first-image in the HTML already calls openModalByIndex. Adding a second
  // listener here would cause openModalByIndex to fire TWICE per click, which
  // makes navigation appear to skip every other image.
  Object.entries(groupedImages).forEach(([group, imgs]) => {
    const containers = document.querySelectorAll(`.zoom-group[data-group="${group}"] .zoom`);
    containers.forEach((c, i) => {
      if (i === 0) {
        c.classList.add('visible');
        // NO extra click listener here — handled by inline onclick in HTML
      } else {
        c.classList.add('hidden');
      }
    });
  });

  // navigation arrow buttons
  // NOTE: The HTML arrows already have inline onclick="changeImage(±1)" so we
  // must NOT add addEventListener here as well — that would double-fire every
  // arrow click and skip images. Same for the close button (inline closePop()).
  // All three are handled exclusively via inline onclick in museum.html.

  // click outside / ESC  — handles both image AND video modals
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Video modal: close on backdrop click
  const videoModal = document.getElementById('videoModal');
  videoModal?.addEventListener('click', e => { if (e.target === videoModal) closeVideoModal(); });

  // ESC closes whichever modal is open
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (videoModal && videoModal.style.display === 'flex') {
        closeVideoModal();
      } else {
        closeModal();
      }
    }
  });

  // Keyboard (Enter / Space) activation for video-box thumbnail cards
  document.querySelectorAll('.video-box').forEach(box => {
    box.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        box.click();
      }
    });
  });

  // zoom & pan
  if (zoomWrapper && popupImg) {
    zoomWrapper.style.cursor = 'grab';

    zoomWrapper.addEventListener('wheel', e => {
      e.preventDefault();
      // Scroll ONLY zooms — it does NOT navigate images.
      // Combining both in the same handler caused changeImage() to run on every
      // scroll tick, making navigation appear to skip images when scrolling.
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

  console.log(`DEBUG openModal: group=${groupName}, idx=${idx}, total=${items?.length || 0}`);

  currentGroup = groupName;
  currentIndex = Math.max(0, Math.min(idx, items.length - 1));

  const targetSrc = items[currentIndex].src;
  const targetAlt = items[currentIndex].alt;
  popupImg.alt = targetAlt;
  popupImg.style.opacity = '0.5';
  // Clear old handlers before assigning src to avoid stale callbacks
  popupImg.onload = null;
  popupImg.onerror = null;
  setTimeout(() => {
    popupImg.onload  = () => { console.log('DEBUG img load OK:', targetSrc); popupImg.style.opacity = '1'; };
    popupImg.onerror = () =>   console.log('DEBUG img LOAD ERROR:', targetSrc);
    if (popupImg.src === targetSrc) {
      // src unchanged — browser won't fire onload again; force it
      popupImg.style.opacity = '1';
    } else {
      popupImg.src = targetSrc;
    }
  }, 50);
  modal.style.display = 'flex';
  resetZoom();
  updateArrows();
  updateCaption();
}

function changeImage(dir) {
  const items = groupedImages[currentGroup];
  if (!items) return;
  const oldIndex = currentIndex;
  currentIndex = (currentIndex + dir + items.length) % items.length;
  const targetSrc = items[currentIndex].src;
  const targetAlt = items[currentIndex].alt;
  console.log(`DEBUG changeImage: dir=${dir}, oldIdx=${oldIndex}, newIdx=${currentIndex}, total=${items.length}, src="${targetSrc}"`);
  popupImg.alt = targetAlt;
  popupImg.style.opacity = '0.5';
  // Clear old handlers before assigning src to avoid stale callbacks
  popupImg.onload = null;
  popupImg.onerror = null;
  setTimeout(() => {
    popupImg.onload  = () => { console.log('DEBUG img load OK:', targetSrc); popupImg.style.opacity = '1'; };
    popupImg.onerror = () =>   console.log('DEBUG img LOAD ERROR:', targetSrc);
    if (popupImg.src === targetSrc) {
      // src unchanged — browser won't re-fire onload; show image directly
      popupImg.style.opacity = '1';
    } else {
      popupImg.src = targetSrc;
    }
  }, 50);
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

// Scoped Tabs for each section
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.box-container[data-section]').forEach(sectionEl => {
    const tabs = sectionEl.querySelectorAll('.list-group-item');
    const tabPanes = sectionEl.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();

        // Remove active class from tabs in this section only
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to the clicked tab
        this.classList.add('active');

        // Hide tab panes in this section only
        tabPanes.forEach(pane => pane.classList.remove('active'));
        // Show the corresponding tab pane
        const target = sectionEl.querySelector(this.getAttribute('href'));
        if (target) target.classList.add('active');
      });
    });
  });
});

// Single image popup (for backward compatibility)
function openPopup(img) {
  if (!img.dataset.caption) img.dataset.caption = img.alt || 'Image';
  openModalByIndex('single', 0); // Use dummy group, single image
  popupImg.src = img.src;
  modalCaption.textContent = img.dataset.caption;
  modal.style.display = 'flex';
}

/* ============================================= */
/*  VIDEO MODAL                                  */
/* ============================================= */

/**
 * Opens the video modal and loads the YouTube embed.
 * Called via onclick on .video-box thumbnail cards.
 *
 * @param {string} videoId  - YouTube video ID  (e.g. 'u-s4oOwh4kQ')
 * @param {string} [title]  - Optional title shown below the player
 */
function openVideoModal(videoId, title) {
  const modal  = document.getElementById('videoModal');
  const iframe = document.getElementById('popupVideo');
  const titleEl = document.getElementById('videoModalTitle');

  if (!modal || !iframe) return;

  // Build a proper embed URL:
  //   - autoplay=1  → starts playing immediately
  //   - rel=0       → no related-video redirect at end
  //   - modestbranding=1 → minimal YouTube branding
  //   - enablejsapi=1    → lets us stop playback on close
  iframe.src = `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;

  if (titleEl) titleEl.textContent = title || '';

  // display:flex triggers the CSS fade-in animation
  modal.style.display = 'flex';

  // Prevent page scroll while modal is open
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the video modal and stops the video by clearing iframe src.
 * This is the ONLY reliable cross-browser way to stop a YouTube iframe
 * without the YouTube IFrame API.
 */
function closeVideoModal() {
  const modal  = document.getElementById('videoModal');
  const iframe = document.getElementById('popupVideo');
  const titleEl = document.getElementById('videoModalTitle');

  if (!modal) return;

  modal.style.display = 'none';

  // Clearing src stops the video immediately (no audio bleed-through)
  if (iframe) iframe.src = '';
  if (titleEl) titleEl.textContent = '';

  // Restore page scroll
  document.body.style.overflow = '';
}

// Legacy aliases kept so any other page/code using the old names still works
function openVideoPopup(iframe) {
  const src = (iframe && iframe.src) ? iframe.src : '';
  const m   = src.match(/embed\/([^?&]+)/);
  openVideoModal(m ? m[1] : src, '');
}
function closeVideoPopup() { closeVideoModal(); }

// Legacy closePop compatibility
function closePop() {
  closeModal();
}

