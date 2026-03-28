/**
 * footer.js
 * Injects the footer HTML directly (no fetch) so it works on file:// locally.
 */

(function () {
  const footerElement = document.getElementById('footer');
  if (!footerElement) {
    console.warn('No #footer element found — footer injection skipped.');
    return;
  }

  footerElement.innerHTML = `
    <footer class="footer-container">
      <p>&copy; 2024 16Path &mdash; A VMGMC Initiative. All rights reserved.</p>
    </footer>
  `;
})();