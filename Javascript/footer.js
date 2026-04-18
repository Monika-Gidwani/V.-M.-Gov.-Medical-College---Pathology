/**
 * footer.js
 * Injects the footer HTML + styles directly so it works on file:// locally
 * and does not depend on footer.css being linked in every page.
 */

(function () {
  const footerElement = document.getElementById('footer');
  if (!footerElement) {
    console.warn('No #footer element found — footer injection skipped.');
    return;
  }

  // Inject scoped styles once (guard against double-injection)
  if (!document.getElementById('footer-injected-styles')) {
    const style = document.createElement('style');
    style.id = 'footer-injected-styles';
    style.textContent = `
      .footer-container {
        background-color: #3C4142;
        margin-top: 2vh;
        width: 100%;
      }
      .footer-text {
        display: block;
        width: 100%;
        margin: 0;
        padding: 0.9rem 1rem;
        background-color: #3C4142;
        color: #e8e8e8;
        font-size: clamp(11px, 1.1vw, 14px);
        font-family: 'Open Sans', sans-serif;
        text-align: center;
        letter-spacing: 0.01em;
        box-sizing: border-box;
      }
      @media (max-width: 860px) { .footer-text { font-size: 2.1vw; } }
      @media (max-width: 600px) { .footer-text { font-size: 3.2vw; padding: 0.75rem; } }
    `;
    document.head.appendChild(style);
  }

  footerElement.innerHTML = `
    <footer class="footer-container">
      <p class="footer-text">All rights reserved by Dr. V. M. Govt. Medical College, Solapur | &copy; 2026</p>
    </footer>
  `;
})();