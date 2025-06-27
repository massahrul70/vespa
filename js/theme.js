// Theme Management
document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('theme-switch');
  
  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = savedTheme;
  
  // Set the switch position based on the current theme
  if (themeSwitch) {
    themeSwitch.checked = savedTheme === 'dark';
    
    // Listen for theme switch changes
    themeSwitch.addEventListener('change', () => {
      const newTheme = themeSwitch.checked ? 'dark' : 'light';
      document.body.dataset.theme = newTheme;
      localStorage.setItem('theme', newTheme);
    });
  }
  
  // Sidebar toggle functionality
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarToggle && sidebar) {
    // Load sidebar state from localStorage
    const sidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarState) {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
    }
    
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed');
      
      // Save sidebar state to localStorage
      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
  }
});