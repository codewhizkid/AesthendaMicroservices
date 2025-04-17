/**
 * Shared navigation component to include in all pages
 */
class Navigation {
  constructor(elementId = 'navbar-container') {
    this.elementId = elementId;
  }

  render() {
    const container = document.getElementById(this.elementId);
    if (!container) return;

    container.innerHTML = `
      <nav class="w-full bg-white bg-opacity-90 py-4 px-6 shadow-sm">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" class="font-serif text-2xl font-bold text-spa-dark">AESTHENDA</a>
          <ul class="flex space-x-6">
            <li><a href="/" class="text-spa-brown hover:text-spa-olive transition-colors">Home</a></li>
            <li><a href="/login" class="text-spa-brown hover:text-spa-olive transition-colors">Login</a></li>
            <li><a href="/register" class="text-spa-brown hover:text-spa-olive transition-colors">Register</a></li>
            <li><a href="/calendar" class="text-spa-brown hover:text-spa-olive transition-colors">Calendar</a></li>
            <li><a href="/admin" class="text-spa-brown hover:text-spa-olive transition-colors">Admin</a></li>
          </ul>
        </div>
      </nav>
    `;
  }

  /**
   * Highlight the current active page in the navigation
   */
  highlightCurrentPage() {
    const links = document.querySelectorAll(`#${this.elementId} a`);
    const currentPath = window.location.pathname;
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || 
         (href !== '/' && currentPath.startsWith(href))) {
        link.classList.add('text-spa-olive', 'font-semibold');
        link.classList.remove('text-spa-brown');
      }
    });
  }

  /**
   * Initialize the navigation
   */
  init() {
    this.render();
    this.highlightCurrentPage();
  }
}

// Export for use in other files
window.Navigation = Navigation; 